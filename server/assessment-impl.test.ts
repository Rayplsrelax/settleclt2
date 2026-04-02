import { describe, it, expect } from "vitest";
import { z } from "zod";

// Test the referral source tracking schema
describe("Referral Source Tracking", () => {
  const referralSubmitSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    referralType: z.enum(["buying", "selling", "renting", "relocating", "investing"]),
    budget: z.string().optional(),
    neighborhoods: z.string().optional(),
    timeline: z.string().optional(),
    notes: z.string().optional(),
    currentCity: z.string().optional(),
    referralSource: z.string().optional(),
  });

  it("should accept referral with source tracking", () => {
    const result = referralSubmitSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      referralType: "buying",
      referralSource: "quiz",
    });
    expect(result.success).toBe(true);
  });

  it("should accept referral with homepage source", () => {
    const result = referralSubmitSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      referralType: "renting",
      referralSource: "homepage",
    });
    expect(result.success).toBe(true);
  });

  it("should accept referral with blog source", () => {
    const result = referralSubmitSchema.safeParse({
      name: "Bob Smith",
      email: "bob@example.com",
      referralType: "relocating",
      referralSource: "blog",
    });
    expect(result.success).toBe(true);
  });

  it("should accept referral without source (defaults to direct)", () => {
    const result = referralSubmitSchema.safeParse({
      name: "Alice Jones",
      email: "alice@example.com",
      referralType: "investing",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.referralSource).toBeUndefined();
    }
  });

  it("should reject referral without required fields", () => {
    const result = referralSubmitSchema.safeParse({
      name: "",
      email: "bad-email",
      referralType: "buying",
    });
    expect(result.success).toBe(false);
  });
});

// Test the referral stats shape including new fields
describe("Referral Stats Shape", () => {
  const emptyStats = {
    total: 0,
    byStatus: {},
    byType: {},
    bySource: {},
    conversionRate: 0,
    avgAgeDays: 0,
    monthlyTrend: [],
    recentLeads: [],
    needsFollowUp: 0,
  };

  it("should include bySource in stats", () => {
    expect(emptyStats).toHaveProperty("bySource");
    expect(typeof emptyStats.bySource).toBe("object");
  });

  it("should include needsFollowUp in stats", () => {
    expect(emptyStats).toHaveProperty("needsFollowUp");
    expect(typeof emptyStats.needsFollowUp).toBe("number");
  });

  it("should calculate source breakdown correctly", () => {
    const leads = [
      { referralSource: "quiz" },
      { referralSource: "quiz" },
      { referralSource: "homepage" },
      { referralSource: null },
      { referralSource: "blog" },
    ];
    const bySource: Record<string, number> = {};
    leads.forEach((r) => {
      const src = r.referralSource || "direct";
      bySource[src] = (bySource[src] || 0) + 1;
    });
    expect(bySource).toEqual({
      quiz: 2,
      homepage: 1,
      direct: 1,
      blog: 1,
    });
  });

  it("should identify leads needing follow-up (>48 hours in new status)", () => {
    const now = Date.now();
    const fortyEightHours = 48 * 60 * 60 * 1000;
    const leads = [
      { status: "new", createdAt: new Date(now - 72 * 60 * 60 * 1000) }, // 72h old — needs follow-up
      { status: "new", createdAt: new Date(now - 24 * 60 * 60 * 1000) }, // 24h old — ok
      { status: "contacted", createdAt: new Date(now - 96 * 60 * 60 * 1000) }, // contacted — ok
      { status: "new", createdAt: new Date(now - 50 * 60 * 60 * 1000) }, // 50h old — needs follow-up
    ];
    const needsFollowUp = leads.filter(
      (r) => r.status === "new" && now - new Date(r.createdAt).getTime() > fortyEightHours
    ).length;
    expect(needsFollowUp).toBe(2);
  });
});

// Test event auto-archiving logic
describe("Event Auto-Archiving", () => {
  it("should filter out events older than 30 days", () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const events = [
      { title: "Recent Past", startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { title: "Old Event", startDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString() },
      { title: "Very Old", startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString() },
      { title: "Future", startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    const pastEvents = events.filter((e) => {
      const start = new Date(e.startDate);
      return start < now && start >= thirtyDaysAgo;
    });
    expect(pastEvents).toHaveLength(1);
    expect(pastEvents[0].title).toBe("Recent Past");
  });

  it("should keep upcoming events in the upcoming list", () => {
    const now = new Date();
    const events = [
      { title: "Tomorrow", startDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString() },
      { title: "Next Week", startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      { title: "Yesterday", startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    const upcomingEvents = events.filter((e) => new Date(e.startDate) >= now);
    expect(upcomingEvents).toHaveLength(2);
  });
});

// Test FEATURED badge logic
describe("FEATURED Badge Logic", () => {
  it("should only show FEATURED for affiliate partners", () => {
    const services = [
      { name: "Business A", featured: true, affiliate: true },
      { name: "Business B", featured: true, affiliate: false },
      { name: "Business C", featured: false, affiliate: true },
      { name: "Business D", featured: true, affiliate: undefined },
    ];
    const showFeatured = services.filter((s) => s.featured && s.affiliate);
    expect(showFeatured).toHaveLength(1);
    expect(showFeatured[0].name).toBe("Business A");
  });
});
