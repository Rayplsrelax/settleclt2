import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const contextSource = readFileSync(
  new URL("../client/src/i18n/I18nContext.tsx", import.meta.url),
  "utf8"
);
const indexSource = readFileSync(
  new URL("../client/index.html", import.meta.url),
  "utf8"
);
const bootstrapMatch = indexSource.match(
  /<script data-i18n-bootstrap="true">([\s\S]*?)<\/script>/
);

function runBootstrap(cookie: string, browserLanguages: string[]): string {
  if (!bootstrapMatch) throw new Error("i18n bootstrap script missing");
  const document = { cookie, documentElement: { lang: "en" } };
  runInNewContext(bootstrapMatch[1], {
    document,
    navigator: {
      languages: browserLanguages,
      language: browserLanguages[0] ?? "en-US",
    },
    decodeURIComponent,
  });
  return document.documentElement.lang;
}

describe("initial locale bootstrap contract", () => {
  it("resolves the provider locale from cookie then browser languages", () => {
    expect(contextSource).toContain("resolveInitialLocale");
    expect(contextSource).toContain("navigator.languages");
  });

  it("sets html lang before the Vite entry module runs", () => {
    const bootstrap = indexSource.indexOf('data-i18n-bootstrap="true"');
    const entry = indexSource.indexOf('type="module"');

    expect(bootstrap).toBeGreaterThan(-1);
    expect(entry).toBeGreaterThan(bootstrap);
  });

  it("uses a valid explicit cookie", () => {
    expect(runBootstrap("site_locale=es", ["en-US"])).toBe("es");
  });

  it("treats an empty cookie as absent", () => {
    expect(runBootstrap("site_locale=", ["es-MX", "en-US"])).toBe("es");
  });

  it("recovers from malformed cookie encoding", () => {
    expect(runBootstrap("site_locale=%E0%A4%A", ["es-MX"])).toBe("es");
  });

  it("keeps unsupported explicit cookies aligned with the English fallback", () => {
    expect(runBootstrap("site_locale=fr", ["es-MX"])).toBe("en");
  });
});
