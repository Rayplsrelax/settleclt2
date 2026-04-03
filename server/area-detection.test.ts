import { describe, it, expect } from "vitest";
import { detectArea, CANONICAL_AREAS } from "../shared/areaDetection";

describe("Area Detection: Zip Code Strategy", () => {
  it("detects South End from zip 28203", () => {
    expect(detectArea("1000 South Blvd, Charlotte, NC 28203, USA")).toBe("South End");
  });

  it("detects Uptown from zip 28202", () => {
    expect(detectArea("100 N Tryon St, Charlotte, NC 28202, USA")).toBe("Uptown");
  });

  it("detects NoDa from zip 28206", () => {
    expect(detectArea("3000 N Davidson St, Charlotte, NC 28206, USA")).toBe("NoDa");
  });

  it("detects Plaza Midwood from zip 28205", () => {
    expect(detectArea("1500 Central Ave, Charlotte, NC 28205, USA")).toBe("Plaza Midwood");
  });

  it("detects Myers Park from zip 28207", () => {
    expect(detectArea("2000 Queens Rd, Charlotte, NC 28207, USA")).toBe("Myers Park");
  });

  it("detects SouthPark from zip 28210", () => {
    expect(detectArea("4400 Sharon Rd, Charlotte, NC 28210, USA")).toBe("SouthPark");
  });

  it("detects Ballantyne from zip 28277", () => {
    expect(detectArea("15000 Ballantyne Village Way, Charlotte, NC 28277, USA")).toBe("Ballantyne");
  });

  it("detects East Charlotte from zip 28212", () => {
    expect(detectArea("5000 Independence Blvd, Charlotte, NC 28212, USA")).toBe("East Charlotte");
  });

  it("detects University City from zip 28262", () => {
    expect(detectArea("8500 University City Blvd, Charlotte, NC 28262, USA")).toBe("University City");
  });

  it("detects Huntersville from zip 28078", () => {
    expect(detectArea("9800 Gilead Rd, Huntersville, NC 28078, USA")).toBe("Huntersville");
  });

  it("detects Fort Mill from SC zip 29708", () => {
    expect(detectArea("1000 Market St, Fort Mill, SC 29708, USA")).toBe("Fort Mill");
  });

  it("detects Matthews from zip 28105", () => {
    expect(detectArea("123 Trade St, Matthews, NC 28105, USA")).toBe("Matthews");
  });

  it("detects Concord from zip 28027", () => {
    expect(detectArea("500 Concord Pkwy, Concord, NC 28027, USA")).toBe("Concord");
  });

  it("detects Pineville from zip 28134", () => {
    expect(detectArea("100 Main St, Pineville, NC 28134, USA")).toBe("Pineville");
  });

  it("handles zip+4 format", () => {
    expect(detectArea("100 Main St, Charlotte, NC 28202-1234, USA")).toBe("Uptown");
  });
});

describe("Area Detection: Keyword Strategy", () => {
  it("detects South End from South Blvd mention", () => {
    expect(detectArea("2100 South Blvd, Charlotte, NC, USA")).toBe("South End");
  });

  it("detects NoDa from North Davidson mention", () => {
    expect(detectArea("3200 North Davidson St, Charlotte, NC, USA")).toBe("NoDa");
  });

  it("detects Dilworth from East Blvd mention", () => {
    expect(detectArea("1500 East Blvd, Charlotte, NC, USA")).toBe("Dilworth");
  });

  it("detects SouthPark from Sharon Rd mention", () => {
    expect(detectArea("4500 Sharon Rd, Charlotte, NC, USA")).toBe("SouthPark");
  });

  it("detects Plaza Midwood from Central Ave mention", () => {
    expect(detectArea("2000 Central Ave, Charlotte, NC, USA")).toBe("Plaza Midwood");
  });

  it("detects Camp North End from name mention", () => {
    expect(detectArea("1824 Statesville Ave, Camp North End, Charlotte, NC, USA")).toBe("Camp North End");
  });

  it("detects Uptown from Trade St mention", () => {
    expect(detectArea("200 E Trade St, Charlotte, NC, USA")).toBe("Uptown");
  });

  it("detects LoSo from lower south end mention", () => {
    expect(detectArea("2000 Yancey Rd, Lower South End, Charlotte, NC, USA")).toBe("LoSo");
  });

  it("detects Elizabeth from Elizabeth Ave mention", () => {
    expect(detectArea("1000 Elizabeth Ave, Charlotte, NC, USA")).toBe("Elizabeth");
  });

  it("detects Ballantyne from Ballantyne Commons mention", () => {
    expect(detectArea("11025 Ballantyne Commons Pkwy, Charlotte, NC, USA")).toBe("Ballantyne");
  });

  it("detects University City from UNC Charlotte mention", () => {
    expect(detectArea("9201 University City Blvd, UNC Charlotte, NC, USA")).toBe("University City");
  });
});

