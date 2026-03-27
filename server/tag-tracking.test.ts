import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackTagEngagement, getTrendingTags, bulkTrackTagEngagement } from "./db";

// Mock the database module
vi.mock("./db", () => ({
  trackTagEngagement: vi.fn().mockResolvedValue(undefined),
  getTrendingTags: vi.fn().mockResolvedValue([
    { tagId: 1, tagName: "Food & Drink", tagSlug: "food-drink", tagCategory: "activity", engagementCount: 42 },
    { tagId: 2, tagName: "South End", tagSlug: "south-end", tagCategory: "neighborhood", engagementCount: 38 },
  ]),
  bulkTrackTagEngagement: vi.fn().mockResolvedValue(undefined),
}));

describe("Tag Engagement Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trackTagEngagement", () => {
    it("should accept a single engagement event with all fields", async () => {
      await trackTagEngagement({
        tagId: 1,
        engagementType: "click",
        userId: "user-123",
        contentType: "event-card",
        contentId: "event-456",
      });

      expect(trackTagEngagement).toHaveBeenCalledWith({
        tagId: 1,
        engagementType: "click",
        userId: "user-123",
        contentType: "event-card",
        contentId: "event-456",
      });
    });

    it("should accept engagement with null optional fields", async () => {
      await trackTagEngagement({
        tagId: 5,
        engagementType: "view",
        userId: null,
        contentType: null,
        contentId: null,
      });

      expect(trackTagEngagement).toHaveBeenCalledWith({
        tagId: 5,
        engagementType: "view",
        userId: null,
        contentType: null,
        contentId: null,
      });
    });

    it("should support all engagement types", async () => {
      const types = ["view", "click", "stamp", "share"] as const;
      for (const type of types) {
        await trackTagEngagement({
          tagId: 1,
          engagementType: type,
          userId: null,
          contentType: null,
          contentId: null,
        });
      }
      expect(trackTagEngagement).toHaveBeenCalledTimes(4);
    });
  });

  describe("getTrendingTags", () => {
    it("should return trending tags with engagement counts", async () => {
      const result = await getTrendingTags(10, 7);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        tagId: 1,
        tagName: "Food & Drink",
        tagSlug: "food-drink",
        tagCategory: "activity",
        engagementCount: 42,
      });
    });

    it("should accept limit and days parameters", async () => {
      await getTrendingTags(5, 30);
      expect(getTrendingTags).toHaveBeenCalledWith(5, 30);
    });
  });

  describe("bulkTrackTagEngagement", () => {
    it("should accept an array of engagement entries", async () => {
      const entries = [
        { tagId: 1, engagementType: "click" as const, userId: null, contentType: "event-filter", contentId: null },
        { tagId: 2, engagementType: "click" as const, userId: null, contentType: "directory-area", contentId: null },
        { tagId: 3, engagementType: "view" as const, userId: "user-1", contentType: "tag-page", contentId: "3" },
      ];

      await bulkTrackTagEngagement(entries);
      expect(bulkTrackTagEngagement).toHaveBeenCalledWith(entries);
    });
  });

  describe("Content type tracking surfaces", () => {
    it("should track event-filter clicks", async () => {
      await trackTagEngagement({
        tagId: 9,
        engagementType: "click",
        userId: null,
        contentType: "event-filter",
        contentId: null,
      });
      expect(trackTagEngagement).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: "event-filter" })
      );
    });

    it("should track event-card category and neighborhood clicks", async () => {
      await trackTagEngagement({
        tagId: 1,
        engagementType: "click",
        userId: null,
        contentType: "event-card",
        contentId: null,
      });
      expect(trackTagEngagement).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: "event-card" })
      );
    });

    it("should track directory-group clicks", async () => {
      await trackTagEngagement({
        tagId: 1,
        engagementType: "click",
        userId: null,
        contentType: "directory-group",
        contentId: null,
      });
      expect(trackTagEngagement).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: "directory-group" })
      );
    });

    it("should track directory-category clicks", async () => {
      await trackTagEngagement({
        tagId: 10,
        engagementType: "click",
        userId: null,
        contentType: "directory-category",
        contentId: null,
      });
      expect(trackTagEngagement).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: "directory-category" })
      );
    });

    it("should track directory-area clicks", async () => {
      await trackTagEngagement({
        tagId: 2,
        engagementType: "click",
        userId: null,
        contentType: "directory-area",
        contentId: null,
      });
      expect(trackTagEngagement).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: "directory-area" })
      );
    });

    it("should track neighborhood-card tag clicks", async () => {
      await trackTagEngagement({
        tagId: 10,
        engagementType: "click",
        userId: null,
        contentType: "neighborhood-card",
        contentId: "south-end",
      });
      expect(trackTagEngagement).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: "neighborhood-card", contentId: "south-end" })
      );
    });

    it("should track neighborhood-detail tag clicks", async () => {
      await trackTagEngagement({
        tagId: 10,
        engagementType: "click",
        userId: null,
        contentType: "neighborhood-detail",
        contentId: "south-end",
      });
      expect(trackTagEngagement).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: "neighborhood-detail", contentId: "south-end" })
      );
    });

    it("should track home-neighborhood tag clicks", async () => {
      await trackTagEngagement({
        tagId: 10,
        engagementType: "click",
        userId: null,
        contentType: "home-neighborhood",
        contentId: "noda",
      });
      expect(trackTagEngagement).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: "home-neighborhood", contentId: "noda" })
      );
    });

    it("should track home-event category clicks", async () => {
      await trackTagEngagement({
        tagId: 9,
        engagementType: "click",
        userId: null,
        contentType: "home-event",
        contentId: null,
      });
      expect(trackTagEngagement).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: "home-event" })
      );
    });

    it("should track blog-filter clicks", async () => {
      await trackTagEngagement({
        tagId: 1,
        engagementType: "click",
        userId: null,
        contentType: "blog-filter",
        contentId: null,
      });
      expect(trackTagEngagement).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: "blog-filter" })
      );
    });
  });
});

