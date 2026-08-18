import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const contextSource = readFileSync(
  new URL("../client/src/i18n/I18nContext.tsx", import.meta.url),
  "utf8"
);
const indexSource = readFileSync(
  new URL("../client/index.html", import.meta.url),
  "utf8"
);

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
    expect(indexSource).toContain("site_locale");
    expect(indexSource).toContain("document.documentElement.lang");
  });
});
