import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  insertMovingQuote: vi.fn().mockResolvedValue({ success: true }),
  insertBusinessSubmission: vi.fn().mockResolvedValue({ success: true }),
  insertNewsletterSubscriber: vi.fn().mockResolvedValue({ success: true, alreadySubscribed: false }),
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

describe("newsletter.subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a valid email and returns success", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.newsletter.subscribe({
      email: "test@example.com",
    });

    expect(result).toEqual({ success: true, alreadySubscribed: false });
  });

  it("accepts an email with optional source", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.newsletter.subscribe({
      email: "test@example.com",
      source: "blog",
    });

    expect(result).toEqual({ success: true, alreadySubscribed: false });
  });

  it("rejects an invalid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.newsletter.subscribe({ email: "not-an-email" })
    ).rejects.toThrow();
  });

  it("rejects an empty email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.newsletter.subscribe({ email: "" })
    ).rejects.toThrow();
  });
});
