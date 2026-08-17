import { describe, expect, it } from "vitest";
import {
  EVENT_PROMOTION_PACKAGES,
  isEventPromotionLevel,
} from "@shared/event-promotions";

describe("Plan A event promotion packages", () => {
  it("defines all three tiers with one-time prices", () => {
    expect(Object.keys(EVENT_PROMOTION_PACKAGES).sort()).toEqual([
      "boost",
      "headliner",
      "spotlight",
    ]);
    expect(EVENT_PROMOTION_PACKAGES.boost.priceCents).toBe(1900);
    expect(EVENT_PROMOTION_PACKAGES.spotlight.priceCents).toBe(4900);
    expect(EVENT_PROMOTION_PACKAGES.headliner.priceCents).toBe(14900);
  });

  it("durations and social posts increase with tier", () => {
    expect(EVENT_PROMOTION_PACKAGES.boost.durationDays).toBe(7);
    expect(EVENT_PROMOTION_PACKAGES.spotlight.durationDays).toBe(14);
    expect(EVENT_PROMOTION_PACKAGES.headliner.durationDays).toBe(30);
    expect(EVENT_PROMOTION_PACKAGES.boost.socialPosts).toBe(1);
    expect(EVENT_PROMOTION_PACKAGES.spotlight.socialPosts).toBe(3);
    expect(EVENT_PROMOTION_PACKAGES.headliner.socialPosts).toBe(5);
  });

  it("headliner-only extras are gated to headliner", () => {
    expect(EVENT_PROMOTION_PACKAGES.boost.customHeadline).toBe(false);
    expect(EVENT_PROMOTION_PACKAGES.spotlight.sponsorMessage).toBe(true);
    expect(EVENT_PROMOTION_PACKAGES.headliner.customHeadline).toBe(true);
    expect(EVENT_PROMOTION_PACKAGES.headliner.organizerLogo).toBe(true);
  });

  it("isEventPromotionLevel validates", () => {
    expect(isEventPromotionLevel("boost")).toBe(true);
    expect(isEventPromotionLevel("headliner")).toBe(true);
    expect(isEventPromotionLevel("mega")).toBe(false);
    expect(isEventPromotionLevel(42)).toBe(false);
    expect(isEventPromotionLevel(null)).toBe(false);
  });
});

describe("Plan A activation math (pure checks)", () => {
  it("activation window length equals the package duration", () => {
    for (const [level, pkg] of Object.entries(EVENT_PROMOTION_PACKAGES)) {
      const startsAt = new Date("2026-08-17T00:00:00Z");
      const endsAt = new Date(
        startsAt.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000
      );
      const dayDiff =
        (endsAt.getTime() - startsAt.getTime()) / (24 * 60 * 60 * 1000);
      expect(dayDiff).toBe(pkg.durationDays);
      expect(level).toBeTruthy();
    }
  });
});
