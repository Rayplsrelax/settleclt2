import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function pageSource(name: string) {
  return readFileSync(new URL(`../client/src/pages/${name}.tsx`, import.meta.url), "utf8");
}

const routeKeys = {
  BusinessDetail: [
    "businessDetail.home",
    "businessDetail.directory",
    "businessDetail.back",
    "businessDetail.notFound",
    "businessDetail.website",
    "businessDetail.directions",
    "businessDetail.call",
    "businessDetail.hours",
    "businessDetail.services",
    "businessDetail.reviews",
    "businessDetail.claim",
    "businessDetail.inquiry",
  ],
  BusinessPricing: [
    "businessPricing.title",
    "businessPricing.subtitle",
    "businessPricing.findClaim",
    "businessPricing.addMissing",
    "businessPricing.howItWorks",
    "businessPricing.plans",
    "businessPricing.freeClaim",
    "businessPricing.featured",
    "businessPricing.premium",
    "businessPricing.pro",
  ],
  ReferralIntake: [
    "referral.title",
    "referral.subtitle",
    "referral.request",
    "referral.name",
    "referral.email",
    "referral.phone",
    "referral.category",
    "referral.need",
    "referral.submit",
    "referral.submitting",
    "referral.success",
    "referral.recommendations",
  ],
} as const;

describe("business route i18n batch 3", () => {
  for (const [page, keys] of Object.entries(routeKeys)) {
    it(`${page} wires translated route chrome`, () => {
      const source = pageSource(page);
      expect(source).toContain("useI18n");
      for (const key of keys) {
        const directCall = `t("${key}"`;
        const typedConfig = `nameKey: "${key}"`;
        expect(
          source.includes(directCall) || source.includes(typedConfig),
          `${page} must wire ${key}`
        ).toBe(true);
      }
    });
  }

  it("keeps every BusinessDetail hook before the not-found return", () => {
    const source = pageSource("BusinessDetail").replace(/\r\n/g, "\n");
    expect(source.indexOf("const relatedBusinesses = useMemo")).toBeLessThan(
      source.indexOf("if (!service) {\n    return <NotFound")
    );
  });

  it("separates canonical structured hours from localized display hours", () => {
    const source = pageSource("BusinessDetail");
    expect(source).toContain("canonicalHours");
    expect(source).toContain("displayHours");
    expect(source).toContain("localBusiness.openingHours = canonicalHours");
  });

  it("localizes BusinessDetail lightbox accessibility and error fallbacks", () => {
    const source = pageSource("BusinessDetail");
    for (const key of [
      "businessDetail.closePhotos",
      "businessDetail.previousPhoto",
      "businessDetail.nextPhoto",
      "businessDetail.photoAlt",
      "businessDetail.error",
    ]) {
      expect(source).toContain(`t("${key}"`);
    }
    expect(source).not.toContain("toast.error(error.message)");
  });

  it("localizes ReferralIntake error fallback", () => {
    const source = pageSource("ReferralIntake");
    expect(source).toContain('t("referral.error")');
    expect(source).not.toContain("toast.error(error.message)");
  });

  it("propagates the selected locale through referral matching", () => {
    const page = pageSource("ReferralIntake");
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(page).toContain('path: "/referrals"');
    expect(router).toContain('locale: z.enum(["en", "es"])');
    expect(router).toContain("input.locale");
  });

  it("implements lightbox dialog, Escape, focus trap, and focus restoration", () => {
    const source = pageSource("BusinessDetail");
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('event.key !== "Tab"');
    expect(source).toContain("lightboxReturnFocusRef");
    expect(source).toContain("lightboxCloseButtonRef.current?.focus()");
  });

  it("preserves pricing feature counts and key promises", () => {
    const source = pageSource("BusinessPricing");
    expect(source).toContain('"businessPricing.featuredFeature7"');
    expect(source).toContain('"businessPricing.proFeature2"');
    expect(source).toContain("t(featureKey)");
  });
});
