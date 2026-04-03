/**
 * Smart area detection for Charlotte businesses.
 *
 * Given a Google Places formatted address (and optionally Google types),
 * returns the canonical area name used in the Settle CLT directory.
 *
 * Strategy (in priority order):
 *   1. Zip code mapping — most reliable, from the address suffix
 *   2. Keyword / landmark matching — street names, well-known areas
 *   3. City-name extraction — for suburbs outside Charlotte proper
 *   4. Fallback — "Charlotte Metro"
 */

// ─── Canonical area names (must match VALID_AREAS in tests) ───────────────────

export const CANONICAL_AREAS = [
  "South End", "NoDa", "Plaza Midwood", "Dilworth", "Myers Park",
  "Uptown", "Ballantyne", "Camp North End", "SouthPark", "Elizabeth",
  "LoSo", "East Charlotte", "South Charlotte", "West Charlotte",
  "University City", "University Area", "Huntersville", "Lake Norman",
  "Matthews", "Concord", "Fort Mill", "Pineville", "Charlotte",
  "Charlotte Metro", "Cornelius", "Davidson",
] as const;

export type CanonicalArea = (typeof CANONICAL_AREAS)[number];

// ─── Zip code → area mapping ──────────────────────────────────────────────────

const ZIP_TO_AREA: Record<string, CanonicalArea> = {
  // South End / LoSo
  "28203": "South End",
  // Uptown / Center City
  "28202": "Uptown",
  "28244": "Uptown",
  "28246": "Uptown",
  // NoDa / North Davidson
  "28206": "NoDa",
  // Plaza Midwood / Elizabeth
  "28205": "Plaza Midwood",
  // Dilworth / Myers Park
  "28207": "Myers Park",
  "28209": "Dilworth",
  // SouthPark
  "28210": "SouthPark",
  "28211": "SouthPark",
  // Ballantyne / South Charlotte
  "28277": "Ballantyne",
  "28226": "South Charlotte",
  "28270": "South Charlotte",
  // East Charlotte
  "28212": "East Charlotte",
  "28215": "East Charlotte",
  "28227": "East Charlotte",
  // West Charlotte
  "28208": "West Charlotte",
  "28214": "West Charlotte",
  "28216": "West Charlotte",
  // University area
  "28213": "University City",
  "28223": "University City",
  "28262": "University City",
  // Huntersville
  "28078": "Huntersville",
  // Cornelius
  "28031": "Cornelius",
  // Davidson
  "28036": "Davidson",
  // Lake Norman (Mooresville)
  "28115": "Lake Norman",
  "28117": "Lake Norman",
  // Matthews
  "28104": "Matthews",
  "28105": "Matthews",
  // Concord
  "28025": "Concord",
  "28027": "Concord",
  // Fort Mill, SC
  "29708": "Fort Mill",
  "29715": "Fort Mill",
  "29716": "Fort Mill",
  // Pineville
  "28134": "Pineville",
  "28217": "Pineville",
  // Mint Hill / East Charlotte fringe
  "28228": "East Charlotte",
  // Camp North End / North Charlotte
  "28204": "Elizabeth",
  // General Charlotte zips → Charlotte
  "28201": "Charlotte",
  "28218": "Charlotte",
  "28220": "Charlotte",
  "28230": "Charlotte",
  "28231": "Charlotte",
  "28232": "Charlotte",
  "28233": "Charlotte",
  "28234": "Charlotte",
  "28235": "Charlotte",
  "28236": "Charlotte",
  "28237": "Charlotte",
  "28241": "Charlotte",
  "28242": "Charlotte",
  "28243": "Charlotte",
  "28247": "Charlotte",
  "28253": "Charlotte",
  "28254": "Charlotte",
  "28255": "Charlotte",
  "28256": "Charlotte",
  "28258": "Charlotte",
  "28260": "Charlotte",
  "28261": "Charlotte",
  "28265": "Charlotte",
  "28266": "Charlotte",
  "28269": "Charlotte",
  "28271": "Charlotte",
  "28274": "Charlotte",
  "28275": "Charlotte",
  "28278": "Charlotte",
  "28280": "Charlotte",
  "28281": "Charlotte",
  "28282": "Charlotte",
  "28284": "Charlotte",
  "28285": "Charlotte",
  "28287": "Charlotte",
  "28288": "Charlotte",
  "28289": "Charlotte",
  "28290": "Charlotte",
  "28296": "Charlotte",
  "28297": "Charlotte",
  "28299": "Charlotte",
};

// ─── Keyword patterns → area mapping ──────────────────────────────────────────
// Each entry: [pattern (lowercase), canonical area]
// Patterns are tested against the lowercased full address string.

