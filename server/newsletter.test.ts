import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const mockRequestNewsletterSubscription = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined)
);

vi.mock("./newsletter-service", () => ({
  requestNewsletterSubscription: mockRequestNewsletterSubscription,
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

const genericResponse = {
  success: true,
  message: "Your subscription request was received.",
};

describe("newsletter.subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a valid email and returns a generic response", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.newsletter.subscribe({ email: "test@example.com" });

    expect(result).toEqual(genericResponse);
    expect(mockRequestNewsletterSubscription).toHaveBeenCalledWith({
      email: "test@example.com",
      source: "homepage",
    });
  });

  it("accepts an email with an allowed source", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.newsletter.subscribe({
      email: "test@example.com",
      source: "blog",
    });

    expect(result).toEqual(genericResponse);
    expect(mockRequestNewsletterSubscription).toHaveBeenCalledWith({
      email: "test@example.com",
      source: "blog",
    });
  });

  it("rejects an invalid email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.newsletter.subscribe({ email: "not-an-email" })).rejects.toThrow();
  });

  it("rejects an empty email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.newsletter.subscribe({ email: "" })).rejects.toThrow();
  });
});
