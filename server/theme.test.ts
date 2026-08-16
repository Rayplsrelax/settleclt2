import { describe, expect, it } from "vitest";
import { isStoredTheme, resolveInitialTheme, type Theme } from "@shared/theme";

describe("shared theme resolution", () => {
  it("returns true only for exact stored theme values", () => {
    expect(isStoredTheme("dark")).toBe(true);
    expect(isStoredTheme("light")).toBe(true);
    expect(isStoredTheme("Dark")).toBe(false);
    expect(isStoredTheme("blue")).toBe(false);
    expect(isStoredTheme(null)).toBe(false);
  });

  it("prefers an explicit stored choice over the OS preference", () => {
    expect(resolveInitialTheme("light", true)).toBe<Theme>("light");
    expect(resolveInitialTheme("dark", false)).toBe<Theme>("dark");
  });

  it("falls back to the OS preference when nothing is stored", () => {
    expect(resolveInitialTheme(null, true)).toBe<Theme>("dark");
    expect(resolveInitialTheme(null, false)).toBe<Theme>("light");
  });

  it("ignores garbage stored values and uses the OS preference", () => {
    expect(resolveInitialTheme("blue", true)).toBe<Theme>("dark");
    expect(resolveInitialTheme("blue", false)).toBe<Theme>("light");
  });

  it("defaults to light with no stored value and no dark preference", () => {
    expect(resolveInitialTheme(null, false)).toBe<Theme>("light");
  });
});
