import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const getApprovedClaimForUser = vi.fn();
const getListingOverride = vi.fn();

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getApprovedClaimForUser, getListingOverride };
});

function context(userId = 7): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user-${userId}@example.com`,
      name: "User",
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

describe("business listing override authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("denies an authenticated user who does not own the listing", async () => {
    getApprovedClaimForUser.mockResolvedValue([]);
    getListingOverride.mockResolvedValue({
      serviceKey: "victim-business",
      description: "secret",
    });
    const { appRouter } = await import("./routers");

    await expect(
      appRouter
        .createCaller(context())
        .businessPortal.getOverride({ serviceKey: "victim-business" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getListingOverride).not.toHaveBeenCalled();
  });
});
