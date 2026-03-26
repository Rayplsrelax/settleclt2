import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock data
vi.mock("./db", () => {
  const blogPosts = [
    {
      id: 1, title: "Moving to Charlotte Checklist", slug: "moving-to-charlotte-checklist",
      excerpt: "Your complete moving guide", content: "# Moving Checklist\n\nStep 1...",
      category: "Getting Started", authorId: 1, status: "published", readTime: "8 min",
      publishedAt: new Date("2026-03-01"), createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 6, title: "This Weekend in CLT: Spring 2026", slug: "this-weekend-in-clt-spring-2026",
      excerpt: "Spring events guide", content: "# This Weekend in CLT\n\nSpring events...",
      category: "Events", authorId: 1, status: "published", readTime: "5 min",
      publishedAt: new Date("2026-03-20"), createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 7, title: "NoDa Deep Dive", slug: "noda-neighborhood-deep-dive",
      excerpt: "NoDa neighborhood guide", content: "# NoDa Deep Dive\n\nNoDa is Charlotte's arts district...",
      category: "Neighborhoods", authorId: 1, status: "published", readTime: "10 min",
      publishedAt: new Date("2026-03-22"), createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 8, title: "Charlotte Summer Survival Guide 2026", slug: "charlotte-summer-survival-guide-2026",
      excerpt: "Beat the heat", content: "# Summer Guide\n\nCharlotte summers are hot...",
      category: "Seasonal", authorId: 1, status: "published", readTime: "8 min",
      publishedAt: new Date("2026-03-24"), createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 9, title: "Date Night in Charlotte", slug: "date-night-charlotte-guide",
      excerpt: "25 creative date ideas", content: "# Date Night\n\n25 ideas...",
      category: "Lifestyle", authorId: 1, status: "published", readTime: "7 min",
      publishedAt: new Date("2026-03-25"), createdAt: new Date(), updatedAt: new Date(),
    },
  ];

  const events = [
    {
      id: 1, title: "South End Wine Walk", slug: "south-end-wine-walk",
      description: "Wine tasting along South End", startDate: new Date("2026-03-28T18:00:00Z"),
      endDate: new Date("2026-03-28T21:00:00Z"), venueName: "South End Rail Trail",
      venueAddress: "South End, Charlotte, NC", neighborhood: "South End",
      category: "food-drink", isFeatured: "yes", isRecurring: "no",
      status: "published", createdAt: new Date(), updatedAt: new Date(),
    },
  ];

  const tags = [
    { id: 1, name: "Uptown", slug: "uptown", category: "neighborhood", createdAt: new Date() },
    { id: 9, name: "Food & Drink", slug: "food-drink", category: "activity", createdAt: new Date() },
    { id: 18, name: "Date Night", slug: "date-night", category: "audience", createdAt: new Date() },
    { id: 19, name: "New to Charlotte", slug: "new-to-charlotte", category: "audience", createdAt: new Date() },
  ];

  const contentTags = [
    { tagId: 9, contentType: "blog", contentId: "9" },
    { tagId: 18, contentType: "blog", contentId: "9" },
    { tagId: 19, contentType: "blog", contentId: "1" },
  ];

  return {
    upsertUser: vi.fn(), getUserByOpenId: vi.fn(),
    insertBusinessSubmission: vi.fn(), insertNewsletterSubscriber: vi.fn(),
    upsertEnrichedService: vi.fn(), getEnrichedService: vi.fn(),
    getAllEnrichedServices: vi.fn().mockResolvedValue([]),
    addPassportEntry: vi.fn(), getPassportEntries: vi.fn().mockResolvedValue([]),
    deletePassportEntry: vi.fn(),
    getActiveBingoCards: vi.fn().mockResolvedValue([]),
    getBingoProgress: vi.fn().mockResolvedValue([]),
    upsertBingoProgress: vi.fn(),
    addWishlistEntry: vi.fn(), removeWishlistEntry: vi.fn(),
    getWishlistEntries: vi.fn().mockResolvedValue([]),
    updateWishlistNotes: vi.fn(),
    addComment: vi.fn(), getComments: vi.fn().mockResolvedValue([]),
    deleteComment: vi.fn(), voteComment: vi.fn(),
    getUserVotes: vi.fn().mockResolvedValue([]),
    createBlogPost: vi.fn(), updateBlogPost: vi.fn(), deleteBlogPost: vi.fn(),
    getPublishedBlogPosts: vi.fn().mockResolvedValue(blogPosts),
    getAllBlogPosts: vi.fn().mockResolvedValue(blogPosts),
    getBlogPostBySlug: vi.fn().mockImplementation((slug: string) =>
      Promise.resolve(blogPosts.find(p => p.slug === slug) ?? null)
    ),
    getLeaderboardByStamps: vi.fn().mockResolvedValue([]),
    getLeaderboardByBingo: vi.fn().mockResolvedValue([]),
    getLeaderboardByNeighborhoods: vi.fn().mockResolvedValue([]),
    createEvent: vi.fn().mockResolvedValue({ insertId: 1 }),
    updateEvent: vi.fn(), deleteEvent: vi.fn(),
    getPublishedEvents: vi.fn().mockResolvedValue(events),
    getAllEvents: vi.fn().mockResolvedValue(events),
    getEventBySlug: vi.fn().mockImplementation((slug: string) =>
      Promise.resolve(events.find(e => e.slug === slug) ?? null)
    ),
    getEventById: vi.fn().mockResolvedValue(events[0]),
    createTag: vi.fn().mockResolvedValue({ insertId: 1 }),
    getAllTags: vi.fn().mockResolvedValue(tags),
    getTagBySlug: vi.fn().mockImplementation((slug: string) =>
      Promise.resolve(tags.find(t => t.slug === slug) ?? null)
    ),
    addContentTag: vi.fn(), removeContentTag: vi.fn(),
    getContentTags: vi.fn().mockResolvedValue(contentTags),
    getContentByTag: vi.fn().mockResolvedValue(contentTags),
    bulkAddContentTags: vi.fn(),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

const publicCtx: TrpcContext = { user: null };
const publicCaller = appRouter.createCaller(publicCtx);

describe("Phase 2 — Blog Articles", () => {
  it("should return all published blog posts", async () => {
    const result = await publicCaller.blog.getPublished();
    expect(result).toHaveLength(5);
    expect(result.some(p => p.slug === "this-weekend-in-clt-spring-2026")).toBe(true);
    expect(result.some(p => p.slug === "noda-neighborhood-deep-dive")).toBe(true);
    expect(result.some(p => p.slug === "charlotte-summer-survival-guide-2026")).toBe(true);
    expect(result.some(p => p.slug === "date-night-charlotte-guide")).toBe(true);
  });

  it("should return a blog post by slug", async () => {
    const result = await publicCaller.blog.getBySlug({ slug: "noda-neighborhood-deep-dive" });
    expect(result).not.toBeNull();
    expect(result!.title).toBe("NoDa Deep Dive");
    expect(result!.category).toBe("Neighborhoods");
    expect(result!.readTime).toBe("10 min");
  });

  it("should return null for non-existent blog slug", async () => {
    const result = await publicCaller.blog.getBySlug({ slug: "non-existent-article" });
    expect(result).toBeNull();
  });

  it("should return new Phase 2 articles with correct categories", async () => {
    const result = await publicCaller.blog.getPublished();
    const eventArticle = result.find(p => p.slug === "this-weekend-in-clt-spring-2026");
    expect(eventArticle?.category).toBe("Events");
    const seasonalArticle = result.find(p => p.slug === "charlotte-summer-survival-guide-2026");
    expect(seasonalArticle?.category).toBe("Seasonal");
    const lifestyleArticle = result.find(p => p.slug === "date-night-charlotte-guide");
    expect(lifestyleArticle?.category).toBe("Lifestyle");
  });
});

describe("Phase 2 — Tags with Content Associations", () => {
  it("should return all tags with correct categories", async () => {
    const result = await publicCaller.tags.getAll();
    expect(result).toHaveLength(4);
    const neighborhoodTags = result.filter(t => t.category === "neighborhood");
    expect(neighborhoodTags.length).toBeGreaterThanOrEqual(1);
    const activityTags = result.filter(t => t.category === "activity");
    expect(activityTags.length).toBeGreaterThanOrEqual(1);
  });

  it("should return content tags for a blog post", async () => {
    const result = await publicCaller.tags.getContentTags({
      contentType: "blog",
      contentId: "9",
    });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("should return content items by tag ID", async () => {
    const result = await publicCaller.tags.getContentByTag({ tagId: 9 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return tag by slug", async () => {
    const result = await publicCaller.tags.getBySlug({ slug: "food-drink" });
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Food & Drink");
    expect(result!.category).toBe("activity");
  });
});

describe("Phase 2 — Events with Filters", () => {
  it("should return events with optional filters", async () => {
    const result = await publicCaller.events.getPublished({
      category: "food-drink",
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return this week's events", async () => {
    const result = await publicCaller.events.getThisWeek();
    expect(Array.isArray(result)).toBe(true);
  });
});
