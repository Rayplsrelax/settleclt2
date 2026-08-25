import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveRouteSeo } from "./_core/route-seo";
import { injectRouteSeo } from "./_core/vite";

const shell = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const canonical = (html: string) =>
  html.match(/<link rel="canonical" href="([^"]+)" \/>/)?.[1];

const realtor = source("../client/src/pages/FindRealtor.tsx");
const listing = source("../client/src/pages/ListYourBusiness.tsx");
const reviews = source("../client/src/components/ReviewSection.tsx");

describe("final i18n review blockers", () => {
  describe("server neighborhood detail SEO", () => {
    it("keeps the authored neighborhood name while localizing Spanish metadata", () => {
      expect(resolveRouteSeo("/neighborhood/dilworth", undefined, "es")).toEqual({
        title: "Dilworth: Guía para vivir allí",
        description:
          "Vivir en Dilworth, Charlotte — vivienda, ambiente, caminabilidad y para quién es ideal.",
      });
    });

    it("handles malformed detail slugs without throwing or inventing a neighborhood", () => {
      expect(() =>
        resolveRouteSeo("/neighborhood/%E0%A4%A", undefined, "es")
      ).not.toThrow();
      expect(resolveRouteSeo("/neighborhood/%E0%A4%A", undefined, "es")).toEqual({
        title: "Guías de vecindarios de Charlotte",
        description:
          "Compara vecindarios de Charlotte por costos, ambiente y caminabilidad.",
      });
    });

    it("keeps English and Spanish neighborhood canonicals identical", () => {
      const path = "/neighborhood/dilworth";
      expect(canonical(injectRouteSeo(shell, path, undefined, "es"))).toBe(
        canonical(injectRouteSeo(shell, path, undefined, "en"))
      );
      expect(canonical(injectRouteSeo(shell, path, undefined, "es"))).toBe(
        "https://settleclt.com/neighborhood/dilworth"
      );
    });
  });

  describe("server blog article SEO", () => {
    it("uses an authored title with a localized generic Spanish description", () => {
      const titles = new Map([["moving-guide", "The Authored Moving Guide"]]);
      expect(resolveRouteSeo("/blog/moving-guide", titles, "es")).toEqual({
        title: "The Authored Moving Guide",
        description: "Lee esta guía de Settle CLT sobre vivir en Charlotte.",
      });
    });

    it("uses localized blog metadata when enrichment is absent for a valid slug", () => {
      expect(resolveRouteSeo("/blog/moving-guide", undefined, "es")).toEqual({
        title: "Blog sobre vivir en Charlotte",
        description: "Guías y consejos locales para vivir y mudarte a Charlotte.",
      });
      expect(resolveRouteSeo("/blog/moving-guide", new Map(), "en")).toEqual({
        title: "Charlotte Living Blog",
        description:
          "Guides and local information for living in Charlotte — moving, neighborhoods, and city life.",
      });
    });

    it("handles malformed slugs with localized blog fallback metadata", () => {
      expect(() => resolveRouteSeo("/blog/%E0%A4%A", undefined, "es")).not.toThrow();
      expect(resolveRouteSeo("/blog/%E0%A4%A", undefined, "es")).toEqual({
        title: "Blog sobre vivir en Charlotte",
        description: "Guías y consejos locales para vivir y mudarte a Charlotte.",
      });
    });

    it("keeps English and Spanish blog canonicals identical for enriched and fallback articles", () => {
      for (const [path, titles] of [
        ["/blog/moving-guide", new Map([["moving-guide", "Moving Guide"]])],
        ["/blog/missing-enrichment", undefined],
        ["/blog/%E0%A4%A", undefined],
      ] as const) {
        expect(canonical(injectRouteSeo(shell, path, titles, "es"))).toBe(
          canonical(injectRouteSeo(shell, path, titles, "en"))
        );
        expect(canonical(injectRouteSeo(shell, path, titles, "es"))).toBe(
          `https://settleclt.com${path}`
        );
      }
    });
  });

  describe("lead-route structural parity", () => {
    it("renders FindRealtor through one shared locale-neutral structure", () => {
      expect(realtor).not.toContain('if (locale === "es")');
      expect(realtor).toContain("satisfies Record<Locale, RealtorCopy>");
      for (const contract of [
        'data-section="realtor-hero"',
        'data-section="realtor-how-it-works"',
        'data-section="realtor-form"',
        'data-section="realtor-trust-controls"',
        'data-section="realtor-quiz-cta"',
        'data-section="realtor-faq"',
        'data-section="realtor-disclosure"',
        'href="https://www.ncrec.gov"',
        'href="/quiz"',
        'surface: "find_home_page"',
        'value: "Under $200K"',
        'value: "ASAP (within 30 days)"',
      ]) expect(realtor, contract).toContain(contract);
      expect(realtor).not.toContain("TESTIMONIALS");
      expect(realtor).not.toContain('data-section="realtor-testimonials"');
    });

    it("renders ListYourBusiness through one shared locale-neutral structure", () => {
      expect(listing).not.toContain('if (locale === "es")');
      expect(listing).toContain("satisfies Record<Locale, ListingCopy>");
      for (const contract of [
        'data-section="listing-hero"',
        'data-section="listing-how-it-works"',
        'data-section="listing-plans"',
        'data-section="listing-metrics"',
        'data-section="listing-form"',
        'data-section="listing-faq"',
        'href="/my-business"',
        'id="submit-form"',
        "value={item.id}",
      ]) expect(listing, contract).toContain(contract);
    });
  });

  describe("review safety and accessibility", () => {
    it("never exposes mutation error messages and uses localized safe copy", () => {
      expect(reviews).not.toContain("toast.error(err.message)");
      expect(reviews).not.toMatch(/onError:\s*err\s*=>/);
      expect(reviews).toContain('t("reviews.submitError")');
      expect(reviews).toContain('t("reviews.deleteError")');
    });

    it("exposes selected rating state through keyboard-complete Radix radio semantics", () => {
      expect(reviews).toContain('from "@/components/ui/radio-group"');
      expect(reviews).toContain("<RadioGroup");
      expect(reviews).toContain("<RadioGroupItem");
      expect(reviews).toContain('orientation="horizontal"');
      expect(reviews).toContain("value={rating > 0 ? String(rating) : undefined}");
      expect(reviews).toContain("onValueChange={value => onRate?.(Number(value))}");
    });
  });
});
