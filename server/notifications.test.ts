import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the notification module
const mockNotifyOwner = vi.fn().mockResolvedValue(true);
vi.mock("./_core/notification", () => ({
  notifyOwner: (...args: any[]) => mockNotifyOwner(...args),
}));

// Mock the db module
vi.mock("./db", () => ({
  insertBusinessSubmission: vi.fn().mockResolvedValue({ success: true }),
  insertNewsletterSubscriber: vi.fn().mockResolvedValue({ success: true }),
  upsertBingoProgress: vi.fn().mockResolvedValue({ success: true }),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  // Stubs for other imports
  upsertEnrichedService: vi.fn(),
  getEnrichedService: vi.fn(),
  getAllEnrichedServices: vi.fn(),
  addPassportEntry: vi.fn(),
  getPassportEntries: vi.fn(),
  deletePassportEntry: vi.fn(),
  getActiveBingoCards: vi.fn().mockResolvedValue([]),
  getBingoProgress: vi.fn().mockResolvedValue([]),
  addWishlistEntry: vi.fn(),
  removeWishlistEntry: vi.fn(),
  getWishlistEntries: vi.fn(),
  updateWishlistNotes: vi.fn(),
  addComment: vi.fn(),
  getComments: vi.fn(),
  deleteComment: vi.fn(),
  voteComment: vi.fn(),
  getUserVotes: vi.fn(),
  createBlogPost: vi.fn(),
  updateBlogPost: vi.fn(),
  deleteBlogPost: vi.fn(),
  getPublishedBlogPosts: vi.fn(),
  getAllBlogPosts: vi.fn(),
  getBlogPostBySlug: vi.fn(),
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

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: "user-123",
      openId: "open-id-123",
      name: "Test User",
      email: "test@example.com",
      avatarUrl: null,
      role: "user",
      createdAt: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

beforeEach(() => {
  mockNotifyOwner.mockClear();
});

describe("Notifications - Business Submission", () => {
  it("sends notification when a business is submitted", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.leads.submitBusiness({
      name: "Jane Smith",
      email: "jane@business.com",
      businessName: "Charlotte Movers",
      category: "moving-companies",
      area: "South End",
      website: "https://charlottemovers.com",
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockNotifyOwner).toHaveBeenCalledTimes(1);
    expect(mockNotifyOwner).toHaveBeenCalledWith({
      title: "\ud83c\udfea New Business Listing Submitted",
      content: expect.stringContaining("Charlotte Movers"),
    });
    expect(mockNotifyOwner).toHaveBeenCalledWith({
      title: "\ud83c\udfea New Business Listing Submitted",
      content: expect.stringContaining("South End"),
    });
  });
});

describe("Notifications - Newsletter Signup", () => {
  it("sends notification when someone subscribes to newsletter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.newsletter.subscribe({
      email: "subscriber@example.com",
      source: "homepage",
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockNotifyOwner).toHaveBeenCalledTimes(1);
    expect(mockNotifyOwner).toHaveBeenCalledWith({
      title: "\ud83d\udcec New Newsletter Subscriber",
      content: expect.stringContaining("subscriber@example.com"),
    });
    expect(mockNotifyOwner).toHaveBeenCalledWith({
      title: "\ud83d\udcec New Newsletter Subscriber",
      content: expect.stringContaining("homepage"),
    });
  });
});

describe("Notifications - Bingo Card Completion", () => {
  it("sends notification when a bingo card is completed", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await caller.bingo.updateProgress({
      cardId: 1,
      completedSquaresJson: JSON.stringify([0, 1, 2, 3, 4]),
      completedAt: new Date("2026-03-25T12:00:00Z"),
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockNotifyOwner).toHaveBeenCalledTimes(1);
    expect(mockNotifyOwner).toHaveBeenCalledWith({
      title: "\ud83c\udfb0 Bingo Card Completed!",
      content: expect.stringContaining("Test User"),
    });
  });

  it("does NOT send notification for partial bingo progress (no completedAt)", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await caller.bingo.updateProgress({
      cardId: 1,
      completedSquaresJson: JSON.stringify([0, 1]),
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockNotifyOwner).not.toHaveBeenCalled();
  });
});

describe("Notifications - Resilience", () => {
  it("does not throw if notification fails (fire-and-forget)", async () => {
    mockNotifyOwner.mockRejectedValueOnce(new Error("Network error"));

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw even if notifyOwner fails
    const result = await caller.newsletter.subscribe({
      email: "test@example.com",
    });

    expect(result).toEqual({ success: true });
  });
});
