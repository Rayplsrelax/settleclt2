import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
const mockGetActiveBingoCards = vi.fn().mockResolvedValue([
  {
    id: 1,
    title: "Charlotte Brewery Tour",
    description: "Visit all the best breweries in CLT",
    theme: "food-drink",
    squaresJson: JSON.stringify([
      { id: 1, label: "NoDa Brewing" },
      { id: 2, label: "Olde Meck" },
      { id: 3, label: "Sycamore" },
      { id: 4, label: "Birdsong" },
      { id: 5, label: "Wooden Robot" },
      { id: 6, label: "Divine Barrel" },
      { id: 7, label: "Resident Culture" },
      { id: 8, label: "Suffolk Punch" },
      { id: 9, label: "Free Range" },
    ]),
    active: "yes",
    createdAt: new Date(),
  },
]);

const mockGetBingoProgress = vi.fn().mockResolvedValue([
  {
    id: 1,
    userId: 42,
    cardId: 1,
    completedSquaresJson: JSON.stringify([1, 2, 3]),
    completedAt: null,
    startedAt: new Date(),
    updatedAt: new Date(),
  },
]);

const mockUpsertBingoProgress = vi.fn().mockResolvedValue({ success: true });

vi.mock("./db", () => ({
  getActiveBingoCards: (...args: any[]) => mockGetActiveBingoCards(...args),
  getBingoProgress: (...args: any[]) => mockGetBingoProgress(...args),
  upsertBingoProgress: (...args: any[]) => mockUpsertBingoProgress(...args),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  insertMovingQuote: vi.fn(),
  insertBusinessSubmission: vi.fn(),
  insertNewsletterSubscriber: vi.fn(),
  upsertEnrichedService: vi.fn(),
  getEnrichedService: vi.fn(),
  getAllEnrichedServices: vi.fn().mockResolvedValue([]),
  addPassportEntry: vi.fn(),
  getPassportEntries: vi.fn(),
  deletePassportEntry: vi.fn(),
  addWishlistEntry: vi.fn(),
  removeWishlistEntry: vi.fn(),
  getWishlistEntries: vi.fn(),
  getCommentsByServiceKey: vi.fn(),
  addComment: vi.fn(),
  deleteComment: vi.fn(),
  voteComment: vi.fn(),
  removeVote: vi.fn(),
  getVotesByUser: vi.fn(),
  getAllBlogPosts: vi.fn().mockResolvedValue([]),
  getPublishedBlogPosts: vi.fn().mockResolvedValue([]),
  getBlogPostBySlug: vi.fn(),
  upsertBlogPost: vi.fn(),
  deleteBlogPost: vi.fn(),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

const authedCtx: TrpcContext = {
  user: { id: 42, openId: "test-user", name: "Test User", email: "test@example.com", role: "user" } as any,
};

const publicCtx: TrpcContext = {
  user: null,
};

const caller = appRouter.createCaller(authedCtx);
const publicCaller = appRouter.createCaller(publicCtx);

describe("Bingo Cards API", () => {
  it("should return active bingo cards (public)", async () => {
    const cards = await publicCaller.bingo.getCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].title).toBe("Charlotte Brewery Tour");
    expect(cards[0].theme).toBe("food-drink");
    expect(mockGetActiveBingoCards).toHaveBeenCalled();
  });

  it("should return bingo progress for authenticated user", async () => {
    const progress = await caller.bingo.getProgress();
    expect(progress).toHaveLength(1);
    expect(progress[0].cardId).toBe(1);
    expect(mockGetBingoProgress).toHaveBeenCalledWith(42);
  });

  it("should update bingo progress", async () => {
    const completedSquares = JSON.stringify([1, 2, 3, 4]);
    await caller.bingo.updateProgress({
      cardId: 1,
      completedSquaresJson: completedSquares,
    });
    expect(mockUpsertBingoProgress).toHaveBeenCalledWith({
      userId: 42,
      cardId: 1,
      completedSquaresJson: completedSquares,
      completedAt: null,
    });
  });

  it("should handle bingo card completion with date", async () => {
    const completedSquares = JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const completedAt = new Date();
    await caller.bingo.updateProgress({
      cardId: 1,
      completedSquaresJson: completedSquares,
      completedAt,
    });
    expect(mockUpsertBingoProgress).toHaveBeenCalledWith({
      userId: 42,
      cardId: 1,
      completedSquaresJson: completedSquares,
      completedAt,
    });
  });

  it("should parse squares JSON from bingo cards", async () => {
    const cards = await publicCaller.bingo.getCards();
    const squares = JSON.parse(cards[0].squaresJson);
    expect(squares).toHaveLength(9);
    expect(squares[0]).toHaveProperty("id");
    expect(squares[0]).toHaveProperty("label");
    expect(squares[0].label).toBe("NoDa Brewing");
  });
});

describe("Enrichment data integrity", () => {
  it("should have enriched services query available", async () => {
    // The getAllEnrichments admin procedure exists and is callable
    const adminCtx: TrpcContext = {
      user: { id: 1, openId: "admin-user", name: "Admin", email: "admin@test.com", role: "admin" } as any,
    };
    const adminCaller = appRouter.createCaller(adminCtx);
    const enrichments = await adminCaller.admin.getAllEnrichments();
    expect(Array.isArray(enrichments)).toBe(true);
  });
});
