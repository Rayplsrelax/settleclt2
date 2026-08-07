import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const storagePut = vi.fn();
const getBusinessMembershipsForUser = vi.fn();
const getListingOverride = vi.fn();
const upsertListingOverride = vi.fn();
const getPremiumListing = vi.fn();

vi.mock("./storage", () => ({ storagePut }));
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getBusinessMembershipsForUser,
    getListingOverride,
    upsertListingOverride,
    getPremiumListing,
  };
});

const { appRouter } = await import("./routers");

const OWNER_MEMBERSHIP = [
  {
    id: 1,
    serviceKey: "hornet-moving",
    userId: 7,
    role: "owner",
    status: "active",
    ownerClaimId: 42,
  },
];

const PREMIUM_LISTING = {
  serviceKey: "hornet-moving",
  tier: "premium",
  paymentStatus: "active",
};

const FAKE_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("businessPortal.uploadPhotoFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storagePut.mockResolvedValue({ key: "business-photos/test.png", url: "https://cdn.example.com/test.png" });
    getBusinessMembershipsForUser.mockResolvedValue(OWNER_MEMBERSHIP);
    getListingOverride.mockResolvedValue({ photoUrls: null });
    upsertListingOverride.mockResolvedValue({});
    getPremiumListing.mockResolvedValue(PREMIUM_LISTING);
  });

  it("exists as a mutation on the businessPortal router", () => {
    const source = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(source).toContain("uploadPhotoFile");
  });

  it("uploads a file to storage and saves the resulting URL", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 7,
        openId: "user-7",
        email: "owner@example.com",
        name: "Owner",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        newsletterOptIn: true,
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const result = await caller.businessPortal.uploadPhotoFile({
      serviceKey: "hornet-moving",
      fileName: "storefront.png",
      contentType: "image/png",
      data: FAKE_PNG_BASE64,
    });

    expect(storagePut).toHaveBeenCalledTimes(1);
    expect(storagePut).toHaveBeenCalledWith(
      expect.stringContaining("business-photos/"),
      expect.any(Buffer),
      "image/png",
    );
    expect(upsertListingOverride).toHaveBeenCalledWith(
      "hornet-moving",
      42,
      expect.objectContaining({ photoUrls: "https://cdn.example.com/test.png" }),
    );
    expect(result).toEqual({ success: true, photos: ["https://cdn.example.com/test.png"] });
  });

  it("rejects non-image content types", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 7,
        openId: "user-7",
        email: "owner@example.com",
        name: "Owner",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        newsletterOptIn: true,
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    await expect(
      caller.businessPortal.uploadPhotoFile({
        serviceKey: "hornet-moving",
        fileName: "doc.pdf",
        contentType: "application/pdf",
        data: FAKE_PNG_BASE64,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(storagePut).not.toHaveBeenCalled();
  });

  it("enforces tier photo limits", async () => {
    getPremiumListing.mockResolvedValue({ tier: "basic", paymentStatus: "active" });
    getListingOverride.mockResolvedValue({ photoUrls: null });

    const caller = appRouter.createCaller({
      user: {
        id: 7,
        openId: "user-7",
        email: "owner@example.com",
        name: "Owner",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        newsletterOptIn: true,
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    await expect(
      caller.businessPortal.uploadPhotoFile({
        serviceKey: "hornet-moving",
        fileName: "photo.png",
        contentType: "image/jpeg",
        data: FAKE_PNG_BASE64,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(storagePut).not.toHaveBeenCalled();
  });

  it("rejects users without edit_listing permission", async () => {
    getBusinessMembershipsForUser.mockResolvedValue([]);

    const caller = appRouter.createCaller({
      user: {
        id: 99,
        openId: "user-99",
        email: "stranger@example.com",
        name: "Stranger",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        newsletterOptIn: true,
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    await expect(
      caller.businessPortal.uploadPhotoFile({
        serviceKey: "hornet-moving",
        fileName: "photo.png",
        contentType: "image/png",
        data: FAKE_PNG_BASE64,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(storagePut).not.toHaveBeenCalled();
  });

  it("rejects oversized files server-side", async () => {
    // Create a base64 string larger than 5MB (decode to ~6MB buffer)
    const largeData = "A".repeat(6 * 1024 * 1024);

    const caller = appRouter.createCaller({
      user: {
        id: 7,
        openId: "user-7",
        email: "owner@example.com",
        name: "Owner",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        newsletterOptIn: true,
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    await expect(
      caller.businessPortal.uploadPhotoFile({
        serviceKey: "hornet-moving",
        fileName: "big.png",
        contentType: "image/png",
        data: largeData,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(storagePut).not.toHaveBeenCalled();
  });
});
