import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("account and business i18n contracts", () => {
  it("translates Profile account states and actions", () => {
    const profile = source("../client/src/pages/Profile.tsx");
    for (const key of [
      "profile.title",
      "profile.loading",
      "profile.signIn",
      "profile.deleteTitle",
      "profile.deleteConfirm",
      "profile.deleteAccount",
      "profile.logout",
    ]) expect(profile).toContain(`t("${key}")`);
  });

  it("translates My Business portal shell and editable labels", () => {
    const business = source("../client/src/pages/MyBusiness.tsx");
    for (const key of [
      "business.loading",
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
    ]) expect(business).toContain(`t("${key}")`);
  });

  it("guards known account/business UI copy from returning as JSX literals", () => {
    const files = [
      source("../client/src/pages/Profile.tsx"),
      source("../client/src/pages/MyBusiness.tsx"),
    ].join("\n");
    for (const phrase of [
      "Delete your account?",
      "Business Owner Portal",
      "No Business Access",
      "Save Changes",
      "Display Name",
    ]) expect(files).not.toContain(`>${phrase}<`);
  });
});
