import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

const directory = readSource("client/src/pages/Directory.tsx");
const cookieConsent = readSource("client/src/components/CookieConsent.tsx");
const quickStamp = readSource("client/src/components/QuickStampButton.tsx");
const wishlist = readSource("client/src/components/WishlistButton.tsx");

describe("Phase 3 directory UX contracts", () => {
  it("labels the default sort with the behavior users can expect", () => {
    expect(directory).toContain('t("directory.sortRecommended")');
    expect(directory).not.toContain("Sort: Default");
  });

  it("exposes the visible result count and active filter count", () => {
    expect(directory).toContain("Math.min(visibleCount, filteredServices.length)");
    expect(directory).toContain('t("directory.showingMap"');
    expect(directory).toContain("activeFilterCount");
    expect(directory).toMatch(/t\("directory\.filters"\)\}\{activeFilterCount\s*>\s*0/);
  });

  it("keeps consent compact and its dismiss control touch accessible", () => {
    expect(cookieConsent).toContain("max-w-md");
    expect(cookieConsent).toContain("min-h-11 min-w-11");
    expect(cookieConsent).toContain('role="region"');
    expect(cookieConsent).toContain('aria-label={t("cookies.ariaLabel")}');
  });

  it("keeps every directory icon action at least 44px and accessibly named", () => {
    for (const control of [quickStamp, wishlist]) {
      expect(control).toContain('const btnSize = "min-w-11 min-h-11"');
      expect(control).toContain("aria-label=");
    }
  });
});
