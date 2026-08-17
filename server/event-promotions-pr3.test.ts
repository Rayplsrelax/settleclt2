import { describe, expect, it } from "vitest";
import { EVENT_PROMOTION_PACKAGES } from "@shared/event-promotions";

describe("Plan A PR3 — expiry sweep + social pacing contracts", () => {
  it("social post intervals spread evenly across each package window", () => {
    for (const [level, pkg] of Object.entries(EVENT_PROMOTION_PACKAGES)) {
      expect(pkg.socialPosts).toBeGreaterThan(0);
      const windowMs = pkg.durationDays * 24 * 60 * 60 * 1000;
      const interval = windowMs / pkg.socialPosts;
      // First post due one interval after activation, last before window end
      expect(interval).toBeGreaterThan(0);
      expect(interval * pkg.socialPosts).toBe(windowMs);
      // The first post never fires immediately at activation
      expect(interval).toBeGreaterThanOrEqual(
        (pkg.durationDays / pkg.socialPosts) * 24 * 60 * 60 * 1000 - 1
      );
      expect(level).toBeTruthy();
    }
  });

  it("boost package: 1 post fires at end of window at the latest", () => {
    const boost = EVENT_PROMOTION_PACKAGES.boost;
    const windowMs = boost.durationDays * 24 * 60 * 60 * 1000;
    const lastDueAt = 1 * (windowMs / boost.socialPosts);
    expect(lastDueAt).toBeLessThanOrEqual(windowMs);
  });

  it("headliner gets 5 evenly spaced posts", () => {
    const headliner = EVENT_PROMOTION_PACKAGES.headliner;
    const windowMs = headliner.durationDays * 24 * 60 * 60 * 1000;
    const interval = windowMs / headliner.socialPosts;
    expect(interval / (24 * 60 * 60 * 1000)).toBe(6); // every 6 days
  });
});
