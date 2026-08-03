import { describe, expect, it, vi } from "vitest";
import { processCheckoutCompletion } from "./stripe-checkout-completion";

const staleSession = {
  id: "cs_stale",
  customer: "cus_previous",
  subscription: "sub_previous",
  metadata: {
    service_key: "owner-business",
    tier: "premium",
    claim_id: "11",
    user_id: "7",
    customer_email: "owner@example.com",
  },
};

function deps(activation: { accepted: boolean } | Error = { accepted: false }) {
  return {
    activateCanonicalCheckout: vi.fn().mockImplementation(async () => {
      if (activation instanceof Error) throw activation;
      return activation;
    }),
    reconcileRejectedCheckout: vi.fn().mockResolvedValue({ reconciled: true }),
  };
}

describe("Stripe checkout completion ownership", () => {
  it("durably reconciles completion when canonical ownership changed", async () => {
    const dependencies = deps();
    await expect(processCheckoutCompletion("evt_stale", staleSession, dependencies))
      .resolves.toEqual({ accepted: false, reconciledSubscriptionId: "sub_previous" });
    expect(dependencies.reconcileRejectedCheckout).toHaveBeenCalledWith(expect.objectContaining({
      stripeEventId: "evt_stale",
      checkoutSessionId: "cs_stale",
      serviceKey: "owner-business",
      claimId: 11,
      stripeSubscriptionId: "sub_previous",
      reason: "canonical_owner_changed",
    }));
  });

  it("attaches billing only after the transactional canonical check accepts it", async () => {
    const dependencies = deps({ accepted: true });
    await expect(processCheckoutCompletion("evt_ok", staleSession, dependencies))
      .resolves.toEqual({ accepted: true, userId: 7, tier: "premium", serviceKey: "owner-business" });
    expect(dependencies.reconcileRejectedCheckout).not.toHaveBeenCalled();
  });

  it("reconciles a valid subscription even when canonical metadata is malformed", async () => {
    const dependencies = deps();
    await expect(processCheckoutCompletion("evt_bad", { ...staleSession, metadata: {} }, dependencies))
      .resolves.toEqual({ accepted: false, reconciledSubscriptionId: "sub_previous" });
    expect(dependencies.activateCanonicalCheckout).not.toHaveBeenCalled();
    expect(dependencies.reconcileRejectedCheckout).toHaveBeenCalledWith(expect.objectContaining({
      stripeEventId: "evt_bad",
      reason: "malformed_metadata",
      stripeSubscriptionId: "sub_previous",
    }));
  });

  it("reconciles identifier conflicts and uniqueness failures from activation", async () => {
    const dependencies = deps(new Error("Existing Stripe billing conflicts with checkout completion"));
    await expect(processCheckoutCompletion("evt_conflict", staleSession, dependencies))
      .resolves.toEqual({ accepted: false, reconciledSubscriptionId: "sub_previous" });
    expect(dependencies.reconcileRejectedCheckout).toHaveBeenCalledWith(expect.objectContaining({
      reason: "conflicting_checkout_identifiers",
    }));
  });

  it("classifies database uniqueness failures for durable reconciliation", async () => {
    const duplicate = Object.assign(new Error("Duplicate entry for premium listing"), { code: "ER_DUP_ENTRY" });
    const dependencies = deps(duplicate);
    await expect(processCheckoutCompletion("evt_unique", staleSession, dependencies))
      .resolves.toEqual({ accepted: false, reconciledSubscriptionId: "sub_previous" });
    expect(dependencies.reconcileRejectedCheckout).toHaveBeenCalledWith(expect.objectContaining({
      stripeEventId: "evt_unique",
      reason: "billing_uniqueness_failure",
    }));
  });

  it("fails closed when no subscription exists to reconcile", async () => {
    const dependencies = deps();
    await expect(processCheckoutCompletion("evt_missing", { ...staleSession, subscription: null }, dependencies))
      .rejects.toThrow("Checkout session is missing a Stripe subscription");
    expect(dependencies.reconcileRejectedCheckout).not.toHaveBeenCalled();
  });
});
