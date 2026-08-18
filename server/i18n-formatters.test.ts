import { describe, expect, it } from "vitest";
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  localeToLanguageTag,
} from "../client/src/i18n/formatters";

describe("localized formatters", () => {
  it("maps app locales to US regional language tags", () => {
    expect(localeToLanguageTag("en")).toBe("en-US");
    expect(localeToLanguageTag("es")).toBe("es-US");
  });

  it("formats a month in the selected language", () => {
    const date = new Date("2026-08-18T12:00:00Z");
    expect(
      formatLocalizedDate(date, "en", { month: "long", timeZone: "UTC" })
    ).toBe("August");
    expect(
      formatLocalizedDate(date, "es", { month: "long", timeZone: "UTC" })
    ).toBe("agosto");
  });

  it("keeps currency in USD for both locales", () => {
    expect(formatLocalizedCurrency(19, "en")).toContain("$19.00");
    expect(formatLocalizedCurrency(19, "es")).toContain("19.00");
  });
});
