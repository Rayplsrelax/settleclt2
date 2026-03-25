import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock leaderboard data
const mockStampsLeaderboard = [
  { userId: 1, userName: "Charlotte Explorer", stampCount: 42 },
  { userId: 2, userName: "NoDa Nomad", stampCount: 35 },
  { userId: 3, userName: "SouthEnd Sam", stampCount: 28 },
];

const mockBingoLeaderboard = [
  { userId: 2, userName: "NoDa Nomad", completedCards: 3, totalEntries: 4 },
  { userId: 1, userName: "Charlotte Explorer", completedCards: 2, totalEntries: 4 },
];

const mockNeighborhoodsLeaderboard = [
  { userId: 1, userName: "Charlotte Explorer", neighborhoodCount: 15 },
  { userId: 3, userName: "SouthEnd Sam", neighborhoodCount: 10 },
];

vi.mock("./db", () => ({
  getLeaderboardByStamps: vi.fn().mockImplementation(() => Promise.resolve(mockStampsLeaderboard)),
  getLeaderboardByBingo: vi.fn().mockImplementation(() => Promise.resolve(mockBingoLeaderboard)),
  getLeaderboardByNeighborhoods: vi.fn().mockImplementation(() => Promise.resolve(mockNeighborhoodsLeaderboard)),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  insertMovingQuote: vi.fn(),
  insertBusinessSubmission: vi.fn(),
  insertNewsletterSubscriber: vi.fn(),
  upsertEnrichedService: vi.fn(),
  getEnrichedService: vi.fn(),
  getAllEnrichedServices: vi.fn().mockResolvedValue([]),
  addPassportEntry: vi.fn(),
  getPassportEntries: vi.fn().mockResolvedValue([]),
  deletePassportEntry: vi.fn(),
  getActiveBingoCards: vi.fn().mockResolvedValue([]),
  getBingoProgress: vi.fn().mockResolvedValue([]),
  upsertBingoProgress: vi.fn(),
  addWishlistEntry: vi.fn(),
  removeWishlistEntry: vi.fn(),
  getWishlistEntries: vi.fn().mockResolvedValue([]),
  updateWishlistNotes: vi.fn(),
  addComment: vi.fn(),
  getComments: vi.fn().mockResolvedValue([]),
  deleteComment: vi.fn(),
  voteComment: vi.fn(),
  getUserVotes: vi.fn().mockResolvedValue([]),
  createBlogPost: vi.fn(),
  updateBlogPost: vi.fn(),
  deleteBlogPost: vi.fn(),
  getPublishedBlogPosts: vi.fn().mockResolvedValue([]),
  getAllBlogPosts: vi.fn().mockResolvedValue([]),
  getBlogPostBySlug: vi.fn(),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

const publicCtx: TrpcContext = { user: null };
const publicCaller = appRouter.createCaller(publicCtx);

const authedCtx: TrpcContext = {
  user: { id: 1, openId: "test-user", name: "Charlotte Explorer", email: "test@example.com", role: "user" } as any,
};
const authedCaller = appRouter.createCaller(authedCtx);

describe("Leaderboard API", () => {
  it("should return stamps leaderboard (public)", async () => {
    const result = await publicCaller.leaderboard.byStamps();
    expect(result).toHaveLength(3);
    expect(result[0].userName).toBe("Charlotte Explorer");
    expect(result[0].stampCount).toBe(42);
    expect(result[0].stampCount).toBeGreaterThanOrEqual(result[1].stampCount);
  });

  it("should return bingo leaderboard (public)", async () => {
    const result = await publicCaller.leaderboard.byBingo();
    expect(result).toHaveLength(2);
    expect(result[0].completedCards).toBe(3);
    expect(result[0].userName).toBe("NoDa Nomad");
  });

  it("should return neighborhoods leaderboard (public)", async () => {
    const result = await publicCaller.leaderboard.byNeighborhoods();
    expect(result).toHaveLength(2);
    expect(result[0].neighborhoodCount).toBe(15);
  });

  it("should be accessible without authentication", async () => {
    const stamps = await publicCaller.leaderboard.byStamps();
    const bingo = await publicCaller.leaderboard.byBingo();
    const neighborhoods = await publicCaller.leaderboard.byNeighborhoods();
    expect(Array.isArray(stamps)).toBe(true);
    expect(Array.isArray(bingo)).toBe(true);
    expect(Array.isArray(neighborhoods)).toBe(true);
  });

  it("should also be accessible for authenticated users", async () => {
    const stamps = await authedCaller.leaderboard.byStamps();
    expect(stamps).toHaveLength(3);
  });

  it("should return entries with required fields", async () => {
    const result = await publicCaller.leaderboard.byStamps();
    for (const entry of result) {
      expect(entry).toHaveProperty("userId");
      expect(entry).toHaveProperty("userName");
      expect(entry).toHaveProperty("stampCount");
      expect(typeof entry.userId).toBe("number");
      expect(typeof entry.stampCount).toBe("number");
    }
  });
});
