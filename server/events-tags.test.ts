import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const mockEvents = [
  {
    id: 1,
    title: "South End Wine Walk",
    slug: "south-end-wine-walk-mar-2026",
    description: "Explore South End's best restaurants",
    startDate: new Date("2026-03-26T18:00:00Z"),
    endDate: new Date("2026-03-26T21:00:00Z"),
    venueName: "South End Rail Trail",
    venueAddress: "South End, Charlotte, NC",
    neighborhood: "South End",
    category: "food-drink",
    isFeatured: "yes",
    isRecurring: "no",
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    title: "Charlotte SHOUT!",
    slug: "charlotte-shout-2026",
    description: "Charlotte's signature spring arts festival",
    startDate: new Date("2026-04-10T12:00:00Z"),
    endDate: new Date("2026-04-26T22:00:00Z"),
    venueName: "Various Uptown Venues",
    venueAddress: "Uptown Charlotte, NC",
    neighborhood: "Uptown",
    category: "festivals",
    isFeatured: "yes",
    isRecurring: "no",
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockTags = [
  { id: 1, name: "Outdoor", slug: "outdoor", category: "activity" },
  { id: 2, name: "Family Friendly", slug: "family-friendly", category: "audience" },
  { id: 3, name: "Free", slug: "free", category: "price" },
];

const mockContentTags = [
  { tagId: 1, contentType: "event", contentId: "south-end-wine-walk-mar-2026" },
  { tagId: 2, contentType: "event", contentId: "charlotte-shout-2026" },
];

vi.mock("./db", () => {
  const events = [
    {
      id: 1, title: "South End Wine Walk", slug: "south-end-wine-walk-mar-2026",
      description: "Explore South End's best restaurants",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      venueName: "South End Rail Trail", venueAddress: "South End, Charlotte, NC",
      neighborhood: "South End", category: "food-drink", isFeatured: "yes",
      isRecurring: "no", status: "published", createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 2, title: "Charlotte SHOUT!", slug: "charlotte-shout-2026",
      description: "Charlotte's signature spring arts festival",
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      venueName: "Various Uptown Venues", venueAddress: "Uptown Charlotte, NC",
      neighborhood: "Uptown", category: "festivals", isFeatured: "yes",
      isRecurring: "no", status: "published", createdAt: new Date(), updatedAt: new Date(),
    },
  ];
  const tags = [
    { id: 1, name: "Outdoor", slug: "outdoor", category: "activity" },
    { id: 2, name: "Family Friendly", slug: "family-friendly", category: "audience" },
    { id: 3, name: "Free", slug: "free", category: "price" },
  ];
  const contentTagItems = [
    { tagId: 1, contentType: "event", contentId: "south-end-wine-walk-mar-2026" },
    { tagId: 2, contentType: "event", contentId: "charlotte-shout-2026" },
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
    getPublishedBlogPosts: vi.fn().mockResolvedValue([]),
    getAllBlogPosts: vi.fn().mockResolvedValue([]),
    getBlogPostBySlug: vi.fn(),
    getLeaderboardByStamps: vi.fn().mockResolvedValue([]),
    getLeaderboardByBingo: vi.fn().mockResolvedValue([]),
    getLeaderboardByNeighborhoods: vi.fn().mockResolvedValue([]),
    createEvent: vi.fn().mockResolvedValue({ insertId: 1 }),
    updateEvent: vi.fn().mockResolvedValue({}),
    deleteEvent: vi.fn().mockResolvedValue({}),
    getPublishedEvents: vi.fn().mockImplementation(() => Promise.resolve(events)),
    getAllEvents: vi.fn().mockImplementation(() => Promise.resolve(events)),
    getEventBySlug: vi.fn().mockImplementation((slug: string) =>
      Promise.resolve(events.find((e) => e.slug === slug) ?? null)
    ),
    getEventById: vi.fn().mockResolvedValue(events[0]),
    createTag: vi.fn().mockResolvedValue({ insertId: 1 }),
    getAllTags: vi.fn().mockImplementation(() => Promise.resolve(tags)),
    getTagBySlug: vi.fn().mockImplementation((slug: string) =>
      Promise.resolve(tags.find((t) => t.slug === slug) ?? null)
    ),
    addContentTag: vi.fn().mockResolvedValue({}),
    removeContentTag: vi.fn().mockResolvedValue({}),
    getContentTags: vi.fn().mockImplementation(() => Promise.resolve(contentTagItems)),
    getContentByTag: vi.fn().mockImplementation(() => Promise.resolve(contentTagItems)),
    bulkAddContentTags: vi.fn().mockResolvedValue({}),
    getBusinessSubmissions: vi.fn().mockResolvedValue([]),
    getBusinessSubmissionCount: vi.fn().mockResolvedValue(0),
    updateBusinessSubmissionStatus: vi.fn().mockResolvedValue({}),
    deleteBusinessSubmission: vi.fn().mockResolvedValue({}),
    isNotificationEnabled: vi.fn().mockResolvedValue(true),
    getUserById: vi.fn().mockResolvedValue(null),
    getRecentActivity: vi.fn().mockResolvedValue([]),
    getDirectoryListings: vi.fn().mockResolvedValue([]),
    getAllDirectoryListings: vi.fn().mockResolvedValue([]),
    addDirectoryListing: vi.fn().mockResolvedValue({ insertId: 1 }),
    updateDirectoryListing: vi.fn().mockResolvedValue({}),
    deleteDirectoryListing: vi.fn().mockResolvedValue({}),
    updateUserNewsletter: vi.fn().mockResolvedValue({}),
    trackTagEngagement: vi.fn().mockResolvedValue({}),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

const publicCtx: TrpcContext = { user: null };
const publicCaller = appRouter.createCaller(publicCtx);

const adminCtx: TrpcContext = {
  user: {
    id: 1,
    openId: "admin-user",
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
  } as any,
};
const adminCaller = appRouter.createCaller(adminCtx);

describe("Events API", () => {
  it("should return published events (public)", async () => {
    const result = await publicCaller.events.getPublished();
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("South End Wine Walk");
    expect(result[1].title).toBe("Charlotte SHOUT!");
  });

  it("should return event by slug (public)", async () => {
    const result = await publicCaller.events.getBySlug({
      slug: "charlotte-shout-2026",
    });
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Charlotte SHOUT!");
    expect(result!.category).toBe("festivals");
  });

  it("should return null for non-existent slug", async () => {
    const result = await publicCaller.events.getBySlug({
      slug: "non-existent-event",
    });
    expect(result).toBeNull();
  });

  it("should return this week's events (public)", async () => {
    const result = await publicCaller.events.getThisWeek();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return events with required fields", async () => {
    const result = await publicCaller.events.getPublished();
    for (const event of result) {
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("slug");
      expect(event).toHaveProperty("category");
      expect(event).toHaveProperty("startDate");
    }
  });
});

describe("Tags API", () => {
  it("should return all tags (public)", async () => {
    const result = await publicCaller.tags.getAll();
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("Outdoor");
  });

  it("should return tag by slug (public)", async () => {
    const result = await publicCaller.tags.getBySlug({ slug: "outdoor" });
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Outdoor");
    expect(result!.category).toBe("activity");
  });

  it("should return null for non-existent tag slug", async () => {
    const result = await publicCaller.tags.getBySlug({ slug: "non-existent" });
    expect(result).toBeNull();
  });

  it("should return content tags for a content item", async () => {
    const result = await publicCaller.tags.getContentTags({
      contentType: "event",
      contentId: "south-end-wine-walk-mar-2026",
    });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("should return content items by tag", async () => {
    const result = await publicCaller.tags.getContentByTag({ tagId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });
});
