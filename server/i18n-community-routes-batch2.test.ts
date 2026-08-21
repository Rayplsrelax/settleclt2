import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(name: string) {
  return readFileSync(new URL(`../client/src/pages/${name}.tsx`, import.meta.url), "utf8");
}

const contracts = {
  Passport: [
    "passport.title",
    "passport.seoDescription",
    "passport.seoKeywords",
    "passport.totalStamps",
    "passport.events",
    "passport.neighborhoods",
    "passport.thisMonth",
    "passport.addStamp",
    "passport.place",
    "passport.event",
    "passport.searchEvents",
    "passport.searchDirectory",
    "passport.customPlace",
    "passport.dateAttended",
    "passport.dateVisited",
    "passport.notesOptional",
    "passport.adding",
    "passport.collectStamp",
    "passport.empty",
    "passport.landingTagline",
    "passport.landingDescription",
    "passport.howItWorks",
    "passport.visitPlaces",
    "passport.attendEvents",
    "passport.collectStamps",
    "passport.earnAchievements",
    "passport.inside",
    "passport.readyTitle",
    "passport.getPassport",
    "passport.untitledEvent",
  ],
  Wishlist: [
    "wishlist.title",
    "wishlist.empty",
    "wishlist.notePlaceholder",
    "wishlist.remove",
    "wishlist.saveNotes",
    "wishlist.seoDescription",
    "wishlist.authFeature",
    "wishlist.cancelEdit",
  ],
  Leaderboard: [
    "leaderboard.title",
    "leaderboard.noExplorers",
    "leaderboard.startExploring",
    "leaderboard.rankValue",
    "leaderboard.stamps",
    "leaderboard.seoDescription",
    "leaderboard.seoKeywords",
    "leaderboard.shareDescription",
  ],
} as const;

describe("community route i18n batch 2", () => {
  for (const [page, keys] of Object.entries(contracts)) {
    it(`${page} wires translated community chrome`, () => {
      const pageSource = source(page);
      expect(pageSource).toContain("useI18n");
      for (const key of keys) {
        expect(pageSource).toContain(`t("${key}"`);
      }
    });
  }

  it("Passport gives translated accessible names to form controls", () => {
    const passport = source("Passport");
    expect(passport).toContain('aria-label={t("passport.searchEvents")}');
    expect(passport).toContain('aria-label={t("passport.searchDirectory")}');
    expect(passport).toContain('aria-label={t("passport.customPlace")}');
    expect(passport).toContain('aria-label={t(showAdd ? "passport.cancel" : "passport.addStamp")}');
    expect(passport).toContain('aria-label={t("passport.notesOptional")}');
    expect(passport).toContain('id="passport-place-search"');
    expect(passport).toContain("formatLocalizedDate");
    expect(passport).not.toContain("toLocaleDateString()");
  });

  it("Passport has no residual hardcoded community chrome", () => {
    const passport = source("Passport");
    expect(passport).not.toMatch(/>\s*EVENT\s*</);
    expect(passport).not.toMatch(/>\s*Leaderboard\s*</);
    expect(passport).not.toMatch(/>\s*Browse Events\s*</);
  });

  it("AuthGate translates loading and sign-in states", () => {
    const authGate = readFileSync(new URL("../client/src/components/AuthGate.tsx", import.meta.url), "utf8");
    for (const key of ["authGate.loading", "authGate.inlinePrompt", "authGate.required", "authGate.description", "authGate.signIn"]) {
      expect(authGate).toContain(`t("${key}"`);
    }
  });
});
