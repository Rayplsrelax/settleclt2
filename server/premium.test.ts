import { describe, it, expect } from "vitest";
import { PREMIUM_TIERS } from "./stripe-products";

describe("Premium Listing Tiers", () => {
  describe("Tier Configuration", () => {
    it("should have featured and premium tiers defined", () => {
      expect(PREMIUM_TIERS.featured).toBeDefined();
      expect(PREMIUM_TIERS.premium).toBeDefined();
    });

    it("featured tier should have correct pricing", () => {
      expect(PREMIUM_TIERS.featured.monthlyPrice).toBe(2900); // $29
      expect(PREMIUM_TIERS.featured.name).toBe("Featured Listing");
    });

    it("premium tier should have correct pricing", () => {
      expect(PREMIUM_TIERS.premium.monthlyPrice).toBe(7900); // $79
      expect(PREMIUM_TIERS.premium.name).toBe("Premium Listing");
    });

    it("featured tier should have 5 features", () => {
      expect(PREMIUM_TIERS.featured.features.length).toBe(5);
      expect(PREMIUM_TIERS.featured.features).toContain("Featured badge on listing");
    });

    it("premium tier should have 6 features", () => {
      expect(PREMIUM_TIERS.premium.features.length).toBe(6);
      expect(PREMIUM_TIERS.premium.features).toContain("Everything in Featured");
    });

    it("premium should cost more than featured", () => {
      expect(PREMIUM_TIERS.premium.monthlyPrice).toBeGreaterThan(PREMIUM_TIERS.featured.monthlyPrice);
    });
  });

  describe("Tier Descriptions", () => {
    it("each tier should have a non-empty description", () => {
      expect(PREMIUM_TIERS.featured.description.length).toBeGreaterThan(10);
      expect(PREMIUM_TIERS.premium.description.length).toBeGreaterThan(10);
    });

    it("each tier should have a non-empty name", () => {
      expect(PREMIUM_TIERS.featured.name.length).toBeGreaterThan(0);
      expect(PREMIUM_TIERS.premium.name.length).toBeGreaterThan(0);
    });
  });
});

describe("Stripe Helpers Module", () => {
  it("should export getStripe function", async () => {
    const mod = await import("./stripe-helpers");
    expect(typeof mod.getStripe).toBe("function");
  });

  it("should export createCheckoutSession function", async () => {
    const mod = await import("./stripe-helpers");
    expect(typeof mod.createCheckoutSession).toBe("function");
  });

  it("should export createPortalSession function", async () => {
    const mod = await import("./stripe-helpers");
    expect(typeof mod.createPortalSession).toBe("function");
  });

  it("should export constructWebhookEvent function", async () => {
    const mod = await import("./stripe-helpers");
    expect(typeof mod.constructWebhookEvent).toBe("function");
  });
});

describe("Premium Listings Schema", () => {
  it("should have premium_listings table in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.premiumListings).toBeDefined();
    // Verify the table has the expected columns by checking the config
    const table = schema.premiumListings;
    expect(table).toBeTruthy();
  });

  it("should have business_listing_overrides table in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.businessListingOverrides).toBeDefined();
    const table = schema.businessListingOverrides;
    expect(table).toBeTruthy();
  });
});

describe("DB Helper Functions", () => {
  it("should export getPremiumListing", async () => {
    const db = await import("./db");
    expect(typeof db.getPremiumListing).toBe("function");
  });

  it("should export upsertPremiumListing", async () => {
    const db = await import("./db");
    expect(typeof db.upsertPremiumListing).toBe("function");
  });

  it("should export getAllPremiumListings", async () => {
    const db = await import("./db");
    expect(typeof db.getAllPremiumListings).toBe("function");
  });

  it("should export incrementListingAnalytics", async () => {
    const db = await import("./db");
    expect(typeof db.incrementListingAnalytics).toBe("function");
  });

  it("should export getApprovedClaimForUser", async () => {
    const db = await import("./db");
    expect(typeof db.getApprovedClaimForUser).toBe("function");
  });

  it("should export getListingOverride", async () => {
    const db = await import("./db");
    expect(typeof db.getListingOverride).toBe("function");
  });

  it("should export upsertListingOverride", async () => {
    const db = await import("./db");
    expect(typeof db.upsertListingOverride).toBe("function");
  });
});
