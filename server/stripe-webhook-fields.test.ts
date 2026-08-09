import { describe, expect, it } from "vitest";
import {
  getInvoiceSubscriptionId,
  getSubscriptionBillingUpdate,
} from "./stripe-webhook-fields";

describe("Stripe webhook field compatibility", () => {
  it("reads billing state from current subscription item fields", () => {
    expect(getSubscriptionBillingUpdate({
      status: "active",
      items: {
        data: [{
          current_period_start: 1_700_000_000,
          current_period_end: 1_702_592_000,
          price: { id: "price_pro", metadata: { settle_tier: "pro" } },
        }],
      },
    })).toEqual({
      paymentStatus: "active",
      currentPeriodStart: new Date(1_700_000_000 * 1000),
      currentPeriodEnd: new Date(1_702_592_000 * 1000),
      stripePriceId: "price_pro",
      tier: "pro",
    });
  });

  it("falls back to legacy subscription-level periods", () => {
    expect(getSubscriptionBillingUpdate({
      status: "past_due",
      current_period_start: 1_700_000_000,
      current_period_end: 1_702_592_000,
      items: { data: [] },
    })).toEqual({
      paymentStatus: "past_due",
      currentPeriodStart: new Date(1_700_000_000 * 1000),
      currentPeriodEnd: new Date(1_702_592_000 * 1000),
    });
  });

  it("reads current and legacy invoice subscription references", () => {
    expect(getInvoiceSubscriptionId({
      parent: { subscription_details: { subscription: "sub_current" } },
    })).toBe("sub_current");
    expect(getInvoiceSubscriptionId({ subscription: "sub_legacy" })).toBe("sub_legacy");
    expect(getInvoiceSubscriptionId({ parent: null })).toBeNull();
  });

  it("ignores unknown statuses and untrusted tier metadata", () => {
    expect(getSubscriptionBillingUpdate({
      status: "paused",
      items: {
        data: [{ price: { id: "price_unknown", metadata: { settle_tier: "admin" } } }],
      },
    })).toEqual({ paymentStatus: "past_due", stripePriceId: "price_unknown" });
  });
});
