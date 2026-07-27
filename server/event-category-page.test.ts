import { describe, it, expect } from "vitest";
import { SEED_EVENTS, EVENT_CATEGORIES } from "../shared/events";

// The 10 recurring event categories that get SEO landing pages
export const RECURRING_CATEGORY_SLUGS = [
  "run-walk",
  "yoga-fitness",
  "farmers-markets",
  "game-nights",
  "veteran",
  "music-jam",
  "kids-storytime",
  "meditation",
  "dog-meetups",
  "makers-crafts",
] as const;

// SEO metadata mapping — kept in sync with EventCategoryPage.tsx
export const CATEGORY_SEO: Record<
  string,
  { title: string; description: string; keywords: string }
> = {
  "run-walk": {
    title: "Charlotte Run Clubs & Walking Groups | Settle CLT",
    description:
      "Find Charlotte run clubs, walking groups, and community fitness meetups. Weekly and monthly recurring events for all paces.",
    keywords:
      "Charlotte run clubs, Charlotte running groups, Charlotte walking groups, Charlotte running events, Charlotte fitness meetups",
  },
  "yoga-fitness": {
    title: "Charlotte Free Yoga & Outdoor Fitness | Settle CLT",
    description:
      "Free and low-cost yoga classes in Charlotte parks and studios. Recurring weekly outdoor yoga for all levels.",
    keywords:
      "Charlotte free yoga, Charlotte outdoor yoga, Charlotte yoga classes, Charlotte fitness classes, Charlotte park yoga",
  },
  "farmers-markets": {
    title: "Charlotte Farmers Markets by Neighborhood | Settle CLT",
    description:
      "Year-round and seasonal farmers markets across Charlotte. Find fresh produce, local goods, and community markets near you.",
    keywords:
      "Charlotte farmers markets, Charlotte farmers market, farmers markets near me, Charlotte local produce, Charlotte markets",
  },
  "game-nights": {
    title: "Charlotte Game Nights & Trivia | Settle CLT",
    description:
      "Weekly board game nights, trivia, and social gaming events across Charlotte. Find a game night near you.",
    keywords:
      "Charlotte game nights, Charlotte trivia nights, Charlotte board games, Charlotte social gaming, Charlotte pub trivia",
  },
  veteran: {
    title: "Charlotte Veteran & Military Community Events | Settle CLT",
    description:
      "Recurring veteran community events, resources, and gatherings in Charlotte, NC.",
    keywords:
      "Charlotte veteran events, Charlotte military events, Charlotte veteran community, veteran events Charlotte NC, Charlotte VA events",
  },
  "music-jam": {
    title: "Charlotte Live Music & Open Mic Nights | Settle CLT",
    description:
      "Weekly open mic nights, jazz sessions, and live music recurring events in Charlotte.",
    keywords:
      "Charlotte open mic, Charlotte live music, Charlotte jazz nights, Charlotte music events, Charlotte open mic nights",
  },
  "kids-storytime": {
    title: "Charlotte Storytime & Kids Events | Settle CLT",
    description:
      "Free library storytimes and kids event programs across Charlotte branches.",
    keywords:
      "Charlotte storytime, Charlotte kids events, Charlotte library storytime, Charlotte children events, Charlotte storytime near me",
  },
  meditation: {
    title: "Charlotte Meditation & Mindfulness Groups | Settle CLT",
    description:
      "Weekly meditation and mindfulness groups in Charlotte. Free and low-cost sessions for all levels.",
    keywords:
      "Charlotte meditation, Charlotte mindfulness, Charlotte meditation groups, Charlotte meditation classes, Charlotte mindfulness groups",
  },
  "dog-meetups": {
    title: "Charlotte Dog Meetups & Dog Walks | Settle CLT",
    description:
      "Recurring dog meetups, breed gatherings, and community dog walks in Charlotte.",
    keywords:
      "Charlotte dog meetups, Charlotte dog walks, Charlotte dog groups, Charlotte dog events, Charlotte breed meetups",
  },
  "makers-crafts": {
    title: "Charlotte Makers Markets & Craft Events | Settle CLT",
    description:
      "Recurring makers markets, craft fairs, and artisan events in Charlotte.",
    keywords:
      "Charlotte makers market, Charlotte craft fairs, Charlotte artisan events, Charlotte craft markets, Charlotte makers events",
  },
};

describe("Event Category Landing Pages", () => {
  it("SEED_EVENTS should have events in each of the 10 recurring categories", () => {
    for (const slug of RECURRING_CATEGORY_SLUGS) {
      const events = SEED_EVENTS.filter((e) => e.category === slug);
      expect(events.length).toBeGreaterThan(0);
    }
  });

  it("each recurring category should have at least 1 event", () => {
    for (const slug of RECURRING_CATEGORY_SLUGS) {
      const count = SEED_EVENTS.filter((e) => e.category === slug).length;
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  it("all recurring category slugs should be valid (lowercase, hyphens only)", () => {
    const slugRegex = /^[a-z][a-z0-9-]*$/;
    for (const slug of RECURRING_CATEGORY_SLUGS) {
      expect(slugRegex.test(slug)).toBe(true);
      expect(slug).not.toContain(" ");
      expect(slug).not.toContain("_");
      expect(slug.toLowerCase()).toBe(slug);
    }
  });

  it("all recurring category slugs should exist in EVENT_CATEGORIES", () => {
    const validIds = new Set(EVENT_CATEGORIES.map((c) => c.id));
    for (const slug of RECURRING_CATEGORY_SLUGS) {
      expect(validIds.has(slug)).toBe(true);
    }
  });

  it("CATEGORY_SEO should have metadata for all 10 recurring categories", () => {
    for (const slug of RECURRING_CATEGORY_SLUGS) {
      expect(CATEGORY_SEO[slug]).toBeDefined();
      expect(CATEGORY_SEO[slug].title).toBeTruthy();
      expect(CATEGORY_SEO[slug].description).toBeTruthy();
      expect(CATEGORY_SEO[slug].keywords).toBeTruthy();
      // Title should contain "Charlotte" for SEO targeting
      expect(CATEGORY_SEO[slug].title.toLowerCase()).toContain("charlotte");
      // Description should contain "Charlotte" for SEO targeting
      expect(CATEGORY_SEO[slug].description.toLowerCase()).toContain("charlotte");
    }
  });

  it("every recurring category should have at least one recurring-type event", () => {
    for (const slug of RECURRING_CATEGORY_SLUGS) {
      const recurringEvents = SEED_EVENTS.filter(
        (e) => e.category === slug && e.type === "recurring"
      );
      expect(recurringEvents.length).toBeGreaterThan(0);
    }
  });
});
