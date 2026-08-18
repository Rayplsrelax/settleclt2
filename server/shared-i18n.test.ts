import { describe, expect, it } from "vitest";
import {
  decodeLocaleCookieValue,
  resolveInitialLocale,
} from "../shared/i18n";

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

  it("treats an empty cookie as absent", () => {
    expect(resolveInitialLocale("", ["es-MX"])).toBe("es");
  });
});

describe("decodeLocaleCookieValue", () => {
  it("decodes a valid cookie value", () => {
    expect(decodeLocaleCookieValue("es")).toBe("es");
  });

  it("returns null for an empty cookie value", () => {
    expect(decodeLocaleCookieValue("")).toBeNull();
  });

  it("returns null instead of throwing for malformed encoding", () => {
    expect(decodeLocaleCookieValue("%E0%A4%A")).toBeNull();
  });
});
