import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Locale } from "../shared/i18n";
import { injectRouteSeo } from "./_core/vite";

function pageSource(name: "PrivacyPolicy" | "TermsOfService") {
  return readFileSync(
    new URL(`../client/src/pages/${name}.tsx`, import.meta.url),
    "utf8"
  );
}

const SHELL = `<!doctype html>
<html lang="en">
<head>
  <title>Settle CLT</title>
  <meta name="description" content="default" />
  <meta property="og:title" content="Settle CLT" />
  <meta property="og:description" content="default" />
  <meta property="og:url" content="https://settleclt.com/" />
  <link rel="canonical" href="https://settleclt.com/" />
</head><body></body></html>`;

async function loadLegalContent() {
  return import("../client/src/content/legal");
}

describe("localized legal page content", () => {
  it("wires both pages to the active locale and structured legal content", () => {
    for (const page of ["PrivacyPolicy", "TermsOfService"] as const) {
      const source = pageSource(page);
      expect(source).toContain("useI18n");
      expect(source).toContain("legalContent[locale]");
      expect(source).toContain("useSEO");
      expect(source).toMatch(/sections\.map/);
      expect(source).toMatch(/<section[^>]*aria-labelledby=/);
      expect(source).toMatch(/<ul[^>]*>/);
      expect(source).not.toContain("<main");
    }
  });

  it("keeps 10 privacy and 12 terms sections in exact EN/ES parity", async () => {
    const { legalContent } = await loadLegalContent();
    expect(legalContent.en.privacy.sections).toHaveLength(10);
    expect(legalContent.es.privacy.sections).toHaveLength(10);
    expect(legalContent.en.terms.sections).toHaveLength(12);
    expect(legalContent.es.terms.sections).toHaveLength(12);

    for (const page of ["privacy", "terms"] as const) {
      expect(legalContent.es[page].sections.map(section => section.id)).toEqual(
        legalContent.en[page].sections.map(section => section.id)
      );
      const structure = (locale: Locale) =>
        legalContent[locale][page].sections.map(section =>
          section.blocks.map(block =>
            block.type === "list" ? `list:${block.items.length}` : "paragraph"
          )
        );
      expect(structure("es")).toEqual(structure("en"));
    }
  });

  it("preserves every legal bullet with matching list structure", async () => {
    const { legalContent } = await loadLegalContent();
    const countBullets = (locale: Locale, page: "privacy" | "terms") =>
      legalContent[locale][page].sections.reduce(
        (total, section) =>
          total + section.blocks.reduce(
            (sectionTotal, block) =>
              sectionTotal + (block.type === "list" ? block.items.length : 0),
            0
          ),
        0
      );

    expect(countBullets("en", "privacy")).toBe(19);
    expect(countBullets("es", "privacy")).toBe(19);
    expect(countBullets("en", "terms")).toBe(20);
    expect(countBullets("es", "terms")).toBe(20);
  });

  it("accurately discloses linked analytics, submitted leads, purposes, processors, and qualified deletion in EN/ES", async () => {
    const { legalContent, legalPageText } = await loadLegalContent();
    const en = legalPageText(legalContent.en.privacy);
    const es = legalPageText(legalContent.es.privacy);

    expect(en).not.toMatch(/anonymous(?:ly)?\s+(?:usage\s+)?analytics|anonymous analytics/i);
    expect(es).not.toMatch(/an[aá]nim(?:o|os|a|as)\s+(?:de\s+)?(?:uso\s+)?(?:y\s+)?an[aá]lisis|an[aá]lisis\s+an[aá]nim/i);
    expect(en).toMatch(/usage and search analytics.*account.*user.*session.*pseudonymous/i);
    expect(en).toMatch(/authenticated searches.*persist.*user IDs/i);
    expect(es).toMatch(/an[aá]lisis de uso y b[uú]squeda.*cuenta.*usuario.*sesi[oó]n.*seud[oó]nim/i);
    expect(es).toMatch(/b[uú]squedas autenticadas.*persisten.*ID de usuario/i);

    for (const pattern of [
      /contact submissions/i,
      /business listing submissions and claims/i,
      /premium or business leads/i,
      /housing referral requests/i,
      /contact, message, and business details/i,
      /respond.*review.*operat/i,
      /notification, authentication, analytics.*hosting/i,
      /deletion requests.*legal and operational retention/i,
    ]) expect(en).toMatch(pattern);
    for (const pattern of [
      /formularios de contacto/i,
      /publicaciones y reclamaciones de fichas de negocios/i,
      /clientes potenciales premium o comerciales/i,
      /solicitudes de referencia de vivienda/i,
      /datos de contacto, mensajes y negocios/i,
      /responder.*revisar.*operaciones/i,
      /notificaciones, autenticaci[oó]n, an[aá]lisis.*alojamiento/i,
      /solicitudes de eliminaci[oó]n.*retenci[oó]n legal y operativa/i,
    ]) expect(es).toMatch(pattern);
  });

  it("renders every privacy disclosure through the shared structured block renderer", () => {
    const source = pageSource("PrivacyPolicy");
    expect(source).toContain("legalContent[locale].privacy");
    expect(source).toMatch(/content\.sections\.map/);
    expect(source).toMatch(/section\.blocks\.map/);
    expect(source).toMatch(/block\.items\.map/);
    expect(source).toContain("{item.text}");
  });

  it("ships non-empty EN/ES metadata, headings, paragraphs, labels, and list items", async () => {
    const { legalContent } = await loadLegalContent();
    for (const locale of ["en", "es"] as const) {
      for (const page of ["privacy", "terms"] as const) {
        const content = legalContent[locale][page];
        expect(content.title.trim()).not.toBe("");
        expect(content.updatedLabel.trim()).not.toBe("");
        expect(content.seo.title.trim()).not.toBe("");
        expect(content.seo.description.trim()).not.toBe("");
        for (const section of content.sections) {
          expect(section.heading.trim()).not.toBe("");
          for (const block of section.blocks) {
            if (block.type === "paragraph") expect(block.text.trim()).not.toBe("");
            if (block.type === "list") {
              expect(block.items.length).toBeGreaterThan(0);
              for (const item of block.items) {
                expect(item.text.trim()).not.toBe("");
                if ("label" in item && item.label !== undefined) {
                  expect(item.label.trim()).not.toBe("");
                }
              }
            }
          }
        }
      }
    }
  });

  it("preserves the April 1, 2026 effective date in both locales", async () => {
    const { LEGAL_EFFECTIVE_DATE, legalContent } = await loadLegalContent();
    expect(LEGAL_EFFECTIVE_DATE).toBe("2026-04-01");
    expect(legalContent.en.privacy.updatedLabel).toContain("April 1, 2026");
    expect(legalContent.en.terms.updatedLabel).toContain("April 1, 2026");
    expect(legalContent.es.privacy.updatedLabel).toContain("1 de abril de 2026");
    expect(legalContent.es.terms.updatedLabel).toContain("1 de abril de 2026");
  });

  it("uses the neutral housing contract in every EN/ES legal referral passage", async () => {
    const { legalContent } = await loadLegalContent();
    const section = (locale: Locale, page: "privacy" | "terms", id: string) =>
      legalContent[locale][page].sections.find(candidate => candidate.id === id)!;
    const blockText = (locale: Locale, page: "privacy" | "terms", id: string) =>
      section(locale, page, id).blocks.flatMap(block =>
        block.type === "paragraph" ? [block.text] : block.items.map(item => item.text)
      );

    const operationalPassages = {
      enPrivacyUse: blockText("en", "privacy", "how-we-use-information")[2],
      esPrivacyUse: blockText("es", "privacy", "how-we-use-information")[2],
      enPrivacySharing: blockText("en", "privacy", "information-sharing")[1],
      esPrivacySharing: blockText("es", "privacy", "information-sharing")[1],
      enPrivacyDisclosure: blockText("en", "privacy", "real-estate-referral-disclosures")[0],
      esPrivacyDisclosure: blockText("es", "privacy", "real-estate-referral-disclosures")[0],
      enTermsHousing: blockText("en", "terms", "housing-referral-services").join(" "),
      esTermsHousing: blockText("es", "terms", "housing-referral-services").join(" "),
    };
    for (const [name, passage] of Object.entries(operationalPassages)) {
      expect(passage, name).not.toMatch(/\bconnects?\b|\bare shared\b|se comparten|conecta(?:r|do|dos)?\b/i);
      expect(passage, name).not.toMatch(/all referral arrangements comply|todos los acuerdos de referencia cumplen/i);
    }

    for (const text of [operationalPassages.enPrivacyDisclosure, operationalPassages.enTermsHousing]) {
      expect(text).toMatch(/may (?:review and )?share/i);
      expect(text).toMatch(/referral or response is not guaranteed/i);
      expect(text).toMatch(/may receive a referral fee/i);
      expect(text).toMatch(/where permitted and disclosed/i);
      expect(text).toMatch(/no obligation/i);
      expect(text).toMatch(/independently verify.*NCREC/i);
    }
    for (const text of [operationalPassages.esPrivacyDisclosure, operationalPassages.esTermsHousing]) {
      expect(text).toMatch(/(?:podemos|puede) revisar y compartir/i);
      expect(text).toMatch(/no se garantiza (?:una referencia ni una respuesta|una respuesta ni una referencia)/i);
      expect(text).toMatch(/puede recibir una tarifa de referencia/i);
      expect(text).toMatch(/cuando esté permitido y se divulgue/i);
      expect(text).toMatch(/ninguna obligación/i);
      expect(text).toMatch(/verifique de forma independiente.*NCREC/i);
    }
  });

  it("removes unsupported Settle CLT broker-operation claims while preserving liability, governing-law, and contact language", async () => {
    const { legalContent, legalPageText } = await loadLegalContent();
    const enPrivacy = legalPageText(legalContent.en.privacy);
    const esPrivacy = legalPageText(legalContent.es.privacy);
    const enTerms = legalPageText(legalContent.en.terms);
    const esTerms = legalPageText(legalContent.es.terms);

    expect(enPrivacy).not.toMatch(/Settle CLT is operated by a licensed|licensed North Carolina real estate broker/i);
    expect(enPrivacy).toContain("We do not sell your personal information");
    expect(esPrivacy).not.toMatch(/Settle CLT es operado por|corredor de bienes raíces con licencia de Carolina del Norte/i);
    expect(esPrivacy).toContain("No vendemos su información personal");

    expect(enTerms).not.toMatch(/Settle CLT is operated by a licensed|licensed North Carolina real estate broker/i);
    expect(esTerms).not.toMatch(/Settle CLT es operado por|corredor de bienes raíces con licencia de Carolina del Norte/i);
    expect(enTerms).toContain("indirect, incidental, special, consequential, or punitive damages");
    expect(esTerms).toContain("daños indirectos, incidentales, especiales, consecuentes o punitivos");
    expect(enTerms).toContain("courts of Mecklenburg County, North Carolina");
    expect(esTerms).toContain("tribunales del condado de Mecklenburg, Carolina del Norte");
    expect(legalContent.en.terms.privacyLinkLabel).toBe("Privacy Policy");
    expect(legalContent.es.terms.privacyLinkLabel).toBe("Política de Privacidad");
    expect(legalContent.en.terms.privacyLinkHref).toBe("/privacy");
    expect(legalContent.es.terms.privacyLinkHref).toBe("/privacy");
  });
});

describe("localized legal first-response SEO", () => {
  it.each([
    ["/privacy", "Política de Privacidad — Settle CLT"],
    ["/terms", "Términos de Servicio — Settle CLT"],
  ])("serves Spanish title, language, and canonical metadata for %s", (path, title) => {
    const html = injectRouteSeo(SHELL, path, undefined, "es");
    expect(html).toContain('<html lang="es">');
    expect(html).toContain(`<title>${title}</title>`);
    expect(html).toContain(
      `<link rel="canonical" href="https://settleclt.com${path}" />`
    );
    expect(html).toContain(
      `<meta property="og:url" content="https://settleclt.com${path}" />`
    );
  });
});
