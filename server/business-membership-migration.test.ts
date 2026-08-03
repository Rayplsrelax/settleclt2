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

  it("rejects duplicate premium service rows before adding the unique service key", () => {
    const preflight = sql.indexOf("CREATE TEMPORARY TABLE `premium_listing_service_preflight`");
    const uniqueKey = sql.indexOf("premium_listings_service_key_unique");
    expect(preflight).toBeGreaterThanOrEqual(0);
    expect(uniqueKey).toBeGreaterThan(preflight);
    expect(sql).toContain("GROUP BY `serviceKey` HAVING COUNT(*) > 1");
    expect(sql).toContain("premium_listings_stripe_customer_unique");
    expect(sql).toContain("premium_listings_stripe_subscription_unique");
    expect(sql).toContain("GROUP BY `stripeCustomerId` HAVING COUNT(*) > 1");
    expect(sql).toContain("GROUP BY `stripeSubscriptionId` HAVING COUNT(*) > 1");
  });

  it("creates durable idempotent Stripe checkout reconciliation storage", () => {
    expect(sql).toContain("CREATE TABLE `stripe_checkout_reconciliations`");
    expect(sql).toContain("stripe_checkout_reconciliations_session_unique");
    expect(sql).toContain("stripe_checkout_reconciliations_event_unique");
    expect(sql).toContain("`leaseToken` varchar(64)");
    expect(sql).toContain("`leaseExpiresAt` timestamp");
    expect(sql).toContain("enum('pending','succeeded','failed')");
    expect(sql).toContain("`attemptCount` int NOT NULL DEFAULT 1");
    expect(sql).toContain("`lastError` text");
  });
});
