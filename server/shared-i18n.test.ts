import { describe, expect, it } from "vitest";
import { resolveInitialLocale } from "../shared/i18n";

describe("resolveInitialLocale", () => {
  it("prefers an explicit cookie over browser language", () => {
    expect(resolveInitialLocale("en", ["es-MX"])).toBe("en");
  });

  it("uses Spanish browser preference when no cookie exists", () => {
    expect(resolveInitialLocale(null, ["es-MX", "en-US"])).toBe("es");
  });

  it("uses the first supported browser language", () => {
    expect(resolveInitialLocale(null, ["fr-FR", "es-US", "en-US"])).toBe(
      "es"
    );
  });

  it("falls back to English for unsupported browser languages", () => {
    expect(resolveInitialLocale(null, ["fr-FR"])).toBe("en");
  });
});
