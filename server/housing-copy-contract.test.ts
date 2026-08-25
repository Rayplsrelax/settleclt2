import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { en } from "../client/src/i18n/locales/en";
import { es } from "../client/src/i18n/locales/es";
import type { Locale } from "../shared/i18n";
import { HOUSING_COPY } from "../shared/housing-copy";
import { resolveRouteSeo } from "./_core/route-seo";

const probe = vi.hoisted(() => ({ locale: "en" as Locale }));
vi.mock("@/i18n/I18nContext", () => ({
  useI18n: () => ({
    locale: probe.locale,
    setLocale: vi.fn(),
    t: (key: keyof typeof en) => (probe.locale === "es" ? es[key] : en[key]) ?? en[key] ?? key,
  }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: { referrals: { submit: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } } },
}));
vi.mock("@/hooks/useSEO", () => ({ useSEO: vi.fn() }));
vi.mock("@/lib/mixpanel", () => ({ trackFindHomeIntent: vi.fn(), trackFindHomeLead: vi.fn() }));
vi.mock("@/components/Navbar", () => ({ default: () => React.createElement("nav") }));
vi.mock("@/components/Footer", () => ({ default: () => React.createElement("footer") }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => React.createElement("a", { href }, children) }));

import FindRealtor from "../client/src/pages/FindRealtor";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const directorySource = source("../client/src/pages/Directory.tsx");
const realtorSource = source("../client/src/pages/FindRealtor.tsx");
const neighborhoodSource = source("../client/src/pages/NeighborhoodDetail.tsx");
const routerSource = source("./routers.ts");
const routeSeoSource = source("./_core/route-seo.ts");
const referralNotificationSource = routerSource.slice(
  routerSource.indexOf("referrals: router"),
  routerSource.indexOf("// --- Business Claims ---")
);
const findHomeSeoSource = routeSeoSource
  .split("\n")
  .filter(line => line.includes("find-your-home") || line.includes("HOUSING_COPY"))
  .join("\n");
const localeHousingCopy = JSON.stringify({
  enDirectory: en["directory.homeCtaDescription"],
  esDirectory: es["directory.homeCtaDescription"],
  enMetadata: en["realtor.description"],
  esMetadata: es["realtor.description"],
  enBlog: en["blog.findHomeDescription"],
  esBlog: es["blog.findHomeDescription"],
});
const forbidden = /trusted[^\n.]{0,40}(?:agent|expert|professional|match)|vetted|free (?:connection|matching|service)|completely free|conexi[oó]n gratuita|completamente gratis|de confianza|verificad[oa]s|guaranteed (?:referral|response)|48\s*(?:business\s*)?(?:hours?|h|horas?)/i;

describe("shared neutral housing request contract", () => {
  it("is the single EN/ES source used by locale metadata, Directory, FindRealtor, and server SEO", () => {
    expect(en["directory.homeCtaDescription"]).toBe(HOUSING_COPY.en.request);
    expect(es["directory.homeCtaDescription"]).toBe(HOUSING_COPY.es.request);
    expect(en["realtor.description"]).toBe(HOUSING_COPY.en.request);
    expect(es["realtor.description"]).toBe(HOUSING_COPY.es.request);
    expect(resolveRouteSeo("/find-your-home", undefined, "en").description).toBe(HOUSING_COPY.en.request);
    expect(resolveRouteSeo("/find-your-home", undefined, "es").description).toBe(HOUSING_COPY.es.request);
    expect(directorySource).toContain('t("directory.homeCtaDescription")');
    expect(realtorSource).toContain("HOUSING_COPY");
    expect(neighborhoodSource).toContain("HOUSING_COPY[locale].request");
    expect(routeSeoSource).toContain("HOUSING_COPY");
  });

  it("preserves conditional sharing, permitted/disclosed referral-fee, no-obligation, and independent license-check disclosures without claiming Settle CLT broker operation", () => {
    expect(HOUSING_COPY.en.disclosure).not.toMatch(/Settle CLT is operated by|licensed North Carolina real estate broker/i);
    expect(HOUSING_COPY.en.disclosure).toMatch(/may share.*licensed real estate professional/i);
    expect(HOUSING_COPY.en.disclosure).toMatch(/may receive a referral fee/i);
    expect(HOUSING_COPY.en.disclosure).toMatch(/where permitted and disclosed/i);
    expect(HOUSING_COPY.en.disclosure).toMatch(/no obligation/i);
    expect(HOUSING_COPY.es.disclosure).not.toMatch(/Settle CLT es operado por|corredor de bienes raíces con licencia de Carolina del Norte/i);
    expect(HOUSING_COPY.es.disclosure).toMatch(/puede compartir.*profesional inmobiliario con licencia/i);
    expect(HOUSING_COPY.es.disclosure).toMatch(/puede recibir una tarifa de referencia/i);
    expect(HOUSING_COPY.es.disclosure).toMatch(/cuando esté permitido y se divulgue/i);
    expect(HOUSING_COPY.es.disclosure).toMatch(/ninguna obligación/i);
  });

  it("contains no unsupported housing promise in dictionaries, route SEO, Directory, FindRealtor, or notification source", () => {
    for (const [name, value] of Object.entries({ localeHousingCopy, findHomeSeoSource, directorySource, realtorSource, neighborhoodSource, referralNotificationSource })) {
      expect(value, name).not.toMatch(forbidden);
    }
  });

  it("renders the same neutral contract and factual disclosures in EN and ES", () => {
    for (const locale of ["en", "es"] as const) {
      probe.locale = locale;
      const markup = renderToStaticMarkup(React.createElement(FindRealtor));
      const decodedMarkup = markup.replaceAll("&#x27;", "'");
      expect(markup).toContain(HOUSING_COPY[locale].request);
      expect(decodedMarkup).toContain(HOUSING_COPY[locale].disclosure);
      expect(markup).not.toMatch(forbidden);
      expect(markup).toContain('href="https://www.ncrec.gov"');
    }
  });

  it("uses neutral request-received success copy in both locales", () => {
    expect(realtorSource).toContain("HOUSING_COPY.en.success");
    expect(realtorSource).toContain("HOUSING_COPY.es.success");
    expect(HOUSING_COPY.en.success).not.toMatch(forbidden);
    expect(HOUSING_COPY.es.success).not.toMatch(forbidden);
  });
});
