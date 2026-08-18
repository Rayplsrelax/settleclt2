import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../client/src/components/LanguageToggle.tsx", import.meta.url),
  "utf8"
).replace(/\s+/g, " ");

describe("language selector contract", () => {
  it("offers explicit English and Spanish radio choices", () => {
    expect(source).toContain("DropdownMenuRadioGroup");
    expect(source).toContain('DropdownMenuRadioItem value="en"');
    expect(source).toContain('DropdownMenuRadioItem value="es"');
  });

  it("labels the setting accessibly and shows the current language", () => {
    expect(source).toContain('aria-label={t("language.current"');
    expect(source).toContain('t("language.choose")');
    expect(source).toContain('t("language.current"');
    expect(source).toContain("activeLabel");
  });

  it("gets both option labels from the translation dictionaries", () => {
    expect(source).toContain('{t("language.english")}');
    expect(source).toContain('{t("language.spanish")}');
    expect(source).not.toContain('value="en">English<');
    expect(source).not.toContain('value="es">Español<');
  });

  it("does not use the old one-click language inversion", () => {
    expect(source).not.toContain('setLocale(locale === "en" ? "es" : "en")');
  });
});
