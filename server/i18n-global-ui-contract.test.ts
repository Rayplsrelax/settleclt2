import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const app = source("../client/src/App.tsx");
const cookies = source("../client/src/components/CookieConsent.tsx");
const map = source("../client/src/components/Map.tsx");
const notFound = source("../client/src/pages/NotFound.tsx");
const errorBoundary = source("../client/src/components/ErrorBoundary.tsx");

describe("translated global UI contract", () => {
  it("translates the global loading state", () => {
    expect(app).toContain('t("common.loading")');
    expect(app).not.toContain(">Loading...</");
  });

  it("translates cookie consent text and accessible labels", () => {
    for (const key of [
      "cookies.ariaLabel",
      "cookies.title",
      "cookies.description",
      "cookies.privacyPolicy",
      "cookies.accept",
      "cookies.decline",
      "cookies.dismiss",
      "cookies.dismissTitle",
    ]) {
      expect(cookies).toContain(`t("${key}")`);
    }
  });

  it("passes translated status copy to the map fallback", () => {
    expect(map).toContain('loadingLabel={t("map.loading")}');
    expect(map).toContain('unavailableLabel={t("map.unavailable")}');
    expect(map).toContain('fallbackLabel={t("map.openAddressInstead")}');
  });

  it("translates the 404 recovery screen", () => {
    expect(notFound).toContain('t("notFound.title")');
    expect(notFound).toContain('t("notFound.description")');
    expect(notFound).toContain('t("notFound.goHome")');
  });

  it("translates the unexpected-error fallback", () => {
    expect(errorBoundary).toContain("function ErrorFallback");
    expect(errorBoundary).toContain('t("error.title")');
    expect(errorBoundary).toContain('t("error.reload")');
  });
});
