import { describe, expect, it } from "vitest";
import { SERVICES, SERVICE_CATEGORIES, SERVICE_SUPER_GROUPS } from "../shared/services";
import { CORE_NEIGHBORHOOD_NAMES, metroAreas } from "../shared/metroAreas";

const JUNK_AREA_VALUES = [
  "Anywhere", "Online", "Expanding", "Select Areas", "Rural Areas",
  "North Carolina", "Yorkmont Rd", "Suburbs", "SouthPark Mall", "Shalom Park",
];

const VALID_AREAS = [
  ...CORE_NEIGHBORHOOD_NAMES,
  "Charlotte", "Charlotte Metro", "Concord", "East Charlotte", "Elizabeth",
  "Fort Mill", "Huntersville", "Lake Norman", "LoSo", "Matthews",
  "Mecklenburg County", "Pineville", "South Charlotte", "SouthPark",
  "University Area", "West Charlotte",
];

describe("Services data integrity", () => {
  it("has 322 verified businesses", () => {
    expect(SERVICES.length).toBe(322);
  });

  it("has 40 categories", () => {
    expect(SERVICE_CATEGORIES.length).toBe(40);
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

describe("Metro areas data", () => {
  it("has 8 core neighborhoods", () => {
    expect(CORE_NEIGHBORHOOD_NAMES.length).toBe(8);
  });

  it("has 14 metro areas", () => {
    expect(metroAreas.length).toBe(14);
  });

  it("every metro area has required fields", () => {
    for (const area of metroAreas) {
      expect(area.id).toBeTruthy();
      expect(area.name).toBeTruthy();
      expect(area.type).toBeTruthy();
      expect(area.vibe).toBeTruthy();
      expect(area.distance).toBeTruthy();
      expect(area.avgRent).toBeTruthy();
      expect(area.highlights.length).toBeGreaterThan(0);
    }
  });

  it("metro area types are valid", () => {
    const validTypes = new Set(["inner-ring", "suburb", "exurb"]);
    for (const area of metroAreas) {
      expect(validTypes.has(area.type)).toBe(true);
    }
  });
});
