import { describe, it, expect } from "vitest";
import { events } from "../drizzle/schema";
import {
  EVENT_CATEGORIES,
  SEED_EVENTS,
  type EventType,
  type EventCost,
} from "../shared/events";

describe("Events Schema", () => {
  it("should have the events table exported", () => {
    expect(events).toBeDefined();
    expect(typeof events).toBe("object");
  });

  it("should have all required columns", () => {
    const columns = Object.keys(events);
    expect(columns).toContain("id");
    expect(columns).toContain("name");
    expect(columns).toContain("slug");
    expect(columns).toContain("type");
    expect(columns).toContain("category");
    expect(columns).toContain("organizer");
    expect(columns).toContain("organizerWebsite");
    expect(columns).toContain("venue");
    expect(columns).toContain("venueArea");
    expect(columns).toContain("startDate");
    expect(columns).toContain("endDate");
    expect(columns).toContain("recurringPattern");
    expect(columns).toContain("sourceUrl");
    expect(columns).toContain("sourceVerified");
    expect(columns).toContain("newcomerFriendly");
    expect(columns).toContain("featured");
    expect(columns).toContain("description");
    expect(columns).toContain("neighborhood");
    expect(columns).toContain("cost");
    expect(columns).toContain("rsvpUrl");
    expect(columns).toContain("active");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
  });

  it("should have correct type enum values (recurring, one_time)", () => {
    const typeCol = events.type as unknown as { enumValues: string[] | null };
    expect(typeCol.enumValues).toEqual(["recurring", "one_time"]);
  });

  it("should have correct cost enum values (free, paid, mixed)", () => {
    const costCol = events.cost as unknown as { enumValues: string[] | null };
    expect(costCol.enumValues).toEqual(["free", "paid", "mixed"]);
  });
});

describe("Event Categories", () => {
  it("should have at least 6 categories", () => {
    expect(EVENT_CATEGORIES.length).toBeGreaterThanOrEqual(6);
  });

  it("should have id, name, and icon for each category", () => {
    for (const cat of EVENT_CATEGORIES) {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("icon");
      expect(typeof cat.id).toBe("string");
      expect(typeof cat.name).toBe("string");
      expect(typeof cat.icon).toBe("string");
      expect(cat.id.length).toBeGreaterThan(0);
      expect(cat.name.length).toBeGreaterThan(0);
      expect(cat.icon.length).toBeGreaterThan(0);
    }
  });

  it("should include the required core categories", () => {
    const ids = EVENT_CATEGORIES.map((c) => c.id);
    expect(ids).toContain("community");
    expect(ids).toContain("festivals");
    expect(ids).toContain("neighborhood");
    expect(ids).toContain("professional");
    expect(ids).toContain("family");
    expect(ids).toContain("sports");
  });

  it("should have unique category ids", () => {
    const ids = EVENT_CATEGORIES.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe("Seed Events", () => {
  it("should have at least 10 seed events", () => {
    expect(SEED_EVENTS.length).toBeGreaterThanOrEqual(10);
  });

  it("every seed event has name, slug, type, and category", () => {
    for (const ev of SEED_EVENTS) {
      expect(ev).toHaveProperty("name");
      expect(ev).toHaveProperty("slug");
      expect(ev).toHaveProperty("type");
      expect(ev).toHaveProperty("category");
      expect(typeof ev.name).toBe("string");
      expect(ev.name.length).toBeGreaterThan(0);
      expect(typeof ev.slug).toBe("string");
      expect(ev.slug.length).toBeGreaterThan(0);
      expect(typeof ev.type).toBe("string");
      expect(typeof ev.category).toBe("string");
      expect(ev.category.length).toBeGreaterThan(0);
    }
  });

  it("every seed event type is a valid EventType", () => {
    const validTypes: EventType[] = ["recurring", "one_time"];
    for (const ev of SEED_EVENTS) {
      expect(validTypes).toContain(ev.type);
    }
  });

  it("every seed event cost (when present) is a valid EventCost", () => {
    const validCosts: EventCost[] = ["free", "paid", "mixed"];
    for (const ev of SEED_EVENTS) {
      if (ev.cost !== undefined) {
        expect(validCosts).toContain(ev.cost);
      }
    }
  });

  it("every slug is unique", () => {
    const slugs = SEED_EVENTS.map((e) => e.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("every category references a valid EVENT_CATEGORIES id", () => {
    const validIds = new Set(EVENT_CATEGORIES.map((c) => c.id));
    for (const ev of SEED_EVENTS) {
      expect(validIds.has(ev.category)).toBe(true);
    }
  });

  it("every seed event has a sourceUrl", () => {
    for (const ev of SEED_EVENTS) {
      expect(ev).toHaveProperty("sourceUrl");
      expect(typeof ev.sourceUrl).toBe("string");
      expect(ev.sourceUrl.length).toBeGreaterThan(0);
    }
  });
});
