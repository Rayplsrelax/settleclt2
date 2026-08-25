import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
export { hasExactBusinessClaimIdentityUniqueIndex } from "./migration-schema-lib.mjs";

export const EVENT_PROMOTIONS_TAG = "0032_event_promotions";
export const BUSINESS_CLAIM_UNIQUE_TAG = "0033_business_claim_identity_unique";

export function readMigrationPlan(migrationsRoot) {
  const root = resolve(migrationsRoot);
  const journal = JSON.parse(
    readFileSync(resolve(root, "drizzle/meta/_journal.json"), "utf8")
  );

  return journal.entries.map(entry => {
    const migrationPath = resolve(root, `drizzle/${entry.tag}.sql`);
    const migration = readFileSync(migrationPath, "utf8");
    return {
      ...entry,
      path: migrationPath,
      hash: createHash("sha256").update(migration).digest("hex"),
    };
  });
}

export function resolveExpectedMigration(migrationsRoot) {
  const expected = readMigrationPlan(migrationsRoot).at(-1);
  if (!expected) throw new Error("migration journal is empty");
  return expected;
}

export function inspectMigrationState({
  planTags,
  appliedTags,
  eventPromotionsExists,
  businessClaimIdentityUniqueExists,
  duplicateBusinessClaimIdentityGroupCount,
}) {
  if (!Array.isArray(planTags) || planTags.length === 0) {
    throw new Error("local migration plan is empty");
  }
  if (!Array.isArray(appliedTags) || appliedTags.length === 0) {
    throw new Error("__drizzle_migrations has no rows");
  }
  if (
    appliedTags.length > planTags.length ||
    appliedTags.some((tag, index) => tag !== planTags[index])
  ) {
    throw new Error("applied migrations are not a prefix of the local journal");
  }
  if (
    !Number.isInteger(duplicateBusinessClaimIdentityGroupCount) ||
    duplicateBusinessClaimIdentityGroupCount < 0
  ) {
    throw new Error("invalid duplicate business claim identity group count");
  }
  if (duplicateBusinessClaimIdentityGroupCount > 0) {
    throw new Error("duplicate non-null business claim identity groups exist");
  }

  const eventMigrationApplied = appliedTags.includes(EVENT_PROMOTIONS_TAG);
  const identityMigrationApplied = appliedTags.includes(
    BUSINESS_CLAIM_UNIQUE_TAG
  );

  if (eventPromotionsExists && !eventMigrationApplied) {
    throw new Error(
      "0032 partial-DDL/manual reconciliation required: event_promotions exists without its migration ledger row"
    );
  }
  if (!eventPromotionsExists && eventMigrationApplied) {
    throw new Error("0032 is ledgered but event_promotions is missing");
  }
  if (businessClaimIdentityUniqueExists && !identityMigrationApplied) {
    throw new Error(
      "0033 partial-DDL/manual reconciliation required: business_claims_service_user_unique exists without its migration ledger row"
    );
  }
  if (!businessClaimIdentityUniqueExists && identityMigrationApplied) {
    throw new Error("0033 is ledgered but business_claims_service_user_unique is missing or drifted");
  }

  const pending = planTags.slice(appliedTags.length);
  return {
    status: pending.length === 0 ? "current" : "ready",
    appliedTip: appliedTags.at(-1),
    pending,
  };
}
