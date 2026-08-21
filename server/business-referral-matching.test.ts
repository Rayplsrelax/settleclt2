import { describe, expect, it } from "vitest";
import { recommendBusinessMatches } from "./business-referral-matching";

describe("business referral matching", () => {
  it("returns deterministic category and need matches", async () => {
    const matches = await recommendBusinessMatches("I need help packing and moving", "Moving");
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].reason).toMatch(/category|need/i);
    expect(matches[0].serviceKey).toMatch(/^[a-z0-9-]+$/);
  });

  it("excludes the directly selected business", async () => {
    const all = await recommendBusinessMatches("I need a dentist", "Dental");
    const excluded = await recommendBusinessMatches("I need a dentist", "Dental", all[0]?.serviceKey);
    expect(excluded.some(match => match.serviceKey === all[0]?.serviceKey)).toBe(false);
  });

  it("does not return unrelated matches when the need has no signal", async () => {
    const matches = await recommendBusinessMatches("something completely unrelated xyz", "");
    expect(matches.length).toBe(0);
  });

  it("matches Spanish moving requests and returns Spanish result chrome", async () => {
    const matches = await recommendBusinessMatches(
      "Necesito ayuda con una mudanza y embalaje",
      "Mudanza",
      undefined,
      5,
      "es"
    );
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].reason).toMatch(/Coincide|necesidad/i);
    expect(matches[0].category).not.toBe("moving-companies");
  });

  it("matches Spanish dental requests", async () => {
    const matches = await recommendBusinessMatches(
      "Necesito odontología para un dolor de diente",
      "Odontología",
      undefined,
      5,
      "es"
    );
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.slice(0, 2).every(match => /dental|dentist|dentistry/i.test(`${match.name} ${match.reason}`))).toBe(true);
    expect(matches.some(match => /urgent|eye|atrium|animal|veterinary/i.test(match.name))).toBe(false);
  });

  it("does not activate dental matching for unrelated substrings", async () => {
    const spanish = await recommendBusinessMatches(
      "Necesito atención por un accidente",
      "",
      undefined,
      5,
      "es"
    );
    const english = await recommendBusinessMatches(
      "I need help for a resident",
      "",
      undefined,
      5,
      "en"
    );
    const accidental = await recommendBusinessMatches(
      "This was accidental damage",
      "",
      undefined,
      5,
      "en"
    );
    const veterinary = await recommendBusinessMatches(
      "My dog needs veterinary dental care",
      "",
      undefined,
      5,
      "en"
    );
    expect(spanish).toHaveLength(0);
    expect(english).toHaveLength(0);
    expect(accidental).toHaveLength(0);
    expect(veterinary).toHaveLength(0);
  });
});
