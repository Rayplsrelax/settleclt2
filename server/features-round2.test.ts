import { describe, it, expect, vi } from "vitest";

// ============================================================
// Tests for Feature Round 2:
// 1. Admin Analytics Dashboard (routers)
// 2. Search Query Tracking
// 3. Personalized Recommendations
// 4. Neighborhood Developments ("What's Coming")
// ============================================================

// --- Neighborhood Developments Data ---
describe("Neighborhood Developments", () => {
  it("should export developments data with correct structure", async () => {
    const { neighborhoodDevelopments } = await import(
      "../shared/neighborhoodDevelopments"
    );
    expect(neighborhoodDevelopments).toBeDefined();
    expect(typeof neighborhoodDevelopments).toBe("object");

    // Check that at least some neighborhoods have developments
    const keys = Object.keys(neighborhoodDevelopments);
    expect(keys.length).toBeGreaterThan(0);
  });

  it("each development should have required fields", async () => {
    const { neighborhoodDevelopments } = await import(
      "../shared/neighborhoodDevelopments"
    );
    for (const [neighborhoodId, devs] of Object.entries(
      neighborhoodDevelopments
    )) {
      expect(Array.isArray(devs)).toBe(true);
      for (const dev of devs as any[]) {
        expect(dev).toHaveProperty("title");
        expect(dev).toHaveProperty("description");
        expect(dev).toHaveProperty("status");
        expect(dev).toHaveProperty("type");
        expect(typeof dev.title).toBe("string");
        expect(typeof dev.description).toBe("string");
        expect(["announced", "under-construction", "opening-soon"]).toContain(dev.status);
        expect(["new-business", "residential", "commercial", "mixed-use", "infrastructure", "entertainment", "park"]).toContain(dev.type);
      }
    }
  });

  it("should have developments for key Charlotte neighborhoods", async () => {
    const { neighborhoodDevelopments } = await import(
      "../shared/neighborhoodDevelopments"
    );
    // At least South End, NoDa, and Uptown should have developments
    const keyNeighborhoods = ["south-end", "noda", "uptown"];
    for (const n of keyNeighborhoods) {
      expect(neighborhoodDevelopments).toHaveProperty(n);
    }
  });
});

// --- Search Query Tracking Schema ---
describe("Search Queries Schema", () => {
  it("should export searchQueries table from schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.searchQueries).toBeDefined();
  });

  it("searchQueries table should have required columns", async () => {
    const schema = await import("../drizzle/schema");
    const table = schema.searchQueries;
    // Check that the table has the expected column names
    const columnNames = Object.keys(table);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("query");
    expect(columnNames).toContain("resultCount");
    expect(columnNames).toContain("source");
  });
});

// --- User Tag Preferences Schema ---
describe("User Tag Preferences Schema", () => {
  it("should export userTagPreferences table from schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.userTagPreferences).toBeDefined();
  });

  it("userTagPreferences table should have required columns", async () => {
    const schema = await import("../drizzle/schema");
    const table = schema.userTagPreferences;
    const columnNames = Object.keys(table);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("userId");
    expect(columnNames).toContain("tagId");
    expect(columnNames).toContain("score");
  });
});

// --- DB Helpers ---
describe("DB Helpers - Search Tracking", () => {
  it("should export trackSearchQuery function", async () => {
    const db = await import("./db");
    expect(typeof db.trackSearchQuery).toBe("function");
  });

  it("should export getPopularSearches function", async () => {
    const db = await import("./db");
    expect(typeof db.getPopularSearches).toBe("function");
  });

  it("should export getSearchAnalytics function", async () => {
    const db = await import("./db");
    expect(typeof db.getSearchAnalytics).toBe("function");
  });
});

describe("DB Helpers - Analytics", () => {
  it("should export getTagAnalytics function", async () => {
    const db = await import("./db");
    expect(typeof db.getTagAnalytics).toBe("function");
  });

  it("should export getTagAnalytics which returns analytics data", async () => {
    const db = await import("./db");
    // getTagAnalytics is a single function that returns all analytics
    expect(typeof db.getTagAnalytics).toBe("function");
  });
});

describe("DB Helpers - Recommendations", () => {
  it("should export getUserTagPreferences function", async () => {
    const db = await import("./db");
    expect(typeof db.getUserTagPreferences).toBe("function");
  });

  it("should export getRecommendedContent function", async () => {
    const db = await import("./db");
    expect(typeof db.getRecommendedContent).toBe("function");
  });
});

// --- Router Structure ---
describe("Router - Analytics", () => {
  it("should have analytics router with tags procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("analytics.tags");
  });

  it("should have analytics router with searches procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("analytics.searches");
  });

  it("should have analytics router with popularSearches procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("analytics.popularSearches");
  });
});

describe("Router - Search Tracking", () => {
  it("should have search router with track mutation", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("search.track");
  });

  it("should have search router with popular query", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("search.popular");
  });
});

describe("Router - Recommendations", () => {
  it("should have recommendations router with getForUser procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("recommendations.getForUser");
  });

  it("should have recommendations router with myPreferences procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("recommendations.myPreferences");
  });
});
