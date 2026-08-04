import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { requireActivePremium, requirePremiumLeadAccess } from "./premium-access";

type Membership = Parameters<typeof requirePremiumLeadAccess>[0][number];

const owner: Membership = {
  id: 1,
  serviceKey: "business-a",
  userId: 10,
  ownerClaimId: 20,
  activeOwnerKey: "business-a",
  role: "owner",
  status: "active",
  createdBy: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
  revokedAt: null,
};

const premium = {
  tier: "premium" as const,
  paymentStatus: "active" as const,
};

describe("premium lead access policy", () => {
  it("allows an authorized member of an active Premium business", () => {
    expect(() => requirePremiumLeadAccess([owner], "business-a", premium)).not.toThrow();
  });

  it("rejects a cross-business member", () => {
    expect(() => requirePremiumLeadAccess([owner], "business-b", premium)).toThrow(TRPCError);
  });

  it("rejects Featured, inactive, and missing premium records", () => {
    expect(() => requireActivePremium({ tier: "featured", paymentStatus: "active" })).toThrow(TRPCError);
    expect(() => requireActivePremium({ tier: "premium", paymentStatus: "canceled" })).toThrow(TRPCError);
    expect(() => requireActivePremium(null)).toThrow(TRPCError);
  });
});
