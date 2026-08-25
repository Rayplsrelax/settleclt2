import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import {
  hasExactBusinessClaimIdentityUniqueIndex,
  inspectMigrationState,
  readMigrationPlan,
  resolveExpectedMigration,
} from "../scripts/migration-ledger-lib.mjs";

const drizzleRoot = resolve("drizzle");
const journalPath = resolve(drizzleRoot, "meta/_journal.json");

type JournalEntry = {
  idx: number;
  when: number;
  tag: string;
};

type Journal = {
  entries: JournalEntry[];
};

function readJournal(): Journal {
  return JSON.parse(readFileSync(journalPath, "utf8")) as Journal;
}

function canonicalMigrationTags(): string[] {
  return readdirSync(drizzleRoot)
    .filter(file => /^\d{4}_.+\.sql$/.test(file))
    .map(file => file.slice(0, -4))
    .sort();
}

describe("canonical migration journal", () => {
  it("represents every numbered migration from 0000 through 0033 exactly once", () => {
    const canonical = canonicalMigrationTags();
    const expectedNumbers = Array.from({ length: 34 }, (_, index) =>
      String(index).padStart(4, "0")
    );

    expect(canonical.map(tag => tag.slice(0, 4))).toEqual(expectedNumbers);

    const journalTags = readJournal().entries.map(entry => entry.tag);
    expect(new Set(journalTags).size).toBe(journalTags.length);
    expect(journalTags).toEqual(canonical);
  });

  it("only references matching migration files", () => {
    for (const entry of readJournal().entries) {
      expect(canonicalMigrationTags()).toContain(entry.tag);
      expect(
        readFileSync(resolve(drizzleRoot, `${entry.tag}.sql`), "utf8").length
      ).toBeGreaterThan(0);
    }
  });

  it("has contiguous indices, strictly increasing unique timestamps, and 0033 at the tip", () => {
    const entries = readJournal().entries;

    expect(entries.map(entry => entry.idx)).toEqual(
      Array.from({ length: entries.length }, (_, index) => index)
    );
    expect(new Set(entries.map(entry => entry.when)).size).toBe(entries.length);
    for (let index = 1; index < entries.length; index += 1) {
      expect(entries[index].when).toBeGreaterThan(entries[index - 1].when);
    }
    expect(entries.at(-1)?.tag).toBe("0033_business_claim_identity_unique");
  });
});

