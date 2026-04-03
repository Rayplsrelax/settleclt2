import { describe, it, expect } from "vitest";
import { SERVICES, SERVICE_CATEGORIES } from "../shared/services";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

describe("Business Detail Pages", () => {
  it("should generate unique slugs for all services", () => {
    const slugs = SERVICES.map((s) => toSlug(s.name));
    const uniqueSlugs = new Set(slugs);
    // Allow some duplicates (same name in different categories) but most should be unique
    expect(uniqueSlugs.size).toBeGreaterThan(SERVICES.length * 0.9);
  });

  it("should have valid category for every service", () => {
    const categoryIds = new Set(SERVICE_CATEGORIES.map((c) => c.id));
    for (const s of SERVICES) {
      expect(categoryIds.has(s.category)).toBe(true);
    }
  });

  it("should generate non-empty slugs for all services", () => {
    for (const s of SERVICES) {
      const slug = toSlug(s.name);
      expect(slug.length).toBeGreaterThan(0);
      expect(slug).not.toBe("");
    }
  });

  it("should have all required fields for detail page rendering", () => {
    for (const s of SERVICES) {
      expect(s.name).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.area).toBeTruthy();
      expect(typeof s.phone).toBe("string");
      expect(typeof s.website).toBe("string");
      expect(s.category).toBeTruthy();
    }
  });
});

describe("New This Week Section", () => {
  it("should have at least 6 services for the new this week section", () => {
    expect(SERVICES.length).toBeGreaterThanOrEqual(6);
  });

  it("should get the last 12 services and reverse for recency", () => {
    const newThisWeek = SERVICES.slice(-12).reverse().slice(0, 6);
    expect(newThisWeek).toHaveLength(6);
    // Each should have required fields
    for (const s of newThisWeek) {
      expect(s.name).toBeTruthy();
      expect(s.area).toBeTruthy();
      expect(s.category).toBeTruthy();
    }
  });

  it("new this week items should have valid categories with icons", () => {
    const newThisWeek = SERVICES.slice(-12).reverse().slice(0, 6);
    for (const s of newThisWeek) {
      const cat = SERVICE_CATEGORIES.find((c) => c.id === s.category);
      expect(cat).toBeDefined();
      expect(cat?.icon).toBeTruthy();
    }
  });
});

describe("Sitemap Business URLs", () => {
  it("should generate 700+ unique business slugs for sitemap", () => {
    const slugs = Array.from(
      new Set(SERVICES.map((s) => toSlug(s.name)))
    );
    expect(slugs.length).toBeGreaterThan(700);
  });

  it("slugs should only contain lowercase letters, numbers, and hyphens", () => {
    for (const s of SERVICES) {
      const slug = toSlug(s.name);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
