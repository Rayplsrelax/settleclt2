import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { getDirectoryListings, hasExistingClaim, submitBusinessClaim, notifyOwner } = vi.hoisted(() => ({
  getDirectoryListings: vi.fn(),
  hasExistingClaim: vi.fn(),
  submitBusinessClaim: vi.fn(),
  notifyOwner: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  getDirectoryListings,
  hasExistingClaim,
  submitBusinessClaim,
}));
vi.mock("./_core/notification", () => ({ notifyOwner }));

import { appRouter, businessClaimInputSchema } from "./routers";

const userContext = (): TrpcContext => ({
  user: {
    id: 42,
    openId: "fixture-user",
    name: "Fixture User",
    email: "user@example.test",
    loginMethod: "local",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

const anonymousContext = (): TrpcContext => ({
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

const fixture = {
  serviceKey: "fixture-business",
  businessName: "Fixture Business",
  claimantName: "Fixture Claimant",
  claimantEmail: "claimant@example.test",
  claimantPhone: "704-555-0100",
  claimantRole: "Owner",
  verificationMethod: "owner" as const,
  message: "Fixture verification message",
};

const existingClaimResult = {
  success: false,
  error: "You have already submitted a claim for this business.",
} as const;

const limits = {
  serviceKey: 255,
  businessName: 200,
  claimantName: 120,
  claimantEmail: 254,
  claimantPhone: 32,
  claimantRole: 100,
  message: 4000,
} as const;

const text = (length: number) => "x".repeat(length);
const email = (length: number) => `${"x".repeat(length - "@example.test".length)}@example.test`;

describe("protected claims.submit boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDirectoryListings.mockResolvedValue([
      { serviceKey: "fixture-business", name: "Canonical Fixture Business", active: true },
      { serviceKey: text(limits.serviceKey), name: "Maximum Key Business", active: true },
    ]);
    hasExistingClaim.mockResolvedValue(false);
    submitBusinessClaim.mockResolvedValue({ id: 731 });
    notifyOwner.mockResolvedValue(true);
  });

  it.each(Object.entries(limits))(
    "accepts %s at its exact maximum through claims.submit",
    async (field, maximum) => {
      const value = field === "claimantEmail" ? email(maximum) : text(maximum);
      await expect(
        appRouter.createCaller(userContext()).claims.submit({ ...fixture, [field]: value })
      ).resolves.toEqual({ success: true, id: 731 });
      expect(submitBusinessClaim).toHaveBeenCalledWith(
        expect.objectContaining({
          [field]: field === "businessName"
            ? "Canonical Fixture Business"
            : field === "claimantName"
              ? "Fixture User"
              : field === "claimantEmail"
                ? "user@example.test"
                : value,
          userId: 42,
        })
      );
    }
  );

  it.each(Object.entries(limits))(
    "rejects %s one character over its maximum before persistence",
    async (field, maximum) => {
      const value = field === "claimantEmail" ? email(maximum + 1) : text(maximum + 1);
      await expect(
        appRouter.createCaller(userContext()).claims.submit({ ...fixture, [field]: value })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(hasExistingClaim).not.toHaveBeenCalled();
      expect(submitBusinessClaim).not.toHaveBeenCalled();
    }
  );

  it("preserves the canonical verification values and protected authentication boundary", async () => {
    for (const verificationMethod of ["owner", "manager", "employee", "authorized_rep"] as const) {
      expect(businessClaimInputSchema.safeParse({ ...fixture, verificationMethod }).success).toBe(true);
    }
    expect(
      businessClaimInputSchema.safeParse({ ...fixture, verificationMethod: "broker" }).success
    ).toBe(false);
    await expect(
      appRouter.createCaller(anonymousContext()).claims.submit(fixture)
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(submitBusinessClaim).not.toHaveBeenCalled();
  });

  it("uses userId plus serviceKey so an account email rotation cannot create another claim", async () => {
    hasExistingClaim.mockResolvedValue(true);

    await expect(
      appRouter.createCaller(userContext()).claims.submit({
        ...fixture,
        claimantEmail: "old-account-email@example.test",
      })
    ).resolves.toEqual(existingClaimResult);

    expect(hasExistingClaim).toHaveBeenCalledWith("fixture-business", 42);
    expect(submitBusinessClaim).not.toHaveBeenCalled();
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("resolves a static service slug before duplicate check, persistence, and notification", async () => {
    await appRouter.createCaller(userContext()).claims.submit({
      ...fixture,
      serviceKey: "hornet-moving",
      businessName: "Spoofed Static Name",
    });

    expect(hasExistingClaim).toHaveBeenCalledWith("hornet-moving", 42);
    expect(submitBusinessClaim).toHaveBeenCalledWith(expect.objectContaining({
      serviceKey: "hornet-moving",
      businessName: "Hornet Moving",
    }));
    expect(notifyOwner.mock.calls[0]?.[0]).toMatchObject({
      title: "🏢 New Business Claim: Hornet Moving",
    });
    expect(notifyOwner.mock.calls[0]?.[0]?.content).toContain("Business: Hornet Moving (hornet-moving)");
  });

  it("resolves an active dynamic listing by exact serviceKey and ignores a spoofed name", async () => {
    getDirectoryListings.mockResolvedValueOnce([
      { serviceKey: "dynamic-exact-key", name: "Canonical Dynamic Business", active: true },
    ]);

    await appRouter.createCaller(userContext()).claims.submit({
      ...fixture,
      serviceKey: "dynamic-exact-key",
      businessName: "Spoofed Dynamic Name",
    });

    expect(submitBusinessClaim).toHaveBeenCalledWith(expect.objectContaining({
      serviceKey: "dynamic-exact-key",
      businessName: "Canonical Dynamic Business",
    }));
    const notification = notifyOwner.mock.calls[0]?.[0];
    expect(notification?.title).toContain("Canonical Dynamic Business");
    expect(notification?.content).toContain("Business: Canonical Dynamic Business (dynamic-exact-key)");
    expect(JSON.stringify(notification)).not.toContain("Spoofed Dynamic Name");
  });

  it.each([
    ["unknown", [], "missing-business"],
    ["inactive", [{ serviceKey: "inactive-business", name: "Inactive Business", active: false }], "inactive-business"],
    ["non-exact dynamic key", [{ serviceKey: "case-sensitive-key", name: "Case Sensitive", active: true }], "Case-Sensitive-Key"],
  ])("rejects an %s serviceKey before duplicate check with no side effects", async (_label, listings, serviceKey) => {
    getDirectoryListings.mockResolvedValueOnce(listings);

    await expect(appRouter.createCaller(userContext()).claims.submit({
      ...fixture,
      serviceKey,
      businessName: "Untrusted Business Name",
    })).rejects.toMatchObject({ code: expect.stringMatching(/^(NOT_FOUND|BAD_REQUEST)$/) });

    expect(hasExistingClaim).not.toHaveBeenCalled();
    expect(submitBusinessClaim).not.toHaveBeenCalled();
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("keeps canonical duplicate behavior and produces no persistence or notification", async () => {
    hasExistingClaim.mockResolvedValueOnce(true);

    await expect(appRouter.createCaller(userContext()).claims.submit({
      ...fixture,
      serviceKey: "hornet-moving",
      businessName: "Spoofed Duplicate Name",
    })).resolves.toEqual(existingClaimResult);

    expect(hasExistingClaim).toHaveBeenCalledWith("hornet-moving", 42);
    expect(submitBusinessClaim).not.toHaveBeenCalled();
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("translates a duplicate-key insert race into the same neutral existing-claim result", async () => {
    submitBusinessClaim.mockRejectedValueOnce(
      Object.assign(new Error("Duplicate entry"), { code: "ER_DUP_ENTRY", errno: 1062 })
    );

    await expect(
      appRouter.createCaller(userContext()).claims.submit(fixture)
    ).resolves.toEqual(existingClaimResult);

    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("allows only one of two concurrent submissions to persist and notify", async () => {
    submitBusinessClaim
      .mockResolvedValueOnce({ id: 731 })
      .mockRejectedValueOnce(
        Object.assign(new Error("Duplicate entry"), { code: "ER_DUP_ENTRY", errno: 1062 })
      );

    const results = await Promise.all([
      appRouter.createCaller(userContext()).claims.submit(fixture),
      appRouter.createCaller(userContext()).claims.submit(fixture),
    ]);

    expect(results).toContainEqual({ success: true, id: 731 });
    expect(results).toContainEqual(existingClaimResult);
    expect(notifyOwner).toHaveBeenCalledTimes(1);
  });

  it("persists and notifies the canonical account identity while labeling submitted contact details", async () => {
    await appRouter.createCaller(userContext()).claims.submit({
      ...fixture,
      claimantName: "Arbitrary Submitted Name",
      claimantEmail: "business-contact@example.test",
    });

    expect(submitBusinessClaim).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      claimantName: "Fixture User",
      claimantEmail: "user@example.test",
    }));
    const notification = notifyOwner.mock.calls[0]?.[0];
    expect(notification?.content).toContain("Authenticated claimant: Fixture User (user@example.test; user ID 42)");
    expect(notification?.content).toContain("Business contact name: Arbitrary Submitted Name");
    expect(notification?.content).toContain("Business contact email: business-contact@example.test");
    expect(notification?.content).not.toContain("Claimant: Arbitrary Submitted Name");
  });

  it("does not present submitted contact identity as authenticated when account fields are unavailable", async () => {
    const context = userContext();
    context.user = { ...context.user!, name: null, email: null };

    await appRouter.createCaller(context).claims.submit({
      ...fixture,
      claimantName: "Submitted Contact",
      claimantEmail: "submitted-contact@example.test",
    });

    const notification = notifyOwner.mock.calls[0]?.[0];
    expect(notification?.content).toContain("Authenticated claimant: account name unavailable (account email unavailable; user ID 42)");
    expect(notification?.content).toContain("Business contact name: Submitted Contact");
    expect(notification?.content).toContain("Business contact email: submitted-contact@example.test");
    expect(notification?.content).not.toContain("Authenticated claimant: Submitted Contact");
  });
});