describe("migration pre-deploy inspection", () => {
  it("exposes a SELECT-only fail-closed preflight command", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve("package.json"), "utf8")
    );
    const source = readFileSync(
      resolve("scripts/preflight-migration-state.mjs"),
      "utf8"
    );
    const schemaSource = readFileSync(
      resolve("scripts/migration-schema-lib.mjs"),
      "utf8"
    );

    expect(packageJson.scripts["db:preflight-migrations"]).toBe(
      "node scripts/preflight-migration-state.mjs"
    );
    expect(source).toContain("inspectRequiredSchema");
    expect(schemaSource).toContain("information_schema.TABLES");
    expect(schemaSource).toContain("information_schema.STATISTICS");
    expect(schemaSource).toContain("information_schema.TRIGGERS");
    expect(schemaSource).toContain("information_schema.TABLE_CONSTRAINTS");
    expect(source).toContain("__drizzle_migrations ORDER BY created_at ASC");
    expect(source).not.toMatch(
      /\b(?:INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|REPLACE|TRUNCATE)\b/i
    );
  });

  it("resolves migration 0033 and its exact sha256 hash from the journal tip", () => {
    const expected = resolveExpectedMigration(resolve("."));
    const sql = readFileSync(
      resolve("drizzle/0033_business_claim_identity_unique.sql"),
      "utf8"
    );

    expect(expected.tag).toBe("0033_business_claim_identity_unique");
    expect(expected.hash).toBe(createHash("sha256").update(sql).digest("hex"));
  });

  it("computes pending migrations from the full journal after each valid applied prefix", () => {
    const planTags = readMigrationPlan(resolve(".")).map(entry => entry.tag);
    const inspectPrefix = (tip: string) => {
      const tipIndex = planTags.indexOf(tip);
      const appliedTags = planTags.slice(0, tipIndex + 1);
      return inspectMigrationState({
        planTags,
        appliedTags,
        eventPromotionsExists: appliedTags.includes("0032_event_promotions"),
        businessClaimIdentityUniqueExists: appliedTags.includes(
          "0033_business_claim_identity_unique"
        ),
        duplicateBusinessClaimIdentityGroupCount: 0,
      });
    };

    for (const tip of [
      "0030_passport_stamp_idempotency",
      "0031_newsletter_subscription_lifecycle",
      "0032_event_promotions",
    ]) {
      const tipIndex = planTags.indexOf(tip);
      expect(inspectPrefix(tip)).toMatchObject({
        status: "ready",
        appliedTip: tip,
        pending: planTags.slice(tipIndex + 1),
      });
    }

    const current = inspectPrefix(planTags.at(-1));
    expect(current).toMatchObject({
      status: "current",
      appliedTip: planTags.at(-1),
      pending: [],
    });
  });

  it("rejects empty, unknown, and diverged applied migration sequences", () => {
    const planTags = readMigrationPlan(resolve(".")).map(entry => entry.tag);
    const base = {
      planTags,
      eventPromotionsExists: false,
      businessClaimIdentityUniqueExists: false,
      duplicateBusinessClaimIdentityGroupCount: 0,
    };

    expect(() => inspectMigrationState({ ...base, appliedTags: [] })).toThrow(
      /no rows|empty/i
    );
    expect(() =>
      inspectMigrationState({ ...base, appliedTags: ["9999_unknown"] })
    ).toThrow(/prefix|diverge|unknown/i);
    expect(() =>
      inspectMigrationState({
        ...base,
        appliedTags: [planTags[0], planTags[2]],
      })
    ).toThrow(/prefix|diverge/i);
  });

  it("fails closed when duplicate-identity evidence is missing or reports duplicates", () => {
    const planTags = readMigrationPlan(resolve(".")).map(entry => entry.tag);
    const appliedTags = planTags.slice(
      0,
      planTags.indexOf("0032_event_promotions") + 1
    );
    const base = {
      planTags,
      appliedTags,
      eventPromotionsExists: true,
      businessClaimIdentityUniqueExists: false,
    };

    expect(() => inspectMigrationState(base)).toThrow(/duplicate|count/i);
    expect(() =>
      inspectMigrationState({
        ...base,
        duplicateBusinessClaimIdentityGroupCount: 1,
      })
    ).toThrow(/duplicate non-null business claim identity/i);
  });

  it("accepts only the exact ordered unique business-claim index fingerprint", () => {
    const exact = [
      {
        indexName: "business_claims_service_user_unique",
        nonUnique: 0,
        seqInIndex: 1,
        columnName: "serviceKey",
        subPart: null,
        collation: "A",
        indexType: "BTREE",
        isVisible: "YES",
        expression: null,
        nullable: "",
        packed: null,
        comment: "",
        indexComment: "",
      },
      {
        indexName: "business_claims_service_user_unique",
        nonUnique: 0,
        seqInIndex: 2,
        columnName: "userId",
        subPart: null,
        collation: "A",
        indexType: "BTREE",
        isVisible: "YES",
        expression: null,
        nullable: "YES",
        packed: null,
        comment: "",
        indexComment: "",
      },
    ];

    expect(hasExactBusinessClaimIdentityUniqueIndex(exact)).toBe(true);
    expect(
      hasExactBusinessClaimIdentityUniqueIndex([
        { ...exact[0], columnName: "userId" },
        { ...exact[1], columnName: "serviceKey" },
      ])
    ).toBe(false);
    expect(hasExactBusinessClaimIdentityUniqueIndex([exact[1], exact[0]])).toBe(
      false
    );
    expect(
      hasExactBusinessClaimIdentityUniqueIndex([
        exact[0],
        { ...exact[1], nonUnique: 1 },
      ])
    ).toBe(false);
    expect(
      hasExactBusinessClaimIdentityUniqueIndex([
        ...exact,
        { ...exact[1], seqInIndex: 3, columnName: "id" },
      ])
    ).toBe(false);
    expect(
      hasExactBusinessClaimIdentityUniqueIndex([
        { ...exact[0], indexName: "same_name_drift" },
        exact[1],
      ])
    ).toBe(false);
  });

  it("fails closed when schema objects and the applied ledger disagree", () => {
    const planTags = readMigrationPlan(resolve(".")).map(entry => entry.tag);
    const through0032 = planTags.slice(
      0,
      planTags.indexOf("0032_event_promotions") + 1
    );
    expect(() =>
      inspectMigrationState({
        planTags,
        appliedTags: through0032,
        eventPromotionsExists: false,
        businessClaimIdentityUniqueExists: false,
        duplicateBusinessClaimIdentityGroupCount: 0,
      })
    ).toThrow(/event_promotions/i);

    expect(() =>
      inspectMigrationState({
        planTags,
        appliedTags: through0032,
        eventPromotionsExists: true,
        businessClaimIdentityUniqueExists: true,
        duplicateBusinessClaimIdentityGroupCount: 0,
      })
    ).toThrow(/business_claims_service_user_unique/i);
  });
});
