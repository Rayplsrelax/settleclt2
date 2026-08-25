import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { en } from "../client/src/i18n/locales/en";
import { es } from "../client/src/i18n/locales/es";
import { SERVICE_CATEGORIES } from "../shared/services";
import { resolveRouteSeo } from "./_core/route-seo";

const unsupported = /\b(?:vetted|trusted|top-rated|handpicked|best|curated|perfect|honest)\b|(?<!not )\bguaranteed\b|\b(?:confiables?|de confianza|mejor(?:es)?|mejor calificados?|seleccionad[oa]s? a mano|curad[oa]s?|honest[oa]s?|garantizad[oa]s?)\b/i;

describe("repo-wide route metadata truthfulness", () => {
  it("contains no unsupported quality, vetting, ranking, selection, or guarantee adjectives in server route metadata", () => {
    expect(readFileSync("server/_core/route-seo.ts", "utf8")).not.toMatch(unsupported);
    const paths = [
      "/", "/directory", "/referrals", "/find-your-home",
      ...SERVICE_CATEGORIES.map(category => `/directory/category/${category.id}`),
    ];
    for (const locale of ["en", "es"] as const) {
      for (const path of paths) {
        expect(JSON.stringify(resolveRouteSeo(path, undefined, locale)), `${locale}:${path}`).not.toMatch(unsupported);
      }
    }
  });

  it("contains no unsupported adjectives in localized SEO dictionaries or page useSEO declarations", () => {
    for (const [locale, dictionary] of [["en", en], ["es", es]] as const) {
      for (const [key, value] of Object.entries(dictionary)) {
        if (/seo(?:title|description|keywords)$/i.test(key)) {
          expect(value, `${locale}:${key}`).not.toMatch(unsupported);
        }
      }
    }

    const pages = readdirSync("client/src/pages").filter(page => page.endsWith(".tsx"));
    for (const page of pages) {
      const source = readFileSync(`client/src/pages/${page}`, "utf8");
      const declarations = source.match(/useSEO\(\{[\s\S]*?\}\);/g) ?? [];
      expect(declarations.join("\n"), page).not.toMatch(unsupported);
    }
  });
});