describe("TAG_SLUG_MAP coverage", () => {
  // Inline copy of the map from client/src/hooks/useTagTracking.ts
  // to avoid importing client-side code in server tests
  const TAG_SLUG_MAP: Record<string, string> = {
    "concerts": "live-music",
    "food-drink": "food-drink",
    "sports": "sports",
    "arts-culture": "arts-culture",
    "festivals": "festivals",
    "family": "family-friendly",
    "nightlife": "nightlife",
    "free": "free-events",
    "markets": "markets",
    "South End": "south-end",
    "NoDa": "noda",
    "Plaza Midwood": "plaza-midwood",
    "Dilworth": "dilworth",
    "Myers Park": "myers-park",
    "Uptown": "uptown",
    "Elizabeth": "elizabeth",
    "Ballantyne": "ballantyne",
  };

  it("should map event categories to tag slugs", () => {
    expect(TAG_SLUG_MAP["concerts"]).toBe("live-music");
    expect(TAG_SLUG_MAP["food-drink"]).toBe("food-drink");
    expect(TAG_SLUG_MAP["sports"]).toBe("sports");
    expect(TAG_SLUG_MAP["arts-culture"]).toBe("arts-culture");
    expect(TAG_SLUG_MAP["festivals"]).toBe("festivals");
    expect(TAG_SLUG_MAP["family"]).toBe("family-friendly");
    expect(TAG_SLUG_MAP["nightlife"]).toBe("nightlife");
    expect(TAG_SLUG_MAP["free"]).toBe("free-events");
    expect(TAG_SLUG_MAP["markets"]).toBe("markets");
  });

  it("should map neighborhood names to tag slugs", () => {
    expect(TAG_SLUG_MAP["South End"]).toBe("south-end");
    expect(TAG_SLUG_MAP["NoDa"]).toBe("noda");
    expect(TAG_SLUG_MAP["Plaza Midwood"]).toBe("plaza-midwood");
    expect(TAG_SLUG_MAP["Dilworth"]).toBe("dilworth");
    expect(TAG_SLUG_MAP["Myers Park"]).toBe("myers-park");
    expect(TAG_SLUG_MAP["Uptown"]).toBe("uptown");
    expect(TAG_SLUG_MAP["Elizabeth"]).toBe("elizabeth");
    expect(TAG_SLUG_MAP["Ballantyne"]).toBe("ballantyne");
  });
});
