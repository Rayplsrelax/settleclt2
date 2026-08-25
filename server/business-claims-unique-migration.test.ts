import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/mysql-core";
import { businessClaims } from "../drizzle/schema";

const migrationUrl = new URL("../drizzle/0033_business_claim_identity_unique.sql", import.meta.url);
const claimDialogSource = readFileSync(
  new URL("../client/src/components/ClaimBusinessDialog.tsx", import.meta.url),
  "utf8"
);

describe("business claim canonical identity invariant", () => {
  it("declares the serviceKey plus userId unique index in the Drizzle schema", () => {
    const config = getTableConfig(businessClaims);
    const index = config.indexes.find(candidate => candidate.config.name === "business_claims_service_user_unique");

    expect(index).toBeDefined();
    expect(index?.config.unique).toBe(true);
    expect(index?.config.columns.map(column => "name" in column ? column.name : undefined)).toEqual([
      "serviceKey",
      "userId",
    ]);
  });

  it("adds a next-number migration that preflights duplicates before creating the index", () => {
    expect(existsSync(migrationUrl)).toBe(true);
    if (!existsSync(migrationUrl)) return;

    const sql = readFileSync(migrationUrl, "utf8");
    const createPreflight = sql.indexOf("CREATE TEMPORARY TABLE `business_claim_identity_preflight`");
    const insertDuplicates = sql.indexOf("GROUP BY `serviceKey`, `userId` HAVING COUNT(*) > 1");
    const dropPreflight = sql.indexOf("DROP TEMPORARY TABLE `business_claim_identity_preflight`");
    const addUnique = sql.indexOf("business_claims_service_user_unique");

    expect(createPreflight).toBeGreaterThanOrEqual(0);
    expect(insertDuplicates).toBeGreaterThan(createPreflight);
    expect(dropPreflight).toBeGreaterThan(insertDuplicates);
    expect(addUnique).toBeGreaterThan(dropPreflight);
    expect(sql).toContain("WHERE `userId` IS NOT NULL");
    expect(sql).not.toMatch(/DELETE\s+FROM\s+`business_claims`|UPDATE\s+`business_claims`/i);
  });

  it("labels submitted identity fields as separate business contact details", () => {
    expect(claimDialogSource).toContain("Business Contact Name *");
    expect(claimDialogSource).toContain("Business Contact Email *");
  });
});