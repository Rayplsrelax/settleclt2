import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

// Mock the db module
vi.mock("./db", () => ({
  createBlogResearchIdea: vi.fn().mockResolvedValue({ insertId: 1 }),
  getAllBlogResearchIdeas: vi.fn().mockResolvedValue([
    {
      id: 1,
      title: "Best Brunch Spots in South End",
      description: "A guide to the top brunch restaurants",
      outline: "## Introduction\n## Top 5 Spots\n## Conclusion",
      source: "Charlotte Agenda",
      category: "food-drink",
      keywords: "brunch, south end, charlotte",
      status: "idea",
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  updateBlogResearchIdea: vi.fn().mockResolvedValue({ success: true }),
  deleteBlogResearchIdea: vi.fn().mockResolvedValue({ success: true }),
  trackTagEngagement: vi.fn().mockResolvedValue({ insertId: 1 }),
  getTrendingTags: vi.fn().mockResolvedValue([
    { tagId: 1, tagName: "South End", tagSlug: "south-end", tagCategory: "neighborhood", engagementCount: 42 },
    { tagId: 2, tagName: "Brunch", tagSlug: "brunch", tagCategory: "activity", engagementCount: 35 },
  ]),
  bulkTrackTagEngagement: vi.fn().mockResolvedValue({ success: true }),
  // Include all other exports that routers.ts imports
  insertBusinessSubmission: vi.fn(),
  insertNewsletterSubscriber: vi.fn(),
  upsertEnrichedService: vi.fn(),
  getEnrichedService: vi.fn(),
  getAllEnrichedServices: vi.fn(),
  addPassportEntry: vi.fn(),
  getPassportEntries: vi.fn(),
  deletePassportEntry: vi.fn(),
  getActiveBingoCards: vi.fn(),
  getBingoProgress: vi.fn(),
  upsertBingoProgress: vi.fn(),
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
  getLeaderboardByStamps: vi.fn(),
  getLeaderboardByBingo: vi.fn(),
  getLeaderboardByNeighborhoods: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  getPublishedEvents: vi.fn(),
  getAllEvents: vi.fn(),
  getEventBySlug: vi.fn(),
  getEventById: vi.fn(),
  createTag: vi.fn(),
  getAllTags: vi.fn(),
  getTagBySlug: vi.fn(),
  addContentTag: vi.fn(),
  removeContentTag: vi.fn(),
  getContentTags: vi.fn(),
  getContentByTag: vi.fn(),
  bulkAddContentTags: vi.fn(),
  getRecentActivity: vi.fn(),
  addDirectoryListing: vi.fn(),
  getDirectoryListings: vi.fn(),
  getAllDirectoryListings: vi.fn(),
  updateDirectoryListing: vi.fn(),
  deleteDirectoryListing: vi.fn(),
  updateUserNewsletter: vi.fn(),
}));

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          ideas: [
            {
              title: "10 Best Brunch Spots in South End Charlotte",
              description: "A comprehensive guide to the best brunch restaurants in South End.",
              outline: "## Introduction\n## Top 10 Spots\n## Price Comparison\n## Conclusion",
              keywords: "brunch, south end, charlotte, restaurants",
              category: "food-drink",
              source: "Charlotte Agenda",
            },
          ],
        }),
      },
    }],
  }),
}));

// Mock map module
vi.mock("./_core/map", () => ({
  makeRequest: vi.fn(),
}));

// Mock notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("research router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAll returns saved research ideas for admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.research.getAll();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Best Brunch Spots in South End");
  });

  it("getAll rejects non-admin users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.research.getAll()).rejects.toThrow();
  });

  it("generate creates AI blog ideas and saves them", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.research.generate({
      topic: "best brunch spots",
      category: "food-drink",
    });

    expect(result.ideas).toHaveLength(1);
    expect(result.ideas[0].title).toContain("Brunch");
    expect(result.savedCount).toBe(1);
  });

  it("generate rejects empty topic", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.research.generate({ topic: "" })
    ).rejects.toThrow();
  });

  it("save creates a manual research idea", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.research.save({
      title: "Manual Idea: NoDa Art Walk",
      description: "Guide to the NoDa art walk experience",
      category: "lifestyle",
    });

    expect(result).toBeTruthy();
  });

  it("update changes idea status", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.research.update({
      id: 1,
      status: "researching",
    });

    expect(result).toEqual({ success: true });
  });

  it("delete removes an idea", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.research.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

describe("trending router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getTrending returns trending tags for public users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trending.getTrending({ limit: 10, days: 7 });
    expect(result).toHaveLength(2);
    expect(result[0].tagName).toBe("South End");
    expect(result[0].engagementCount).toBe(42);
  });

  it("getTrending works with default params", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trending.getTrending();
    expect(result).toHaveLength(2);
  });

  it("track records tag engagement", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trending.track({
      tagId: 1,
      engagementType: "click",
    });

    expect(result).toEqual({ success: true });
  });

  it("track records engagement with content context", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trending.track({
      tagId: 1,
      engagementType: "view",
      contentType: "event",
      contentId: "summer-music-fest",
    });

    expect(result).toEqual({ success: true });
  });

  it("trackBatch records multiple engagements at once", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trending.trackBatch({
      entries: [
        { tagId: 1, engagementType: "view" },
        { tagId: 2, engagementType: "click" },
        { tagId: 1, engagementType: "stamp" },
      ],
    });

    expect(result).toEqual({ success: true });
  });

  it("track rejects invalid engagement type", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.trending.track({
        tagId: 1,
        engagementType: "invalid" as any,
      })
    ).rejects.toThrow();
  });
});