describe("Area Detection: Suburb City Strategy", () => {
  it("detects Huntersville from city name", () => {
    expect(detectArea("100 Gilead Rd, Huntersville, NC, USA")).toBe("Huntersville");
  });

  it("detects Cornelius from city name", () => {
    expect(detectArea("200 Catawba Ave, Cornelius, NC, USA")).toBe("Cornelius");
  });

  it("detects Davidson from city name", () => {
    expect(detectArea("300 Main St, Davidson, NC, USA")).toBe("Davidson");
  });

  it("detects Lake Norman from Mooresville city name", () => {
    expect(detectArea("400 N Main St, Mooresville, NC, USA")).toBe("Lake Norman");
  });

  it("detects Fort Mill from Fort Mill SC city name", () => {
    expect(detectArea("500 Tom Hall St, Fort Mill, SC, USA")).toBe("Fort Mill");
  });

  it("detects Fort Mill from Tega Cay city name", () => {
    expect(detectArea("600 Gold Hill Rd, Tega Cay, SC, USA")).toBe("Fort Mill");
  });
});

describe("Area Detection: Fallback Strategy", () => {
  it("returns Charlotte for generic Charlotte address without zip", () => {
    expect(detectArea("123 Random St, Charlotte, NC, USA")).toBe("Charlotte");
  });

  it("returns Charlotte Metro for empty address", () => {
    expect(detectArea("")).toBe("Charlotte Metro");
  });

  it("returns Charlotte Metro for unrecognized address", () => {
    expect(detectArea("123 Unknown Rd, Somewhere, GA 30000, USA")).toBe("Charlotte Metro");
  });

  it("returns Charlotte Metro for whitespace-only address", () => {
    expect(detectArea("   ")).toBe("Charlotte Metro");
  });
});

describe("Area Detection: Edge Cases", () => {
  it("handles address with no commas", () => {
    const result = detectArea("100 South Blvd Charlotte NC 28203");
    expect(result).toBe("South End"); // zip code match
  });

  it("prefers zip code over keyword when both present", () => {
    // Zip 28202 = Uptown, but South Blvd keyword = South End
    // Zip should win since it's checked first
    const result = detectArea("100 South Blvd, Charlotte, NC 28202, USA");
    expect(result).toBe("Uptown");
  });

  it("all returned areas are in the canonical list", () => {
    const testAddresses = [
      "100 S Tryon St, Charlotte, NC 28202, USA",
      "2000 South Blvd, Charlotte, NC 28203, USA",
      "3000 N Davidson St, Charlotte, NC 28206, USA",
      "",
      "Unknown address",
      "123 Main St, Fort Mill, SC 29708, USA",
      "500 Random Rd, Charlotte, NC, USA",
    ];
    const canonicalSet = new Set<string>(CANONICAL_AREAS);
    for (const addr of testAddresses) {
      const area = detectArea(addr);
      expect(canonicalSet.has(area)).toBe(true);
    }
  });

  it("handles real-world Google Places formatted addresses", () => {
    // These are typical Google Places formatted_address patterns
    expect(detectArea("Amelie's French Bakery, 2424 N Davidson St, Charlotte, NC 28205, USA")).toBe("Plaza Midwood");
    expect(detectArea("The Crunkleton, 1957 E 7th St, Charlotte, NC 28204, USA")).toBe("Elizabeth");
    expect(detectArea("Birkdale Village, 16805 Birkdale Commons Pkwy, Huntersville, NC 28078, USA")).toBe("Huntersville");
    expect(detectArea("Carowinds, 14523 Carowinds Blvd, Charlotte, NC 28273, USA")).toBe("Charlotte");
  });
});

describe("Area Detection: Consistency with VALID_AREAS", () => {
  it("CANONICAL_AREAS includes all areas used in services data", () => {
    // Import the same valid areas from the services test
    const VALID_AREAS = [
      "South End", "NoDa", "Plaza Midwood", "Dilworth", "Myers Park",
      "Uptown", "Ballantyne", "Camp North End", "Charlotte", "Charlotte Metro",
      "Concord", "East Charlotte", "Elizabeth", "Fort Mill", "Huntersville",
      "Lake Norman", "LoSo", "Matthews", "Pineville", "South Charlotte",
      "SouthPark", "University Area", "West Charlotte", "Cornelius", "Davidson",
      "University City",
    ];
    const canonicalSet = new Set<string>(CANONICAL_AREAS);
    for (const area of VALID_AREAS) {
      expect(canonicalSet.has(area)).toBe(true);
    }
  });
});
