import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  new URL("../drizzle/0018_fearless_bedlam.sql", import.meta.url),
  "utf8",
);

describe("business membership migration", () => {
  it("fails before creating the permanent table when historical owners conflict", () => {
    const preflight = sql.indexOf("CREATE TEMPORARY TABLE `business_membership_owner_preflight`");
    const permanent = sql.indexOf("CREATE TABLE `business_memberships`");
    expect(preflight).toBeGreaterThanOrEqual(0);
    expect(preflight).toBeLessThan(permanent);
    expect(sql).toContain("business_membership_owner_preflight_active_owner_unique");
  });

  it("backfills canonical owner authority from approved user-bound claims", () => {
    expect(sql).toContain(
      "INSERT INTO `business_memberships` (`serviceKey`, `userId`, `ownerClaimId`, `activeOwnerKey`, `role`, `status`, `createdBy`)"
    );
    expect(sql).toContain("WHERE `status` = 'approved' AND `userId` IS NOT NULL");
  });
});
