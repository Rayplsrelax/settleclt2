import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "../client/src/i18n/locales/en";
import { es } from "../client/src/i18n/locales/es";
import type { Locale } from "../shared/i18n";

const probe = vi.hoisted(() => ({ locale: "en" as Locale }));

vi.mock("@/i18n/I18nContext", () => ({
  useI18n: () => ({
    locale: probe.locale,
    setLocale: vi.fn(),
    t: (key: keyof typeof en, vars?: Record<string, string | number>) => {
      let value = (probe.locale === "es" ? es[key] : en[key]) ?? en[key] ?? key;
      for (const [name, replacement] of Object.entries(vars ?? {})) {
        value = value.split(`{${name}}`).join(String(replacement));
      }
      return value;
    },
  }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    referrals: { submit: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
    leads: { submitBusiness: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
  },
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/hooks/useSEO", () => ({ useSEO: vi.fn() }));
vi.mock("@/lib/mixpanel", () => ({ trackFindHomeIntent: vi.fn(), trackFindHomeLead: vi.fn() }));
vi.mock("@/components/Navbar", () => ({ default: () => React.createElement("nav") }));
vi.mock("@/components/Footer", () => ({ default: () => React.createElement("footer") }));
vi.mock("@/components/PageLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children) }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => React.createElement("a", { href }, children) }));

import FindRealtor from "../client/src/pages/FindRealtor";
import ListYourBusiness from "../client/src/pages/ListYourBusiness";

function sections(markup: string) {
  return [...markup.matchAll(/data-section="([^"]+)"/g)].map(match => match[1]);
}

function renderIn(locale: Locale, Component: React.ComponentType) {
  probe.locale = locale;
  return renderToStaticMarkup(React.createElement(Component));
}

describe("isolated EN/ES rendered lead route probes", () => {
  beforeEach(() => {
    probe.locale = "en";
  });

  it("renders identical material FindRealtor structure in English and Spanish", () => {
    const english = renderIn("en", FindRealtor);
    const spanish = renderIn("es", FindRealtor);

    expect(sections(spanish)).toEqual(sections(english));
    expect(sections(spanish)).toEqual([
      "realtor-hero",
      "realtor-how-it-works",
      "realtor-form",
      "realtor-trust-controls",
      "realtor-quiz-cta",
      "realtor-faq",
      "realtor-disclosure",
    ]);
    expect(english).toContain("Find Your Perfect Charlotte Home");
    expect(spanish).toContain("Encuentra tu hogar ideal en Charlotte");
    expect(spanish).toContain('href="/quiz"');
    expect(spanish).toContain('href="https://www.ncrec.gov"');
    for (const markup of [english, spanish]) {
      expect(markup).not.toMatch(/real stories|historias reales|Sarah &amp; Mike|vetted|verificad[oa]s|48\s*(?:business\s*)?(?:hours?|h|horas?)|Top 5|100\+|people move daily|cada día/i);
    }
  });

  it("renders identical material ListYourBusiness structure in English and Spanish", () => {
    const english = renderIn("en", ListYourBusiness);
    const spanish = renderIn("es", ListYourBusiness);

    expect(sections(spanish)).toEqual(sections(english));
    expect(sections(spanish)).toEqual([
      "listing-hero",
      "listing-how-it-works",
      "listing-plans",
      "listing-metrics",
      "listing-benefits",
      "listing-form",
      "listing-trust-controls",
      "listing-faq",
    ]);
    expect(english).toContain("List Your Business");
    expect(spanish).toContain("Publica tu negocio");
    expect(spanish).toContain('href="/my-business"');
    expect(spanish).toContain('id="submit-form"');
    expect(spanish).toContain('value="moving-companies"');
    for (const markup of [english, spanish]) {
      expect(markup).not.toMatch(/1000s|monthly visitors|visitantes mensuales|within 48|en 48 horas/i);
    }
  });
});
