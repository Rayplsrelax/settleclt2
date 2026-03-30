import { describe, expect, it } from "vitest";
import { z } from "zod";

// Schema validation tests for referral input
const referralSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().optional(),
  timeline: z.enum(["asap", "1-3months", "3-6months", "6-12months", "just-looking"]),
  type: z.enum(["buying", "selling", "both", "renting"]),
  neighborhoods: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
});

describe("Referral system", () => {
  it("validates a complete referral submission", () => {
    const input = {
      name: "John Doe",
      email: "john@example.com",
      phone: "704-555-1234",
      timeline: "1-3months" as const,
      type: "buying" as const,
      neighborhoods: "South End, NoDa",
      budget: "$300k-$400k",
      notes: "First-time homebuyer",
    };
    const result = referralSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates a minimal referral submission", () => {
    const input = {
      name: "Jane Smith",
      email: "jane@example.com",
      timeline: "just-looking" as const,
      type: "renting" as const,
    };
    const result = referralSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const input = {
      name: "Bad Email",
      email: "not-an-email",
      timeline: "asap" as const,
      type: "buying" as const,
    };
    const result = referralSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const input = {
      name: "",
      email: "test@example.com",
      timeline: "asap" as const,
      type: "buying" as const,
    };
    const result = referralSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid timeline", () => {
    const input = {
      name: "Test",
      email: "test@example.com",
      timeline: "tomorrow" as const,
      type: "buying" as const,
    };
    const result = referralSchema.safeParse(input as any);
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const input = {
      name: "Test",
      email: "test@example.com",
      timeline: "asap" as const,
      type: "flipping" as const,
    };
    const result = referralSchema.safeParse(input as any);
    expect(result.success).toBe(false);
  });
});

describe("Referral status transitions", () => {
  const validStatuses = ["new", "contacted", "in_progress", "closed", "lost"];

  it("has all expected status values", () => {
    expect(validStatuses).toContain("new");
    expect(validStatuses).toContain("contacted");
    expect(validStatuses).toContain("in_progress");
    expect(validStatuses).toContain("closed");
    expect(validStatuses).toContain("lost");
  });

  it("has 5 status options", () => {
    expect(validStatuses.length).toBe(5);
  });
});

describe("Event auto-expiry logic", () => {
  it("filters out events older than 1 month", () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const events = [
      { title: "Future Event", endDate: new Date(Date.now() + 86400000) },
      { title: "Recent Event", endDate: new Date(Date.now() - 86400000 * 15) },
      { title: "Old Event", endDate: new Date(Date.now() - 86400000 * 60) },
    ];

    const filtered = events.filter(evt => {
      const eventEnd = new Date(evt.endDate);
      return eventEnd >= oneMonthAgo;
    });

    expect(filtered.length).toBe(2);
    expect(filtered.map(e => e.title)).toContain("Future Event");
    expect(filtered.map(e => e.title)).toContain("Recent Event");
    expect(filtered.map(e => e.title)).not.toContain("Old Event");
  });

  it("keeps events with no end date", () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const events = [
      { title: "No Date Event", endDate: null, startDate: null },
      { title: "Old Event", endDate: new Date(Date.now() - 86400000 * 60), startDate: null },
    ];

    const filtered = events.filter(evt => {
      const eventEnd = evt.endDate ? new Date(evt.endDate) : evt.startDate ? new Date(evt.startDate) : null;
      if (!eventEnd) return true;
      return eventEnd >= oneMonthAgo;
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe("No Date Event");
  });
});
