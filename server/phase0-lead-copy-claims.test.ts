import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const realtor = source("../client/src/pages/FindRealtor.tsx");
const listing = source("../client/src/pages/ListYourBusiness.tsx");
const en = source("../client/src/i18n/locales/en.ts");
const es = source("../client/src/i18n/locales/es.ts");
const housing = source("../shared/housing-copy.ts");
const publicLeadUi = `${en}\n${es}\n${source("../client/src/pages/Home.tsx")}\n${source("../client/src/pages/ReferralIntake.tsx")}`;

describe("Phase 0 substantiated lead-route copy", () => {
  it("removes fabricated realtor stories, vetting/network assertions, timing guarantees, and unsupported stats", () => {
    expect(realtor).not.toMatch(/TESTIMONIALS|Real stories|Historias reales|Sarah & Mike|Jordan P\.|David L\.|Vetted|verificad[oa]s|Top 5|100\+|People Move Daily|Personas se mudan cada día|48hr|48 business hours|48 horas hábiles/i);
    expect(realtor).not.toMatch(/all agents in our network hold active licenses|todos los agentes de nuestra red tienen licencias activas/i);
  });

  it("removes unsupported broker-operation claims while preserving conditional sharing, permitted/disclosed referral fees, no obligation, and NCREC verification", () => {
    expect(housing).not.toMatch(/licensed North Carolina real estate broker|corredor de bienes raíces con licencia de Carolina del Norte/i);
    expect(housing).toContain("licensed real estate professional");
    expect(housing).toContain("where permitted and disclosed");
    expect(housing).toContain("cuando esté permitido y se divulgue");
    expect(housing).toMatch(/no obligation|ninguna obligación/i);
    expect(realtor).toContain("HOUSING_COPY.en.disclosure");
    expect(realtor).toContain("HOUSING_COPY.es.disclosure");
    expect(realtor).toContain("https://www.ncrec.gov");
  });

  it("removes business review guarantees and unsupported visitor totals in both locales", () => {
    expect(listing).not.toMatch(/within 48 hours|en 48 horas|1000s|Monthly Visitors|Visitantes mensuales/i);
    for (const unsupported of [
      "Get your Charlotte business discovered by thousands of newcomers. Start with a free listing and upgrade for featured placement and analytics.",
      "Get discovered by thousands of people moving to Charlotte every month. Start with a free listing and upgrade anytime.",
      "Haz que miles de recién llegados descubran tu negocio en Charlotte. Comienza con un perfil gratuito y mejora tu visibilidad y analíticas.",
      "Haz que miles de personas que se mudan a Charlotte descubran tu negocio. Comienza con un perfil gratuito y mejora el plan cuando quieras.",
    ]) {
      expect(`${en}\n${es}`).not.toContain(unsupported);
    }
  });

  it("keeps rendered public lead UI and complete dictionaries free of unsupported semantic claims", () => {
    const unsupported = /\b(?:thousands?|miles|vetted|trusted|confiables?|de confianza|within \d+ (?:business )?(?:hours?|days?)|en \d+ (?:horas?|d[ií]as?)|guaranteed|garantizad[oa]s?|delivered|entregad[oa]s?)\b/i;
    const allowNegatedGuarantees = publicLeadUi
      .replace(/\b(?:is )?not guaranteed\b/gi, "")
      .replace(/\bno (?:está )?garantizad[oa]\b/gi, "");
    expect(allowNegatedGuarantees).not.toMatch(unsupported);
  });
});