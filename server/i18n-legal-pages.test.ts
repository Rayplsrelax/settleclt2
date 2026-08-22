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

  it("preserves critical disclosure, liability, governing-law, and contact language", async () => {
    const { legalContent, legalPageText } = await loadLegalContent();
    const enPrivacy = legalPageText(legalContent.en.privacy);
    const esPrivacy = legalPageText(legalContent.es.privacy);
    const enTerms = legalPageText(legalContent.en.terms);
    const esTerms = legalPageText(legalContent.es.terms);

    expect(enPrivacy).toContain("licensed North Carolina real estate broker");
    expect(enPrivacy).toContain("This referral fee does not increase your cost");
    expect(enPrivacy).toContain("We do not sell your personal information");
    expect(esPrivacy).toContain("corredor de bienes raíces con licencia de Carolina del Norte");
    expect(esPrivacy).toContain("Esta tarifa de referencia no aumenta su costo");
    expect(esPrivacy).toContain("No vendemos su información personal");

    expect(enTerms).toContain("licensed North Carolina real estate broker");
    expect(esTerms).toContain("corredor de bienes raíces con licencia de Carolina del Norte");
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
