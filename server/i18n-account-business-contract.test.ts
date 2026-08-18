import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const en = source("../client/src/i18n/locales/en.ts");
const es = source("../client/src/i18n/locales/es.ts");
const profile = source("../client/src/pages/Profile.tsx");
const business = source("../client/src/pages/MyBusiness.tsx");
const accountBusinessKeys = [
  "profile.title",
  "profile.loading",
  "profile.signIn",
  "profile.deleteTitle",
  "profile.deleteConfirm",
  "profile.deleteConfirmSuffix",
  "profile.deleteAccount",
  "profile.logout",
  "business.loading",
  "business.saving",
  "business.ownerPortal",
  "business.signIn",
  "business.noAccess",
  "business.saveChanges",
  "business.details",
  "business.hours",
  "business.photos",
  "business.analytics",
  "business.displayName",
  "business.phone",
  "business.email",
  "business.website",
];

describe("account and business i18n contracts", () => {
  it("keeps the account/business key contract present in both dictionaries", () => {
    for (const key of accountBusinessKeys) {
      expect(en).toContain(`"${key}":`);
      expect(es).toContain(`"${key}":`);
    }
  });

  it("keeps account and business pages connected to the translation context", () => {
    for (const page of [profile, business]) {
      expect(page).toContain("useI18n");
      expect(page).toMatch(/\bt\(/);
    }
    expect(profile).toContain('t("profile.deleteConfirm")');
    expect(profile).toContain('t("profile.deleteConfirmSuffix")');
    expect(business).toContain('t("business.saving")');
  });

  it("guards known account/business UI copy with whitespace-tolerant checks", () => {
    const files = `${profile}\n${business}`;
    for (const phrase of [
      "Delete your account?",
      "Business Owner Portal",
      "No Business Access",
      "Save Changes",
      "Display Name",
    ]) {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(files).not.toMatch(new RegExp(`>\\s*${escaped}\\s*<`));
    }
  });
});
