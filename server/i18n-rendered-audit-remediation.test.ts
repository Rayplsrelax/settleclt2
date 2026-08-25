import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveRouteSeo } from "./_core/route-seo";

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");
const en = source("../client/src/i18n/locales/en.ts");
const es = source("../client/src/i18n/locales/es.ts");

const pages = {
  globalSearch: source("../client/src/components/GlobalSearch.tsx"),
  footer: source("../client/src/components/Footer.tsx"),
  list: source("../client/src/pages/ListYourBusiness.tsx"),
  realtor: source("../client/src/pages/FindRealtor.tsx"),
  share: source("../client/src/components/ShareButtons.tsx"),
  reviews: source("../client/src/components/ReviewSection.tsx"),
  profile: source("../client/src/pages/Profile.tsx"),
  submitEvent: source("../client/src/pages/SubmitEvent.tsx"),
  business: source("../client/src/pages/MyBusiness.tsx"),
  neighborhood: source("../client/src/pages/NeighborhoodDetail.tsx"),
  notifications: source("../client/src/pages/Notifications.tsx"),
  notFound: source("../client/src/pages/NotFound.tsx"),
  auth: source("../client/src/pages/Auth.tsx"),
};


const requiredKeys = [
  "footer.copyright",
  "search.trigger",
  "search.dialogTitle",
  "search.dialogDescription",
  "search.inputPlaceholder",
  "search.loading",
  "search.loadError",
  "search.retry",
  "search.reload",
  "search.noResults",
  "listing.seoDescription",
  "listing.heroDescription",
  "listing.formTitle",
  "listing.submitPending",
  "realtor.heroTitle",
  "realtor.successTitle",
  "realtor.formTitle",
  "realtor.validationRequired",
  "share.share",
  "share.page",
  "share.copy",
  "share.copied",
  "share.copySuccess",
  "share.copyError",
  "reviews.title",
  "reviews.write",
  "reviews.signIn",
  "reviews.submit",
  "reviews.empty",
  "profile.signInTitle",
  "profile.signInDescription",
  "submitEvent.signInDescription",
  "business.signInDescription",
  "business.noAccessDescription",
  "notFound.seoTitle",
  "notFound.seoDescription",
  "auth.seoTitle",
  "auth.seoDescription",
  "neighborhoodDetail.previousPhoto",
  "neighborhoodDetail.nextPhoto",
  "neighborhoodDetail.photoButton",
] as const;

describe("rendered EN/ES audit remediation contracts", () => {
  it("defines every new application-owned key in both locales", () => {
    for (const key of requiredKeys) {
      expect(en, key).toContain(`\"${key}\":`);
      expect(es, key).toContain(`\"${key}\":`);
    }
  });

  it("wires global search, footer, share, and reviews to i18n", () => {
    for (const [name, text] of Object.entries({
      globalSearch: pages.globalSearch,
      footer: pages.footer,
      share: pages.share,
      reviews: pages.reviews,
    })) {
      expect(text, name).toContain("useI18n");
      expect(text, name).toMatch(/\bt\(/);
    }
    expect(pages.footer).toContain('t("footer.copyright"');
    expect(pages.globalSearch).not.toContain('aria-label="Search CLT..."');
    expect(pages.share).not.toContain('title="Share"');
  });

  it("wires the two audited lead routes and all eleven controls", () => {
    expect(pages.list).toContain('t("listing.heroDescription")');
    expect(pages.realtor).toContain('t("realtor.heroTitle")');
    expect((pages.list.match(/htmlFor=/g) ?? []).length).toBeGreaterThanOrEqual(
      8
    );
    expect(
      (pages.realtor.match(/aria-label=\{t\("realtor\./g) ?? []).length
    ).toBeGreaterThanOrEqual(3);
    expect(pages.list).not.toContain(
      'title: `${t("business.listTitle")} | Settle CLT`'
    );
  });

  it("localizes unauthenticated prompts and client titles", () => {
    expect(pages.profile).toContain('t("profile.signInTitle")');
    expect(pages.submitEvent).toContain('t("submitEvent.signInDescription")');
    expect(pages.business).toContain('t("business.signInDescription")');
    expect(pages.notFound).toContain('title: t("notFound.seoTitle")');
    expect(pages.auth).toContain('title: t("auth.seoTitle")');
  });

  it("gives standalone route states a main landmark and h1", () => {
    expect(pages.realtor).toContain("<main");
    expect(pages.notifications).toContain("<main");
    expect(pages.notifications).not.toContain(
      '<h2 className="text-xl font-semibold mb-2">'
    );
    expect(pages.notFound).toContain("<main");
    expect(pages.notFound).toMatch(/<h1[^>]*>[\s\S]*t\("notFound\.title"\)[\s\S]*<\/h1>/);
  });

  it("names all five carousel controls", () => {
    expect(pages.neighborhood).toContain(
      'aria-label={t("neighborhoodDetail.previousPhoto")}'
    );
    expect(pages.neighborhood).toContain(
      'aria-label={t("neighborhoodDetail.nextPhoto")}'
    );
    expect(pages.neighborhood).toContain(
      'aria-label={t("neighborhoodDetail.photoButton"'
    );
  });

  it("returns Spanish first-response chrome for audited static routes", () => {
    for (const path of [
      "/",
      "/neighborhoods",
      "/directory",
      "/events",
      "/blog",
      "/list-your-business",
      "/compare",
      "/quiz",
      "/profile",
      "/wishlist",
      "/submit-event",
      "/notifications",
      "/auth",
      "/contact",
      "/find-your-home",
      "/404",
    ]) {
      const english = resolveRouteSeo(path, undefined, "en");
      const spanish = resolveRouteSeo(path, undefined, "es");
      expect(spanish.title, path).not.toBe(english.title);
      expect(spanish.description, path).not.toBe(english.description);
    }
  });
});
