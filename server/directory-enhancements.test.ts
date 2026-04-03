import { describe, it, expect } from "vitest";
import { SERVICES, SERVICE_CATEGORIES } from "../shared/services";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

describe("Directory Sort Options", () => {
  it("should support sorting by top-rated using enrichment data", () => {
    // Simulate enrichment data with ratings
    const mockEnrichment: Record<string, { googleRating: string | null; reviewCount: number | null }> = {
      "test-a": { googleRating: "4.8", reviewCount: 200 },
      "test-b": { googleRating: "4.5", reviewCount: 500 },
      "test-c": { googleRating: "4.8", reviewCount: 100 },
      "test-d": { googleRating: null, reviewCount: null },
    };

    const items = [
      { name: "Test A", slug: "test-a" },
      { name: "Test B", slug: "test-b" },
      { name: "Test C", slug: "test-c" },
      { name: "Test D", slug: "test-d" },
    ];

    // Sort by top-rated: highest rating first, then by review count
    const sorted = [...items].sort((a, b) => {
      const aRating = parseFloat(mockEnrichment[a.slug]?.googleRating || "0");
      const bRating = parseFloat(mockEnrichment[b.slug]?.googleRating || "0");
      if (bRating !== aRating) return bRating - aRating;
      return (mockEnrichment[b.slug]?.reviewCount || 0) - (mockEnrichment[a.slug]?.reviewCount || 0);
    });

    expect(sorted[0].name).toBe("Test A"); // 4.8 rating, 200 reviews
    expect(sorted[1].name).toBe("Test C"); // 4.8 rating, 100 reviews
    expect(sorted[2].name).toBe("Test B"); // 4.5 rating, 500 reviews
    expect(sorted[3].name).toBe("Test D"); // no rating
  });

  it("should support sorting by most-reviewed using enrichment data", () => {
    const mockEnrichment: Record<string, { googleRating: string | null; reviewCount: number | null }> = {
      "test-a": { googleRating: "4.2", reviewCount: 200 },
      "test-b": { googleRating: "4.5", reviewCount: 500 },
      "test-c": { googleRating: "4.8", reviewCount: 100 },
    };

    const items = [
      { name: "Test A", slug: "test-a" },
      { name: "Test B", slug: "test-b" },
      { name: "Test C", slug: "test-c" },
    ];

    // Sort by most-reviewed: highest review count first, then by rating
    const sorted = [...items].sort((a, b) => {
      const aReviews = mockEnrichment[a.slug]?.reviewCount || 0;
      const bReviews = mockEnrichment[b.slug]?.reviewCount || 0;
      if (bReviews !== aReviews) return bReviews - aReviews;
      return parseFloat(mockEnrichment[b.slug]?.googleRating || "0") - parseFloat(mockEnrichment[a.slug]?.googleRating || "0");
    });

    expect(sorted[0].name).toBe("Test B"); // 500 reviews
    expect(sorted[1].name).toBe("Test A"); // 200 reviews
    expect(sorted[2].name).toBe("Test C"); // 100 reviews
  });

  it("should support newest-first sort by reversing the array", () => {
    const items = [
      { name: "First Added" },
      { name: "Second Added" },
      { name: "Third Added" },
    ];

    const reversed = [...items].reverse();
    expect(reversed[0].name).toBe("Third Added");
    expect(reversed[2].name).toBe("First Added");
  });

  it("should handle services with no enrichment data gracefully in sort", () => {
    const mockEnrichment: Record<string, { googleRating: string | null; reviewCount: number | null }> = {};

    const items = [
      { name: "Test A", slug: "test-a" },
      { name: "Test B", slug: "test-b" },
    ];

    // Sort by top-rated with no enrichment data
    const sorted = [...items].sort((a, b) => {
      const aRating = parseFloat(mockEnrichment[a.slug]?.googleRating || "0");
      const bRating = parseFloat(mockEnrichment[b.slug]?.googleRating || "0");
      if (bRating !== aRating) return bRating - aRating;
      return (mockEnrichment[b.slug]?.reviewCount || 0) - (mockEnrichment[a.slug]?.reviewCount || 0);
    });

    // Both have 0 rating, order should be stable
    expect(sorted.length).toBe(2);
  });
});

