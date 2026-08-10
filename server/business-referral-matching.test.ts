import { describe, expect, it } from "vitest";
import { recommendBusinessMatches } from "./business-referral-matching";

describe("business referral matching", () => {
  it("returns deterministic category and need matches", async () => {
    const matches = await recommendBusinessMatches("I need help packing and moving", "Moving");
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].reason).toMatch(/category|need/i);
    expect(matches[0].serviceKey).toMatch(/^[a-z0-9-]+$/);
  });

  it("excludes the directly selected business", async () => {
    const all = await recommendBusinessMatches("I need a dentist", "Dental");
    const excluded = await recommendBusinessMatches("I need a dentist", "Dental", all[0]?.serviceKey);
    expect(excluded.some(match => match.serviceKey === all[0]?.serviceKey)).toBe(false);
  });

  it("does not return unrelated matches when the need has no signal", async () => {
    const matches = await recommendBusinessMatches("something completely unrelated xyz", "");
    expect(matches.length).toBe(0);
  });
});
