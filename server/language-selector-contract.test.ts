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
    expect(source).toContain('t("language.choose")');
    expect(source).toContain('t("language.current"');
    expect(source).toContain("activeLabel");
  });

  it("does not use the old one-click language inversion", () => {
    expect(source).not.toContain('setLocale(locale === "en" ? "es" : "en")');
  });
});
