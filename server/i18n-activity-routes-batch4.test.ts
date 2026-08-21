import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { en } from "../client/src/i18n/locales/en";
import { es } from "../client/src/i18n/locales/es";

function source(name: string) {
  return readFileSync(new URL(`../client/src/pages/${name}.tsx`, import.meta.url), "utf8");
}

const routeKeys = {
  BingoCards: [
    "bingo.title",
    "bingo.subtitle",
    "bingo.empty",
    "bingo.emptyDescription",
    "bingo.completed",
    "bingo.completionToast",
    "bingo.signIn",
    "bingo.loading",
  ],
  EventCategoryPage: [
    "eventCategory.notFound",
    "eventCategory.notFoundDescription",
    "eventCategory.allEvents",
    "eventCategory.eventsCount",
    "eventCategory.recurringCount",
    "eventCategory.freeCount",
    "eventCategory.empty",
    "eventCategory.emptyDescription",
    "eventCategory.moreEvents",
  ],
  ThingsToDo: [
    "things.seoTitle",
    "things.title",
    "things.subtitle",
    "things.browseEvents",
    "things.exploreNeighborhoods",
    "things.thisWeek",
    "things.categoriesIntro",
    "things.bestNeighborhoods",
    "things.viewAllNeighborhoods",
    "things.completeGuide",
    "things.localDirectory",
  ],
} as const;

describe("activity route i18n batch 4", () => {
  for (const [page, keys] of Object.entries(routeKeys)) {
    it(`${page} wires translated route chrome`, () => {
      const pageSource = source(page);
      expect(pageSource).toContain("useI18n");
      for (const key of keys) {
        const direct = `t("${key}"`;
        const typed = `labelKey: "${key}"`;
        expect(pageSource.includes(direct) || pageSource.includes(typed), `${page} must wire ${key}`).toBe(true);
      }
    });
  }

  it("adds semantic expanded and pressed states to Bingo controls", () => {
    const page = source("BingoCards");
    expect(page).toContain("aria-expanded={expanded}");
    expect(page).toContain("aria-controls={`bingo-card-${card.id}`}");
    expect(page).toContain("aria-pressed={done}");
    expect(page).toContain("parseBingoSquares");
  });

  it("wires localized event taxonomy and plural forms", () => {
    const page = source("EventCategoryPage");
    expect(page).toContain("EVENT_CATEGORY_LABELS");
    expect(page).toContain("eventCategory.eventSingular");
    expect(page).toContain("eventCategory.recurringSingular");
  });

  it("provides distinct runtime Spanish route copy", () => {
    for (const key of ["bingo.title", "eventCategory.notFound", "things.title"] as const) {
      expect(es[key]).not.toBe(en[key]);
      expect(es[key].trim()).not.toBe("");
    }
  });
});
