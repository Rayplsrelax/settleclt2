import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

describe("single-owner persistence policy", () => {
  it("claims the unique owner key during approval", () => {
    const approval = source.slice(
      source.indexOf("export async function approveBusinessClaimAndCreateOwnerMembership"),
      source.indexOf("export async function getBusinessMembershipsForUser"),
    );
    expect(approval).toContain("activeOwnerKey: claim.serviceKey");
    expect(approval).toContain('.for("update")');
  });

  it("locks billing state and blocks transfer before creating owner authority", () => {
    const approval = source.slice(
      source.indexOf("export async function approveBusinessClaimAndCreateOwnerMembership"),
      source.indexOf("export async function getBusinessMembershipsForUser"),
    );
    const membershipLock = approval.indexOf("const lockedMemberships");
    const billingLock = approval.indexOf(".from(premiumListings)");
    const billingGuard = approval.indexOf("assertNoConflictingBillingOwner");
    const membershipInsert = approval.indexOf("tx.insert(businessMemberships)");

    expect(membershipLock).toBeGreaterThan(-1);
    expect(billingLock).toBeGreaterThan(membershipLock);
    expect(billingGuard).toBeGreaterThan(billingLock);
    expect(membershipInsert).toBeGreaterThan(billingGuard);
    expect(approval).toContain("billingRecords.length > 1");
    expect(approval).toContain("billingRecords.forEach");
  });

  it("validates the canonical claim before an admin premium update", () => {
    const adminUpdate = source.slice(
      source.indexOf("export async function upsertCanonicalPremiumListingForAdmin"),
      source.indexOf("export async function getAllPremiumListings"),
    );
    const claimLock = adminUpdate.indexOf(".from(businessClaims)");
    const membershipLock = adminUpdate.indexOf("const memberships = await tx.select().from(businessMemberships)");
    const billingLock = adminUpdate.indexOf(".from(premiumListings)");
    expect(claimLock).toBeGreaterThan(-1);
    expect(membershipLock).toBeGreaterThan(claimLock);
    expect(billingLock).toBeGreaterThan(membershipLock);
    expect(adminUpdate).toContain('claim.status !== "approved"');
    expect(adminUpdate).toContain("claim.serviceKey !== serviceKey");
    expect(adminUpdate).toContain("claim.userId !== candidateOwner.userId");
  });

  it("releases the owner key whenever authority is revoked", () => {
    const revocation = source.slice(
      source.indexOf("export async function updateBusinessClaimStatus"),
      source.indexOf("export async function approveBusinessClaimAndCreateOwnerMembership"),
    );
    expect(revocation).toContain("activeOwnerKey: null");
  });
});
