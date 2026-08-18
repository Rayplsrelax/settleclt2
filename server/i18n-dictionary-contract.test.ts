import { describe, expect, it } from "vitest";
import { en } from "../client/src/i18n/locales/en";
import { es } from "../client/src/i18n/locales/es";

describe("i18n dictionary contract", () => {
  it("keeps English and Spanish key sets identical", () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it("does not contain empty translations", () => {
    expect(Object.entries(en).filter(([, value]) => !value.trim())).toEqual([]);
    expect(Object.entries(es).filter(([, value]) => !value.trim())).toEqual([]);
  });
});