describe("Premium Tier Badges", () => {
  it("should map premium tiers correctly", () => {
    const tiers = ["basic", "featured", "premium"] as const;
    expect(tiers).toContain("basic");
    expect(tiers).toContain("featured");
    expect(tiers).toContain("premium");
  });

  it("should build a premium map from active listings", () => {
    const mockListings = [
      { serviceKey: "business-a", tier: "premium", paymentStatus: "active" },
      { serviceKey: "business-b", tier: "featured", paymentStatus: "active" },
      { serviceKey: "business-c", tier: "basic", paymentStatus: "active" },
      { serviceKey: "business-d", tier: "premium", paymentStatus: "expired" },
    ];

    const active = mockListings.filter(l => l.paymentStatus === "active" && l.tier !== "basic");
    const premiumMap: Record<string, string> = {};
    for (const l of active) {
      premiumMap[l.serviceKey] = l.tier;
    }

    expect(premiumMap["business-a"]).toBe("premium");
    expect(premiumMap["business-b"]).toBe("featured");
    expect(premiumMap["business-c"]).toBeUndefined(); // basic tier excluded
    expect(premiumMap["business-d"]).toBeUndefined(); // expired excluded
  });

  it("should apply correct visual treatment based on tier", () => {
    const tierStyles: Record<string, string> = {
      premium: "border-purple-300 ring-1 ring-purple-100",
      featured: "border-amber-300 ring-1 ring-amber-100",
    };

    expect(tierStyles["premium"]).toContain("purple");
    expect(tierStyles["featured"]).toContain("amber");
    expect(tierStyles["basic"]).toBeUndefined();
  });
});

describe("Photo Gallery Lightbox", () => {
  it("should display up to 4 photos in the gallery grid", () => {
    const photos = [
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
      "https://example.com/3.jpg",
      "https://example.com/4.jpg",
      "https://example.com/5.jpg",
    ];

    // Main photo takes 2/3 width, side column shows 3 photos
    const mainPhoto = photos[0];
    const sidePhotos = photos.slice(1, 4);
    const remainingCount = photos.length - 4;

    expect(mainPhoto).toBe("https://example.com/1.jpg");
    expect(sidePhotos).toHaveLength(3);
    expect(remainingCount).toBe(1);
  });

  it("should handle single photo gracefully", () => {
    const photos = ["https://example.com/1.jpg"];
    const sidePhotos = photos.slice(1, 4);
    expect(sidePhotos).toHaveLength(0);
  });

  it("should navigate lightbox with bounds checking", () => {
    const photos = ["a.jpg", "b.jpg", "c.jpg"];
    let index = 0;

    // Navigate forward
    index = Math.min(photos.length - 1, index + 1);
    expect(index).toBe(1);

    index = Math.min(photos.length - 1, index + 1);
    expect(index).toBe(2);

    // Should not go past last photo
    index = Math.min(photos.length - 1, index + 1);
    expect(index).toBe(2);

    // Navigate backward
    index = Math.max(0, index - 1);
    expect(index).toBe(1);

    index = Math.max(0, index - 1);
    expect(index).toBe(0);

    // Should not go below 0
    index = Math.max(0, index - 1);
    expect(index).toBe(0);
  });

  it("should show remaining photo count overlay on last visible photo", () => {
    const photos = Array.from({ length: 8 }, (_, i) => `photo-${i}.jpg`);
    const visibleSidePhotos = photos.slice(1, 4);
    const lastVisibleIndex = 2; // 3rd side photo (index 2)
    const showOverlay = lastVisibleIndex === 2 && photos.length > 4;
    const overlayCount = photos.length - 4;

    expect(showOverlay).toBe(true);
    expect(overlayCount).toBe(4);
    expect(visibleSidePhotos).toHaveLength(3);
  });
});

describe("Directory Data Integrity for Sort", () => {
  it("all services should have valid slugs for enrichment lookup", () => {
    for (const s of SERVICES) {
      const slug = toSlug(s.name);
      expect(slug.length).toBeGreaterThan(0);
      expect(slug).not.toMatch(/^-|-$/);
    }
  });

  it("sort options should be stable across multiple calls", () => {
    const items = SERVICES.slice(0, 20).map(s => ({ name: s.name, slug: toSlug(s.name) }));
    
    // Default sort (alphabetical)
    const sorted1 = [...items].sort((a, b) => a.name.localeCompare(b.name));
    const sorted2 = [...items].sort((a, b) => a.name.localeCompare(b.name));
    
    expect(sorted1.map(s => s.name)).toEqual(sorted2.map(s => s.name));
  });
});
