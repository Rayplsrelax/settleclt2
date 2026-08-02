import { describe, expect, it, vi } from "vitest";
import { cancelSubscriptionIfActive, reconcileRejectedCheckout } from "./stripe-checkout-reconciliation";

const rejection = {
  stripeEventId: "evt_1",
  checkoutSessionId: "cs_1",
  stripeSubscriptionId: "sub_1",
  reason: "canonical_owner_changed",
};

describe("durable Stripe checkout reconciliation", () => {
  it("converges when cancellation succeeded but the durable success mark previously failed", async () => {
    const cancel = vi.fn();
    await cancelSubscriptionIfActive("sub_1", {
      retrieve: vi.fn().mockResolvedValue({ status: "canceled" }),
      cancel,
    });
    expect(cancel).not.toHaveBeenCalled();
  });

  it("records pending before canceling and records success by leased session", async () => {
    const calls: string[] = [];
    const markSucceeded = vi.fn(async () => { calls.push("succeeded"); });
    const result = await reconcileRejectedCheckout(rejection, {
      reserve: vi.fn(async () => { calls.push("reserve"); return { status: "pending" as const, acquired: true, leaseToken: "lease_1" }; }),
      cancelSubscription: vi.fn(async () => { calls.push("cancel"); }),
      markSucceeded,
      markFailed: vi.fn(async () => { calls.push("failed"); }),
    });
    expect(result).toEqual({ reconciled: true });
    expect(calls).toEqual(["reserve", "cancel", "succeeded"]);
    expect(markSucceeded).toHaveBeenCalledWith("evt_1", "cs_1", "lease_1");
  });

  it("does not cancel again after durable success", async () => {
    const cancelSubscription = vi.fn();
    const result = await reconcileRejectedCheckout(rejection, {
      reserve: vi.fn().mockResolvedValue({ status: "succeeded", acquired: false }),
      cancelSubscription,
      markSucceeded: vi.fn(),
      markFailed: vi.fn(),
    });
    expect(result).toEqual({ reconciled: true, alreadyCompleted: true });
    expect(cancelSubscription).not.toHaveBeenCalled();
  });

  it("asks Stripe to retry when another delivery owns the active lease", async () => {
    const cancelSubscription = vi.fn();
    await expect(reconcileRejectedCheckout(rejection, {
      reserve: vi.fn().mockResolvedValue({ status: "pending", acquired: false }),
      cancelSubscription,
      markSucceeded: vi.fn(),
      markFailed: vi.fn(),
    })).rejects.toThrow("Checkout reconciliation is already in progress");
    expect(cancelSubscription).not.toHaveBeenCalled();
  });

  it("records cancellation failure and rethrows for provider retry", async () => {
    const markFailed = vi.fn();
    await expect(reconcileRejectedCheckout(rejection, {
      reserve: vi.fn().mockResolvedValue({ status: "pending", acquired: true, leaseToken: "lease_1" }),
      cancelSubscription: vi.fn().mockRejectedValue(new Error("Stripe unavailable")),
      markSucceeded: vi.fn(),
      markFailed,
    })).rejects.toThrow("Stripe unavailable");
    expect(markFailed).toHaveBeenCalledWith("evt_1", "cs_1", "lease_1", "Stripe unavailable");
  });
});
