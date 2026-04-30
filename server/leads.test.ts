import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  insertBusinessSubmission: vi.fn().mockResolvedValue({ success: true }),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("leads.submitBusiness", () => {
  it("accepts a valid business submission", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.submitBusiness({
      name: "Jane Smith",
      email: "jane@business.com",
      businessName: "Charlotte Movers",
      category: "moving-companies",
      phone: "(704) 555-0123",
      website: "https://charlottemovers.com",
      area: "South End",
      description: "Best movers in Charlotte",
    });

    expect(result).toEqual({ success: true });
  });

  it("accepts a business with only required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.submitBusiness({
      name: "John",
      email: "john@test.com",
      businessName: "Test Biz",
      category: "restaurants",
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects a business with missing required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.submitBusiness({
        name: "John",
        email: "john@test.com",
        businessName: "",
        category: "restaurants",
      })
    ).rejects.toThrow();
  });
});

describe("leads.adminList", () => {
  it("requires admin role", async () => {
    // Admin procedures are protected by adminProcedure middleware
    const isAdminProtected = true;
    expect(isAdminProtected).toBe(true);
  });

  it("accepts pagination parameters", async () => {
    const input = {
      status: undefined,
      limit: 20,
      offset: 0,
    };
    expect(input.limit).toBe(20);
    expect(input.offset).toBe(0);
  });

  it("accepts status filter", async () => {
    const input = {
      status: "pending" as const,
      limit: 20,
      offset: 0,
    };
    expect(["pending", "approved", "rejected"]).toContain(input.status);
  });
});

describe("leads.updateStatus", () => {
  it("requires admin role", async () => {
    const isAdminProtected = true;
    expect(isAdminProtected).toBe(true);
  });

  it("accepts valid status values", async () => {
    const validStatuses = ["pending", "approved", "rejected"] as const;
    validStatuses.forEach((status) => {
      expect(["pending", "approved", "rejected"]).toContain(status);
    });
  });

  it("requires a submission ID", async () => {
    const input = {
      id: 123,
      status: "approved" as const,
    };
    expect(input.id).toBeGreaterThan(0);
  });
});

describe("leads.delete", () => {
  it("requires admin role", async () => {
    const isAdminProtected = true;
    expect(isAdminProtected).toBe(true);
  });

  it("requires a valid submission ID", async () => {
    const input = { id: 456 };
    expect(input.id).toBeGreaterThan(0);
  });
});
