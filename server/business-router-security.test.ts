import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const getApprovedClaimForUser = vi.fn();
const getBusinessMembershipsForUser = vi.fn();
const getBusinessClaims = vi.fn();
const getPremiumListing = vi.fn();
const getAllPremiumListings = vi.fn();
const getPremiumBillingForCheckout = vi.fn();
const getActiveOwnerMembership = vi.fn();
const upsertPremiumListing = vi.fn();
const upsertCanonicalPremiumListingForAdmin = vi.fn();
const hasExistingClaim = vi.fn();
const submitBusinessClaim = vi.fn();
const createCheckoutSession = vi.fn();
const createPortalSession = vi.fn();
const notifyOwner = vi.fn();

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getApprovedClaimForUser,
    getBusinessMembershipsForUser,
    getBusinessClaims,
    getPremiumListing,
    getAllPremiumListings,
    getPremiumBillingForCheckout,
    getActiveOwnerMembership,
    upsertPremiumListing,
    upsertCanonicalPremiumListingForAdmin,
    hasExistingClaim,
    submitBusinessClaim,
  };
});

vi.mock("./_core/notification", () => ({ notifyOwner }));

vi.mock("./stripe-helpers", async importOriginal => {
  const actual = await importOriginal<typeof import("./stripe-helpers")>();
  return {
    ...actual,
    createCheckoutSession,
    createPortalSession,
  };
});

