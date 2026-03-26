import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", () => ({
  getRecentActivity: vi.fn().mockResolvedValue([
    {
      type: "stamp",
      id: 1,
      userId: 10,
      userName: "Alice",
      description: "stamped Amelie's French Bakery",
      detail: "noda",
      timestamp: new Date("2026-03-20T10:00:00Z"),
    },
    {
      type: "comment",
      id: 2,
      userId: 11,
      userName: "Bob",
      description: "commented on neighborhood noda",
      detail: "Great neighborhood for artists!",
      timestamp: new Date("2026-03-20T09:00:00Z"),
    },
    {
      type: "bingo",
      id: 3,
      userId: 12,
      userName: "Charlie",
      description: 'made progress on "Brewery Tour"',
      detail: null,
      timestamp: new Date("2026-03-20T08:00:00Z"),
    },
  ]),
  createEvent: vi.fn().mockResolvedValue([{ insertId: 99 }]),
  getPublishedEvents: vi.fn().mockResolvedValue([
    {
      id: 1,
      title: "Charlotte Food Truck Friday",
      slug: "charlotte-food-truck-friday",
      category: "food-drink",
      startDate: new Date("2026-04-01T17:00:00Z"),
      venueName: "South End",
      neighborhood: "south-end",
      status: "published",
    },
  ]),
  getAllEvents: vi.fn().mockResolvedValue([
    { id: 1, title: "Charlotte Food Truck Friday", slug: "charlotte-food-truck-friday", status: "published" },
    { id: 2, title: "User Submitted Event", slug: "user-submitted-event", status: "draft" },
  ]),
  addPassportEntry: vi.fn().mockResolvedValue([{ insertId: 50 }]),
  getPassportEntries: vi.fn().mockResolvedValue([
    {
      id: 50,
      userId: 1,
      serviceKey: null,
      customPlaceName: null,
      eventSlug: "charlotte-food-truck-friday",
      neighborhoodId: "south-end",
      visitedAt: new Date(),
      notes: "Great event!",
      photoUrl: null,
      createdAt: new Date(),
    },
  ]),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/map", () => ({
  makeRequest: vi.fn(),
}));

const publicCtx: TrpcContext = { user: null };
const publicCaller = appRouter.createCaller(publicCtx);

const authedCtx: TrpcContext = {
  user: { id: 1, openId: "user1", name: "Test User", email: "test@example.com", role: "user" } as any,
};
const authedCaller = appRouter.createCaller(authedCtx);

describe("Phase 3 — Activity Feed", () => {
  it("returns recent activity items sorted by timestamp", async () => {
    const result = await publicCaller.activity.recent({ limit: 10 });
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe("stamp");
    expect(result[0].userName).toBe("Alice");
    expect(result[1].type).toBe("comment");
    expect(result[2].type).toBe("bingo");
  });

  it("defaults to returning activity when no limit provided", async () => {
    const result = await publicCaller.activity.recent();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Phase 3 — User-Submitted Events", () => {
  it("allows authenticated users to submit events", async () => {
    const result = await authedCaller.events.submitEvent({
      title: "My Community Event",
      description: "A great event for the community",
      category: "community" as const,
      startDate: new Date("2026-05-01T18:00:00Z"),
      venueName: "Freedom Park",
      neighborhood: "dilworth",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unauthenticated event submissions", async () => {
    await expect(
      publicCaller.events.submitEvent({
        title: "My Event",
        description: "Test",
        category: "community" as const,
        startDate: new Date(),
        venueName: "Test Venue",
      })
    ).rejects.toThrow();
  });

  it("sends notification to owner when event is submitted", async () => {
    const { notifyOwner } = await import("./_core/notification");
    await authedCaller.events.submitEvent({
      title: "Notification Test Event",
      description: "Testing notifications",
      category: "concerts" as const,
      startDate: new Date("2026-06-01T20:00:00Z"),
      venueName: "PNC Music Pavilion",
    });
    expect(notifyOwner).toHaveBeenCalled();
  });
});

describe("Phase 3 — Passport Event Stamps", () => {
  it("allows stamping events in passport", async () => {
    const result = await authedCaller.passport.addEntry({
      eventSlug: "charlotte-food-truck-friday",
      neighborhoodId: "south-end",
      notes: "Great event!",
    });
    expect(result).toBeDefined();
  });

  it("returns event stamps in passport entries", async () => {
    const entries = await authedCaller.passport.getEntries();
    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);
    const eventEntry = entries.find((e: any) => e.eventSlug);
    expect(eventEntry).toBeDefined();
    expect(eventEntry!.eventSlug).toBe("charlotte-food-truck-friday");
  });
});
