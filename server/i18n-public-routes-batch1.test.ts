import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(name: string) {
  return readFileSync(new URL(`../client/src/pages/${name}.tsx`, import.meta.url), "utf8");
}

const contracts = {
  NeighborhoodDetail: [
    "neighborhoodDetail.allNeighborhoods",
    "neighborhoodDetail.setAsMine",
    "neighborhoodDetail.yourNeighborhood",
    "neighborhoodDetail.compare",
    "neighborhoodDetail.overview",
    "neighborhoodDetail.vibeCheck",
    "neighborhoodDetail.dayInLife",
    "neighborhoodDetail.costs",
    "neighborhoodDetail.hiddenGems",
    "neighborhoodDetail.getSettled",
    "neighborhoodDetail.movingFrom",
    "neighborhoodDetail.sportsRec",
    "neighborhoodDetail.whatsComing",
    "neighborhoodDetail.map",
    "neighborhoodDetail.services",
    "neighborhoodDetail.reviews",
    "neighborhoodDetail.community",
    "neighborhoodDetail.whoLivesHere",
    "neighborhoodDetail.localsLove",
    "neighborhoodDetail.localsDontLove",
    "neighborhoodDetail.bestFor",
    "neighborhoodDetail.monthlyCostBreakdown",
    "neighborhoodDetail.rent1br",
    "neighborhoodDetail.rent2br",
    "neighborhoodDetail.utilities",
    "neighborhoodDetail.groceries",
    "neighborhoodDetail.dining",
    "neighborhoodDetail.transit",
    "neighborhoodDetail.entertainment",
    "neighborhoodDetail.total1br",
    "neighborhoodDetail.costReality",
    "neighborhoodDetail.monthlyBudget",
    "neighborhoodDetail.total",
    "neighborhoodDetail.tip",
    "neighborhoodDetail.timelineSettled",
  ],
  Compare: [
    "compare.title",
    "compare.subtitle",
    "compare.addNeighborhood",
    "compare.selectNeighborhoods",
    "compare.doneSelecting",
    "compare.selectAtLeastTwo",
    "compare.chooseAbove",
    "compare.stats",
    "compare.metric",
    "compare.monthlyCosts",
    "compare.expense",
    "compare.vibeCheck",
    "compare.love",
    "compare.dontLove",
    "compare.bestFor",
    "compare.fullGuide",
  ],
  DirectoryCategory: [
    "directoryCategory.notFound",
    "directoryCategory.missing",
    "directoryCategory.back",
    "directoryCategory.badge",
    "directoryCategory.browseAll",
    "directoryCategory.promote",
    "directoryCategory.snapshot",
    "directoryCategory.listings",
    "directoryCategory.serviceAreas",
    "directoryCategory.activePaid",
    "directoryCategory.metroFocus",
    "directoryCategory.whatToCheck",
    "directoryCategory.areasMentioned",
    "directoryCategory.topListings",
    "directoryCategory.viewAll",
    "directoryCategory.details",
    "directoryCategory.call",
    "directoryCategory.site",
    "directoryCategory.pricing",
  ],
} as const;

describe("public route i18n batch 1", () => {
  for (const [page, keys] of Object.entries(contracts)) {
    it(`${page} wires its translated route chrome`, () => {
      const pageSource = source(page);
      expect(pageSource).toContain("useI18n");
      for (const key of keys) {
        const directCall = `t("${key}"`;
        const keyedConfig = `labelKey: "${key}"`;
        expect(
          pageSource.includes(directCall) || pageSource.includes(keyedConfig),
          `${page} must wire ${key}`
        ).toBe(true);
      }
    });
  }
});