function authenticatedContext(userId = 7): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user-${userId}@example.com`,
      name: "Business User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      newsletterOptIn: true,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function unauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function adminContext(): TrpcContext {
  const ctx = authenticatedContext();
  return { ...ctx, user: { ...ctx.user!, role: "admin" } };
}

describe("business router authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPremiumListing.mockResolvedValue({
      serviceKey: "victim-business",
      stripeCustomerId: "cus_victim",
    });
    createPortalSession.mockResolvedValue({
      url: "https://billing.stripe.test/session",
    });
    createCheckoutSession.mockResolvedValue({
      url: "https://checkout.stripe.test/session",
    });
    hasExistingClaim.mockResolvedValue(false);
    submitBusinessClaim.mockResolvedValue({ id: 99 });
    notifyOwner.mockResolvedValue(true);
    getBusinessMembershipsForUser.mockResolvedValue([]);
    getBusinessClaims.mockResolvedValue([]);
    getAllPremiumListings.mockResolvedValue([]);
    getPremiumBillingForCheckout.mockResolvedValue(null);
    getActiveOwnerMembership.mockResolvedValue(null);
    upsertPremiumListing.mockResolvedValue({ id: 1, updated: true });
    upsertCanonicalPremiumListingForAdmin.mockResolvedValue({ id: 1, updated: true });
  });

  it("denies billing portal access when the user does not own the business", async () => {
    getApprovedClaimForUser.mockResolvedValue([]);
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(
      caller.premium.manageSubscription({
        serviceKey: "victim-business",
        origin: "https://settleclt.com",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(createPortalSession).not.toHaveBeenCalled();
  });

  it("does not pass a client-controlled origin to Stripe billing sessions", async () => {
    getBusinessMembershipsForUser.mockResolvedValue([
      {
        serviceKey: "owner-business",
        userId: 7,
        ownerClaimId: 11,
        role: "owner",
        status: "active",
      },
    ]);
    getPremiumListing.mockResolvedValue({
      serviceKey: "owner-business",
      claimId: 11,
      stripeCustomerId: "cus_owner",
    });
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(authenticatedContext());

    await caller.premium.manageSubscription({
      serviceKey: "owner-business",
      origin: "https://attacker.example",
    });

    expect(createPortalSession).toHaveBeenCalledWith({
      stripeCustomerId: "cus_owner",
    });
  });

  it("denies billing portal access to Stripe state from a previous owner claim", async () => {
    getBusinessMembershipsForUser.mockResolvedValue([
      {
        serviceKey: "owner-business",
        userId: 7,
        ownerClaimId: 22,
        role: "owner",
        status: "active",
      },
    ]);
    getPremiumListing.mockResolvedValue({
      serviceKey: "owner-business",
      claimId: 11,
      stripeCustomerId: "cus_previous_owner",
    });
    const { appRouter } = await import("./routers");

    await expect(
      appRouter
        .createCaller(authenticatedContext())
        .premium.manageSubscription({ serviceKey: "owner-business" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(createPortalSession).not.toHaveBeenCalled();
  });

  it("derives Stripe checkout metadata from canonical ownership", async () => {
    getBusinessMembershipsForUser.mockResolvedValue([
      {
        serviceKey: "owner-business",
        userId: 7,
        ownerClaimId: 11,
        role: "owner",
        status: "active",
      },
    ]);
    getBusinessClaims.mockResolvedValue([
      {
        id: 11,
        serviceKey: "owner-business",
        businessName: "Canonical Owner Business",
        status: "approved",
      },
    ]);
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(authenticatedContext());

    await caller.premium.createCheckout({
      tier: "featured",
      serviceKey: "owner-business",
      businessName: "Attacker Controlled Name",
      claimId: 999,
      origin: "https://attacker.example",
    });

    expect(createCheckoutSession).toHaveBeenCalledWith({
      tier: "featured",
      serviceKey: "owner-business",
      businessName: "Canonical Owner Business",
      claimId: 11,
      userId: 7,
      userEmail: "user-7@example.com",
      userName: "Business User",
    });
  });

  it("does not create another checkout while billing identifiers are unresolved", async () => {
    getBusinessMembershipsForUser.mockResolvedValue([{
      serviceKey: "owner-business", userId: 7, ownerClaimId: 11, role: "owner", status: "active",
    }]);
    getBusinessClaims.mockResolvedValue([{
      id: 11, serviceKey: "owner-business", businessName: "Owner Business", status: "approved",
    }]);
    getPremiumBillingForCheckout.mockResolvedValue({
      serviceKey: "owner-business", stripeCustomerId: "cus_existing", stripeSubscriptionId: "sub_existing",
    });
    const { appRouter } = await import("./routers");
    await expect(appRouter.createCaller(authenticatedContext()).premium.createCheckout({
      tier: "premium", serviceKey: "owner-business",
    })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("checks unresolved billing through the service-scoped checkout guard", async () => {
    getBusinessMembershipsForUser.mockResolvedValue([{
      serviceKey: "owner-business", userId: 7, ownerClaimId: 11, role: "owner", status: "active",
    }]);
    getBusinessClaims.mockResolvedValue([{
      id: 11, serviceKey: "owner-business", businessName: "Owner Business", status: "approved",
    }]);
    const { appRouter } = await import("./routers");
    await appRouter.createCaller(authenticatedContext()).premium.createCheckout({
      tier: "featured", serviceKey: "owner-business",
    });
    expect(getPremiumBillingForCheckout).toHaveBeenCalledWith("owner-business");
    expect(getAllPremiumListings).not.toHaveBeenCalled();
  });

  it("requires authentication before a business claim can be submitted", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(unauthenticatedContext());

    await expect(
      caller.claims.submit({
        serviceKey: "owner-business",
        businessName: "Owner Business",
        claimantName: "Business Owner",
        claimantEmail: "owner@example.com",
        claimantRole: "owner",
        verificationMethod: "owner",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    expect(submitBusinessClaim).not.toHaveBeenCalled();
  });

  it("allows an active owner membership to manage billing without depending on a claim row", async () => {
    getApprovedClaimForUser.mockResolvedValue([]);
    getBusinessMembershipsForUser.mockResolvedValue([
      {
        serviceKey: "owner-business",
        userId: 7,
        ownerClaimId: 11,
        role: "owner",
        status: "active",
      },
    ]);
    getPremiumListing.mockResolvedValue({
      serviceKey: "owner-business",
      claimId: 11,
      stripeCustomerId: "cus_owner",
    });
    const { appRouter } = await import("./routers");

    await expect(
      appRouter
        .createCaller(authenticatedContext())
        .premium.manageSubscription({
          serviceKey: "owner-business",
        })
    ).resolves.toEqual({ url: "https://billing.stripe.test/session" });
  });

  it("derives admin premium linkage from the canonical active owner", async () => {
    getActiveOwnerMembership.mockResolvedValue({
      serviceKey: "owner-business",
      ownerClaimId: 11,
      role: "owner",
      status: "active",
    });
    const { appRouter } = await import("./routers");

    await appRouter.createCaller(adminContext()).premium.adminUpdate({
      serviceKey: "owner-business",
      tier: "featured",
      claimId: 999,
      billingEmail: "billing@example.com",
    });

    expect(upsertCanonicalPremiumListingForAdmin).toHaveBeenCalledWith("owner-business", {
      tier: "featured",
      billingEmail: "billing@example.com",
    });
    expect(getActiveOwnerMembership).not.toHaveBeenCalled();
    expect(upsertPremiumListing).not.toHaveBeenCalled();
  });
});
