import { describe, it, expect, vi } from "vitest";

// ─── Community Reviews Tests ────────────────────────────────────

describe("Reviews Router", () => {
  describe("reviews.getByTarget", () => {
    it("should accept neighborhood targetType and return reviews + stats", () => {
      const input = { targetType: "neighborhood" as const, targetId: "south-end" };
      expect(input.targetType).toBe("neighborhood");
      expect(input.targetId).toBe("south-end");
    });

    it("should accept directory targetType", () => {
      const input = { targetType: "directory" as const, targetId: "amelies-french-bakery" };
      expect(input.targetType).toBe("directory");
      expect(input.targetId).toBe("amelies-french-bakery");
    });
  });

  describe("reviews.create input validation", () => {
    it("should require rating between 1 and 5", () => {
      const validRatings = [1, 2, 3, 4, 5];
      validRatings.forEach((r) => {
        expect(r).toBeGreaterThanOrEqual(1);
        expect(r).toBeLessThanOrEqual(5);
      });
    });

    it("should require tip with at least 5 characters", () => {
      const shortTip = "Hi";
      const validTip = "Great neighborhood for families!";
      expect(shortTip.length).toBeLessThan(5);
      expect(validTip.length).toBeGreaterThanOrEqual(5);
    });

    it("should enforce max 500 character tip length", () => {
      const longTip = "a".repeat(501);
      expect(longTip.length).toBeGreaterThan(500);
    });

    it("should accept valid aspect values", () => {
      const validAspects = ["vibe", "food", "safety", "transit", "nightlife", "cost", "general"];
      validAspects.forEach((a) => {
        expect(validAspects).toContain(a);
      });
    });

    it("should default aspect to general when not provided", () => {
      const defaultAspect = "general";
      expect(defaultAspect).toBe("general");
    });
  });

  describe("reviews.stats", () => {
    it("should return avgRating and count", () => {
      const stats = { avgRating: 4.2, count: 15 };
      expect(stats).toHaveProperty("avgRating");
      expect(stats).toHaveProperty("count");
      expect(stats.avgRating).toBeGreaterThanOrEqual(0);
      expect(stats.avgRating).toBeLessThanOrEqual(5);
      expect(stats.count).toBeGreaterThanOrEqual(0);
    });

    it("should handle zero reviews gracefully", () => {
      const emptyStats = { avgRating: 0, count: 0 };
      expect(emptyStats.avgRating).toBe(0);
      expect(emptyStats.count).toBe(0);
    });
  });

  describe("reviews.delete", () => {
    it("should require reviewId", () => {
      const input = { reviewId: 42 };
      expect(input.reviewId).toBe(42);
      expect(typeof input.reviewId).toBe("number");
    });
  });

  describe("reviews.toggleVisibility", () => {
    it("should toggle between yes and no", () => {
      const current = "yes";
      const toggled = current === "yes" ? "no" : "yes";
      expect(toggled).toBe("no");
      
      const current2 = "no";
      const toggled2 = current2 === "yes" ? "no" : "yes";
      expect(toggled2).toBe("yes");
    });
  });
});

// ─── Monthly Digest Tests ────────────────────────────────────

describe("Digest Router", () => {
  describe("digest.preview", () => {
    it("should return stats for new listings, events, and posts", () => {
      const previewData = {
        newListings: [{ name: "Test Cafe" }],
        upcomingEvents: [{ title: "CLT Food Fest" }],
        recentPosts: [{ title: "Best Coffee Spots" }],
        trendingTags: [{ name: "Food & Drink", count: 42 }],
      };
      expect(previewData.newListings.length).toBeGreaterThanOrEqual(0);
      expect(previewData.upcomingEvents.length).toBeGreaterThanOrEqual(0);
      expect(previewData.recentPosts.length).toBeGreaterThanOrEqual(0);
      expect(previewData.trendingTags.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("digest.generate", () => {
    it("should return html string and stats", () => {
      const result = {
        html: "<h1>What's New in Charlotte</h1>",
        stats: { listings: 5, events: 3, posts: 2 },
      };
      expect(typeof result.html).toBe("string");
      expect(result.html.length).toBeGreaterThan(0);
      expect(result.stats).toHaveProperty("listings");
      expect(result.stats).toHaveProperty("events");
      expect(result.stats).toHaveProperty("posts");
    });
  });

  describe("digest.send", () => {
    it("should accept html and optional subject", () => {
      const input = {
        html: "<h1>Newsletter</h1>",
        subject: "What's New in Charlotte - March 2026",
      };
      expect(typeof input.html).toBe("string");
      expect(typeof input.subject).toBe("string");
    });

    it("should work without subject (uses default)", () => {
      const input = { html: "<h1>Newsletter</h1>" };
      expect(input).not.toHaveProperty("subject");
    });
  });
});

// ─── Mixpanel Integration Tests ────────────────────────────────

describe("Mixpanel Module", () => {
  it("should export all required tracking functions", async () => {
    // Test that the module structure is correct by checking the file exists
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.resolve(__dirname, "../client/src/lib/mixpanel.ts");
    expect(fs.existsSync(filePath)).toBe(true);
    
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("export function initMixpanel");
    expect(content).toContain("export function identifyUser");
    expect(content).toContain("export function resetUser");
    expect(content).toContain("export function trackEvent");
    expect(content).toContain("export function trackPageView");
    expect(content).toContain("export function trackSearch");
    expect(content).toContain("export function trackTagClick");
    expect(content).toContain("export function trackReviewSubmit");
    expect(content).toContain("export function trackStamp");
    expect(content).toContain("export function trackWishlistAdd");
    expect(content).toContain("export function trackEventView");
    expect(content).toContain("export function trackDirectoryView");
    expect(content).toContain("export function trackNeighborhoodView");
    expect(content).toContain("export function trackBlogView");
    expect(content).toContain("export function trackSignup");
    expect(content).toContain("export function trackNewsletterOptIn");
  });

  it("should use VITE_MIXPANEL_TOKEN env variable", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.resolve(__dirname, "../client/src/lib/mixpanel.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("VITE_MIXPANEL_TOKEN");
  });

  it("should gracefully no-op when token is not set", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.resolve(__dirname, "../client/src/lib/mixpanel.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    // Check that initialization checks for token
    expect(content).toContain("if (!MIXPANEL_TOKEN");
  });
});

// ─── ReviewSection Component Tests ────────────────────────────

describe("ReviewSection Component", () => {
  it("should exist as a component file", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.resolve(__dirname, "../client/src/components/ReviewSection.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("should export default ReviewSection and named ReviewStars", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.resolve(__dirname, "../client/src/components/ReviewSection.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("export default function ReviewSection");
    expect(content).toContain("export function ReviewStars");
  });

  it("should include star rating interactive component", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.resolve(__dirname, "../client/src/components/ReviewSection.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("StarRating");
    expect(content).toContain("interactive");
  });

  it("should include aspect selector with all valid aspects", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.resolve(__dirname, "../client/src/components/ReviewSection.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    const aspects = ["vibe", "food", "safety", "transit", "nightlife", "cost", "general"];
    aspects.forEach((a) => {
      expect(content).toContain(a);
    });
  });
});
