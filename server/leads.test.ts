import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  insertMovingQuote: vi.fn().mockResolvedValue({ success: true }),
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

describe("leads.submitQuote", () => {
  it("accepts a valid moving quote submission", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.submitQuote({
      name: "Jane Smith",
      email: "jane@example.com",
      fromCity: "New York",
      moveDate: "2026-06-01",
    });

    expect(result).toEqual({ success: true });
  });

  it("accepts a quote with only required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.submitQuote({
      name: "John Doe",
      email: "john@example.com",
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects a quote with invalid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.submitQuote({
        name: "Bad Email",
        email: "not-an-email",
      })
    ).rejects.toThrow();
  });

  it("rejects a quote with empty name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.submitQuote({
        name: "",
        email: "test@example.com",
      })
    ).rejects.toThrow();
  });
});

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
