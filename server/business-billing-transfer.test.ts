import { describe, expect, it } from "vitest";
import { assertCheckoutIdentifiersCompatible, assertNoConflictingBillingOwner, assertUniquePremiumServiceKeys } from "./business-memberships";
import { readFileSync } from "node:fs";

describe("ownership transfer billing policy", () => {
  it("blocks a new owner while the previous claim still owns a Stripe customer", () => {
    expect(() =>
      assertNoConflictingBillingOwner(22, {
        claimId: 11,
        stripeCustomerId: "cus_previous",
        stripeSubscriptionId: null,
      }),
    ).toThrow("Existing Stripe billing must be resolved before ownership transfer");
  });

  it("allows idempotent reapproval for the same billing owner claim", () => {
    expect(() =>
      assertNoConflictingBillingOwner(11, {
        claimId: 11,
        stripeCustomerId: "cus_current",
        stripeSubscriptionId: "sub_current",
      }),
    ).not.toThrow();
  });

  it("allows transfer after prior Stripe identifiers are detached", () => {
    expect(() =>
      assertNoConflictingBillingOwner(22, {
        claimId: 11,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      }),
    ).not.toThrow();
  });

  it("does not use a multi-unique-key upsert for provider updates", () => {
    const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    const body = source.slice(
      source.indexOf("export async function upsertPremiumListing"),
      source.indexOf("export async function upsertCanonicalPremiumListingForAdmin"),
    );
    expect(body).not.toContain("onDuplicateKeyUpdate");
    expect(body).toContain("Provider identifiers require canonical checkout activation");
  });

  it("does not rebind former-owner Stripe state during an admin update", () => {
    const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    const body = source.slice(
      source.indexOf("export async function upsertCanonicalPremiumListingForAdmin"),
      source.indexOf("export async function getAllPremiumListings"),
    );
    expect(body).toContain("assertNoConflictingBillingOwner(canonicalOwner.ownerClaimId, billingRecords[0]");
  });

  it("rejects a second completed checkout with different Stripe identifiers", () => {
    expect(() => assertCheckoutIdentifiersCompatible(
      { stripeCustomerId: "cus_existing", stripeSubscriptionId: "sub_existing" },
      { stripeCustomerId: "cus_new", stripeSubscriptionId: "sub_new" },
    )).toThrow("Existing Stripe billing conflicts with checkout completion");
    expect(() => assertCheckoutIdentifiersCompatible(
      { stripeCustomerId: "cus_existing", stripeSubscriptionId: "sub_existing" },
      { stripeCustomerId: "cus_existing", stripeSubscriptionId: "sub_existing" },
    )).not.toThrow();
  });

  it("fails closed if legacy duplicate premium rows remain", () => {
    const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    const body = source.slice(
      source.indexOf("export async function getPremiumListing"),
      source.indexOf("export async function upsertPremiumListing"),
    );
    expect(body).toContain("serviceResults.length > 1");
    expect(body).toContain("Duplicate premium listing records require reconciliation");
  });

  it("rejects mixed-status duplicate rows for the same service", () => {
    expect(() => assertUniquePremiumServiceKeys([
      { serviceKey: "owner-business", paymentStatus: "active" },
      { serviceKey: "owner-business", paymentStatus: "canceled" },
    ])).toThrow("Duplicate premium listing records require reconciliation");
  });

  it("rejects Stripe identifiers shared by different services", () => {
    expect(() => assertUniquePremiumServiceKeys([
      { serviceKey: "business-a", stripeCustomerId: "cus_shared", stripeSubscriptionId: "sub_a" },
      { serviceKey: "business-b", stripeCustomerId: "cus_shared", stripeSubscriptionId: "sub_b" },
    ])).toThrow("Duplicate Stripe customer requires reconciliation");

    expect(() => assertUniquePremiumServiceKeys([
      { serviceKey: "business-a", stripeCustomerId: "cus_a", stripeSubscriptionId: "sub_shared" },
      { serviceKey: "business-b", stripeCustomerId: "cus_b", stripeSubscriptionId: "sub_shared" },
    ])).toThrow("Duplicate Stripe subscription requires reconciliation");
  });
});
