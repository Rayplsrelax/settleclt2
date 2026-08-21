import { describe, expect, it } from "vitest";
import {
  formatLocalizedCurrency,
  formatLocalizedWholeCurrency,
  formatLocalizedDate,
  formatLocalDateInputValue,
  parseLocalDateInputValue,
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

  it("formats whole-dollar currency without adding cents", () => {
    expect(formatLocalizedWholeCurrency(1234, "en")).toBe("$1,234");
    expect(formatLocalizedWholeCurrency(1234, "es")).not.toContain(".00");
  });

  it("preserves local calendar semantics for date-only inputs", () => {
    const date = parseLocalDateInputValue("2026-08-21");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(21);
  });

  it("formats the local date for HTML date inputs without UTC conversion", () => {
    const lateEvening = new Date(2026, 7, 21, 23, 30);
    expect(formatLocalDateInputValue(lateEvening)).toBe("2026-08-21");
  });
});
