import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const neighborhood = source("../client/src/pages/NeighborhoodDetail.tsx");
const reviews = source("../client/src/components/ReviewSection.tsx");
const activity = source("../client/src/components/ActivityFeed.tsx");
const directory = source("../client/src/pages/Directory.tsx");
const listing = source("../client/src/pages/ListYourBusiness.tsx");
const en = source("../client/src/i18n/locales/en.ts");
const es = source("../client/src/i18n/locales/es.ts");
const db = source("./db.ts");

describe("Phase 0 rendered blocker contracts", () => {
  it("keeps NeighborhoodDetail hydration SEO locale-aware", () => {
    for (const key of [
      "neighborhoodDetail.seoTitle",
      "neighborhoodDetail.seoDescription",
      "neighborhoodDetail.seoKeywords",
    ]) {
      expect(en, key).toContain(`\"${key}\":`);
      expect(es, key).toContain(`\"${key}\":`);
      expect(neighborhood, key).toContain(`t(\"${key}\"`);
    }
    expect(neighborhood).not.toContain("Charlotte NC Neighborhood Guide (2026): Vibe, Costs & Reviews");
  });

  it("localizes persisted canonical review aspects and delegates keyboard behavior to Radix", () => {
    expect(reviews).toContain('from "@/components/ui/radio-group"');
    expect(reviews).toContain("<RadioGroup");
    expect(reviews).toContain("<RadioGroupItem");
    expect(reviews).toContain("getAspectLabel(review.aspect, t)");
    expect(reviews).not.toContain("disabled={!interactive}");
    expect(reviews).toContain('role="img"');
    expect(reviews).toContain('aria-hidden="true"');
  });

  it("renders known activity verbs from structured data instead of English descriptions", () => {
    expect(activity).toContain("formatActivityDescription(activity, t)");
    expect(activity).not.toContain("{activity.description}");
    for (const key of ["activity.stamped", "activity.attended", "activity.commented", "activity.bingoProgress"]) {
      expect(en, key).toContain(`\"${key}\":`);
      expect(es, key).toContain(`\"${key}\":`);
    }
    expect(db).toContain("entityName: placeName");
    expect(db).toContain("targetType: c.targetType");
    expect(db).toContain("entityName: b.cardTitle || undefined");
  });

  it("uses locale overlays for directory labels while retaining canonical option values", () => {
    expect(directory).toContain("getServiceSuperGroupLabel(");
    expect(directory).toContain("getServiceCategoryLabel(");
    expect(listing).toContain("getServiceCategoryLabel(");
    expect(listing).toContain("value={item.id}");
  });

  it("synchronizes Google Maps markers against the current instance generation", () => {
    expect(directory).toMatch(/useEffect\(\(\) => \{[\s\S]*updateMapMarkers\(filteredServices, map, generation\)/);
    expect(directory).not.toMatch(/useMemo\(\(\) => \{[\s\S]{0,180}updateMapMarkers\(/);
    expect(directory).toContain("markerGenerationRef.current.isCurrent(map, generation)");
    expect(directory).toContain("markerGenerationRef.current.clear(map, generation)");
    expect(directory).toContain("markerGenerationRef.current.unmount()");
    expect(directory).toContain("[filteredServices, viewMode, updateMapMarkers, mapReady, mapGeneration]");
  });
});
