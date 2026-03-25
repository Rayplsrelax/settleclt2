import { describe, it, expect } from "vitest";
import { CHARLOTTE_VENUES, NEIGHBORHOOD_SPORTS_REC, type SportsVenue, type SportsRec } from "../shared/sportsRec";
import { allNeighborhoods } from "../shared/neighborhoods";

describe("Charlotte Venues", () => {
  it("should have at least 5 venues", () => {
    expect(CHARLOTTE_VENUES.length).toBeGreaterThanOrEqual(5);
  });

  it("each venue should have required fields", () => {
    for (const venue of CHARLOTTE_VENUES) {
      expect(venue.name).toBeTruthy();
      expect(venue.team).toBeTruthy();
      expect(venue.sport).toBeTruthy();
      expect(venue.league).toBeTruthy();
      expect(typeof venue.lat).toBe("number");
      expect(typeof venue.lng).toBe("number");
      expect(venue.capacity).toBeTruthy();
      expect(venue.season).toBeTruthy();
      expect(venue.avgTicket).toBeTruthy();
      expect(venue.website).toMatch(/^https?:\/\//);
    }
  });

  it("should include major Charlotte teams", () => {
    const teams = CHARLOTTE_VENUES.map(v => v.team);
    expect(teams).toContain("Carolina Panthers");
    expect(teams).toContain("Charlotte Hornets");
    expect(teams).toContain("Charlotte FC");
    expect(teams).toContain("Charlotte Knights");
    expect(teams).toContain("Charlotte Checkers");
    expect(teams).toContain("NASCAR");
  });
});

describe("Neighborhood Sports & Recreation Data", () => {
  const neighborhoodIds = allNeighborhoods.map(n => n.id);

  it("should have sports data for all 20 neighborhoods", () => {
    const sportsIds = Object.keys(NEIGHBORHOOD_SPORTS_REC);
    for (const id of neighborhoodIds) {
      expect(sportsIds).toContain(id);
    }
  });

  it("each neighborhood should have complete sports data", () => {
    for (const id of neighborhoodIds) {
      const data = NEIGHBORHOOD_SPORTS_REC[id];
      expect(data, `Missing sports data for ${id}`).toBeDefined();

      // nearbyVenues
      expect(Array.isArray(data.nearbyVenues)).toBe(true);
      expect(data.nearbyVenues.length).toBeGreaterThanOrEqual(1);
      for (const venue of data.nearbyVenues) {
        expect(venue.venueName).toBeTruthy();
        expect(venue.distance).toBeTruthy();
        expect(venue.access).toBeTruthy();
      }

      // fanCulture narrative
      expect(data.fanCulture.length).toBeGreaterThan(50);

      // recHighlights
      expect(Array.isArray(data.recHighlights)).toBe(true);
      expect(data.recHighlights.length).toBeGreaterThanOrEqual(3);

      // parkTrails
      expect(Array.isArray(data.parkTrails)).toBe(true);
      expect(data.parkTrails.length).toBeGreaterThanOrEqual(2);

      // fitnessScene narrative
      expect(data.fitnessScene.length).toBeGreaterThan(30);

      // youthSports narrative
      expect(data.youthSports.length).toBeGreaterThan(20);
    }
  });

  it("nearby venues should reference valid Charlotte venues", () => {
    const venueNames = CHARLOTTE_VENUES.map(v => v.name);
    for (const [id, data] of Object.entries(NEIGHBORHOOD_SPORTS_REC)) {
      for (const venue of data.nearbyVenues) {
        expect(
          venueNames.includes(venue.venueName),
          `${id}: venue "${venue.venueName}" not found in CHARLOTTE_VENUES`
        ).toBe(true);
      }
    }
  });

  it("no duplicate nearby venues per neighborhood", () => {
    for (const [id, data] of Object.entries(NEIGHBORHOOD_SPORTS_REC)) {
      const venueKeys = data.nearbyVenues.map(v => v.venueName + v.distance);
      const uniqueKeys = new Set(venueKeys);
      expect(venueKeys.length, `${id} has duplicate venues`).toBe(uniqueKeys.size);
    }
  });
});
