import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { SERVICES } from "../shared/services";

describe("Listing enrichment workflow", () => {
  it("has enough directory data for enrichment prioritization", () => {
    expect(SERVICES.length).toBeGreaterThan(400);
  });

  it("provides a repeatable enrichment priority script", () => {
    const script = readFileSync("scripts/listing-enrichment-priorities.ts", "utf8");
    expect(script).toContain("MONEY_CATEGORIES");
    expect(script).toContain("priorityScore");
    expect(script).toContain("LISTING_ENRICHMENT_PRIORITIES.md");
  });

  it("generates the enrichment priority report", () => {
    expect(existsSync("docs/seo/LISTING_ENRICHMENT_PRIORITIES.md")).toBe(true);
    const report = readFileSync("docs/seo/LISTING_ENRICHMENT_PRIORITIES.md", "utf8");
    expect(report).toContain("# Settle CLT Listing Enrichment Priorities");
    expect(report).toContain("## Top 100 listing priorities");
    expect(report).toContain("## Suggested rewrites for top 20");
    expect(report).toContain("/directory/");
  });

  it("prioritizes missing contact data and thin descriptions", () => {
    const script = readFileSync("scripts/listing-enrichment-priorities.ts", "utf8");
    expect(script).toContain("missing phone");
    expect(script).toContain("missing website");
    expect(script).toContain("thin description");
    expect(script).toContain("generic service area");
  });
});
