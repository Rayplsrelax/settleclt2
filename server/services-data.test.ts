import { describe, expect, it } from "vitest";
import { SERVICES, SERVICE_CATEGORIES, SERVICE_SUPER_GROUPS } from "../shared/services";
import { CORE_NEIGHBORHOOD_NAMES, METRO_AREA_NAMES } from "../shared/metroAreas";
import { neighborhoods, allNeighborhoods, type Neighborhood } from "../shared/neighborhoods";
import { metroNeighborhoods } from "../shared/metroNeighborhoods";

const JUNK_AREA_VALUES = [
  "Anywhere", "Online", "Expanding", "Select Areas", "Rural Areas",
  "North Carolina", "Yorkmont Rd", "Suburbs", "SouthPark Mall", "Shalom Park",
  "Mecklenburg County",
];

const VALID_AREAS = [
  ...CORE_NEIGHBORHOOD_NAMES,
  "Camp North End", "Charlotte", "Charlotte Metro", "Concord", "East Charlotte", "Elizabeth",
  "Fort Mill", "Huntersville", "Lake Norman", "LoSo", "Matthews",
  "Pineville", "South Charlotte", "SouthPark",
  "University Area", "West Charlotte",
  "Cornelius", "Davidson",
];

describe("Services data integrity", () => {
  it("has 386 verified businesses", () => {
    expect(SERVICES.length).toBe(386);
  });

  it("has 42 categories", () => {
    expect(SERVICE_CATEGORIES.length).toBe(42);
  });

  it("has 6 super groups", () => {
    expect(SERVICE_SUPER_GROUPS.length).toBe(6);
  });

  it("every service has required fields", () => {
    for (const s of SERVICES) {
      expect(s.name).toBeTruthy();
      expect(s.category).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.area).toBeTruthy();
    }
  });

  it("every service references a valid category", () => {
    const catIds = new Set(SERVICE_CATEGORIES.map(c => c.id));
    for (const s of SERVICES) {
      expect(catIds.has(s.category)).toBe(true);
    }
  });

  it("every category references a valid super group", () => {
    const groupIds = new Set(SERVICE_SUPER_GROUPS.map(g => g.id));
    for (const cat of SERVICE_CATEGORIES) {
      expect(groupIds.has(cat.group)).toBe(true);
    }
  });
});

describe("Area values cleanup", () => {
  it("contains no junk area values", () => {
    const areas = new Set(SERVICES.map(s => s.area));
    for (const junk of JUNK_AREA_VALUES) {
      expect(areas.has(junk)).toBe(false);
    }
  });

  it("all area values are in the valid areas list", () => {
    const validSet = new Set(VALID_AREAS);
    const areas = new Set(SERVICES.map(s => s.area));
    for (const area of areas) {
      expect(validSet.has(area)).toBe(true);
    }
  });
});

describe("Neighborhood data model", () => {
  it("has 8 core neighborhoods", () => {
    expect(neighborhoods.length).toBe(8);
    expect(CORE_NEIGHBORHOOD_NAMES.length).toBe(8);
  });

  it("has 12 metro neighborhoods", () => {
    expect(metroNeighborhoods.length).toBe(12);
  });

  it("has 20 total neighborhoods in allNeighborhoods", () => {
    expect(allNeighborhoods.length).toBe(20);
  });

  it("no duplicate IDs in allNeighborhoods", () => {
    const ids = allNeighborhoods.map(n => n.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("core neighborhoods have metroType 'core'", () => {
    const coreIds = new Set(neighborhoods.map(n => n.id));
    for (const n of allNeighborhoods) {
      if (coreIds.has(n.id)) {
        expect(n.metroType).toBe("core");
      }
    }
  });

  it("metro neighborhoods have valid metroType", () => {
    const validTypes = new Set(["inner-ring", "suburb", "exurb"]);
    for (const n of metroNeighborhoods) {
      expect(n.metroType).toBeTruthy();
      expect(validTypes.has(n.metroType!)).toBe(true);
    }
  });

  it("every neighborhood has required fields", () => {
    for (const n of allNeighborhoods) {
      expect(n.id).toBeTruthy();
      expect(n.name).toBeTruthy();
      expect(n.vibe).toBeTruthy();
      expect(n.description).toBeTruthy();
      expect(n.photoUrls.length).toBeGreaterThan(0);
      expect(n.tags.length).toBeGreaterThan(0);
      expect(n.stats.avgRent).toBeTruthy();
      expect(n.stats.walkScore).toBeGreaterThanOrEqual(0);
      expect(n.monthlyCosts.rent1br).toBeGreaterThan(0);
      expect(n.hiddenGems.length).toBeGreaterThan(0);
      expect(n.keyPlaces.length).toBeGreaterThan(0);
      expect(n.settlingTimeline.length).toBeGreaterThan(0);
      expect(n.localsLove.length).toBeGreaterThan(0);
      expect(n.localsDontLove.length).toBeGreaterThan(0);
    }
  });

  it("every neighborhood has valid photo URLs", () => {
    for (const n of allNeighborhoods) {
      for (const url of n.photoUrls) {
        expect(url).toMatch(/^https?:\/\//);
      }
    }
  });

  it("University City is only in core, not in metro", () => {
    const coreIds = neighborhoods.map(n => n.id);
    const metroIds = metroNeighborhoods.map(n => n.id);
    expect(coreIds).toContain("university-city");
    expect(metroIds).not.toContain("university-city");
  });

  it("Mecklenburg County is not in any neighborhood list", () => {
    const allIds = allNeighborhoods.map(n => n.id);
    expect(allIds).not.toContain("mecklenburg-county");
  });
});