const KEYWORD_PATTERNS: Array<[string, CanonicalArea]> = [
  // Specific streets / landmarks → neighborhoods
  ["south blvd", "South End"],
  ["south boulevard", "South End"],
  ["s tryon st", "South End"],
  ["south tryon", "South End"],
  ["camden rd", "South End"],
  ["tremont ave", "South End"],
  ["bland st", "South End"],
  ["east blvd", "Dilworth"],
  ["east boulevard", "Dilworth"],
  ["kenilworth ave", "Dilworth"],
  ["park rd", "Dilworth"],
  ["queens rd", "Myers Park"],
  ["queens road", "Myers Park"],
  ["selwyn ave", "Myers Park"],
  ["sharon rd", "SouthPark"],
  ["sharon road", "SouthPark"],
  ["fairview rd", "SouthPark"],
  ["carnegie blvd", "SouthPark"],
  ["morrison blvd", "SouthPark"],
  ["central ave", "Plaza Midwood"],
  ["central avenue", "Plaza Midwood"],
  ["the plaza", "Plaza Midwood"],
  ["commonwealth ave", "Plaza Midwood"],
  ["n davidson st", "NoDa"],
  ["north davidson", "NoDa"],
  ["36th st", "NoDa"],
  ["e 36th", "NoDa"],
  ["camp north end", "Camp North End"],
  ["statesville ave", "Camp North End"],
  ["n tryon st", "Uptown"],
  ["north tryon", "Uptown"],
  ["trade st", "Uptown"],
  ["college st", "Uptown"],
  ["e trade", "Uptown"],
  ["w trade", "Uptown"],
  ["brevard st", "Uptown"],
  ["levine ave", "Uptown"],
  ["stonewall st", "Uptown"],
  ["independence blvd", "East Charlotte"],
  ["albemarle rd", "East Charlotte"],
  ["university city blvd", "University City"],
  ["w t harris", "University City"],
  ["jw clay blvd", "University City"],
  ["mallard creek", "University City"],
  ["unc charlotte", "University City"],
  ["uncc", "University City"],
  ["ballantyne commons", "Ballantyne"],
  ["ballantyne corporate", "Ballantyne"],
  ["johnston rd", "Ballantyne"],
  ["rea rd", "Ballantyne"],
  ["pineville-matthews", "Pineville"],
  ["carolina place", "Pineville"],
  ["lower south end", "LoSo"],
  ["loso", "LoSo"],
  ["yancey rd", "LoSo"],
  ["dewitt ln", "LoSo"],
  ["elizabeth ave", "Elizabeth"],
  ["hawthorne ln", "Elizabeth"],
  ["randolph rd", "Elizabeth"],
  ["providence rd", "Myers Park"],
  ["sardis rd", "South Charlotte"],
  ["carmel rd", "South Charlotte"],
  ["pineville, nc", "Pineville"],
  ["matthews, nc", "Matthews"],
  ["huntersville, nc", "Huntersville"],
  ["cornelius, nc", "Cornelius"],
  ["davidson, nc", "Davidson"],
  ["mooresville, nc", "Lake Norman"],
  ["concord, nc", "Concord"],
  ["fort mill, sc", "Fort Mill"],
  ["fort mill,sc", "Fort Mill"],
  ["tega cay, sc", "Fort Mill"],
  ["indian trail, nc", "East Charlotte"],
  ["mint hill, nc", "East Charlotte"],
  ["lake norman", "Lake Norman"],
];

// ─── Suburb city names (extracted from address) ───────────────────────────────

const SUBURB_CITY_MAP: Record<string, CanonicalArea> = {
  "huntersville": "Huntersville",
  "cornelius": "Cornelius",
  "davidson": "Davidson",
  "mooresville": "Lake Norman",
  "matthews": "Matthews",
  "mint hill": "East Charlotte",
  "indian trail": "East Charlotte",
  "concord": "Concord",
  "kannapolis": "Concord",
  "fort mill": "Fort Mill",
  "tega cay": "Fort Mill",
  "rock hill": "Fort Mill",
  "pineville": "Pineville",
  "gastonia": "West Charlotte",
  "mount holly": "West Charlotte",
  "belmont": "West Charlotte",
  "stallings": "Matthews",
  "weddington": "Matthews",
  "waxhaw": "South Charlotte",
  "harrisburg": "Concord",
  "midland": "East Charlotte",
};

// ─── Main detection function ──────────────────────────────────────────────────

/**
 * Detect the canonical area for a business from its Google Places address.
 *
 * @param address - The formatted_address from Google Places API
 * @param googleTypes - Optional array of Google place types (unused currently, reserved for future)
 * @returns A canonical area name from the CANONICAL_AREAS list
 */
export function detectArea(address: string, googleTypes?: string[]): CanonicalArea {
  if (!address || address.trim().length === 0) return "Charlotte Metro";

  const lower = address.toLowerCase();

  // ── Strategy 1: Zip code (most reliable) ──────────────────────────────────
  // First try: zip after state abbreviation (NC/SC) — most precise
  const stateZipMatch = address.match(/\b(?:NC|SC|nc|sc)\s+(\d{5})(?:-\d{4})?\b/);
  if (stateZipMatch) {
    const area = ZIP_TO_AREA[stateZipMatch[1]];
    if (area) return area;
  }
  // Second try: last 5-digit number in the address (avoids street numbers)
  const allFiveDigit = Array.from(address.matchAll(/\b(\d{5})(?:-\d{4})?\b/g));
  if (allFiveDigit.length > 0) {
    const lastMatch = allFiveDigit[allFiveDigit.length - 1];
    const area = ZIP_TO_AREA[lastMatch[1]];
    if (area) return area;
  }

  // ── Strategy 2: Keyword / landmark matching ───────────────────────────────
  for (const [pattern, area] of KEYWORD_PATTERNS) {
    if (lower.includes(pattern)) return area;
  }

  // ── Strategy 3: City-name extraction from address parts ───────────────────
  // Google formatted addresses typically look like:
  //   "123 Main St, Charlotte, NC 28202, USA"
  //   "456 Oak Ave, Huntersville, NC 28078, USA"
  const parts = address.split(",").map(p => p.trim());
  // The city is usually the second-to-last US part (before "NC XXXXX" or "SC XXXXX")
  for (const part of parts) {
    const cleaned = part.toLowerCase().replace(/\b(nc|sc)\b\s*\d{5}(-\d{4})?/g, "").trim();
    if (cleaned && SUBURB_CITY_MAP[cleaned]) {
      return SUBURB_CITY_MAP[cleaned];
    }
  }

  // Check if address mentions Charlotte at all
  if (lower.includes("charlotte")) return "Charlotte";

  // ── Strategy 4: Fallback ──────────────────────────────────────────────────
  return "Charlotte Metro";
}
