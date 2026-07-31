import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const directory = readFileSync(
  resolve(process.cwd(), "client/src/pages/Directory.tsx"),
  "utf8"
);
const cookieConsent = readFileSync(
  resolve(process.cwd(), "client/src/components/CookieConsent.tsx"),
  "utf8"
);

describe("Phase 3 directory UX contracts", () => {
  it("labels the default sort with the behavior users can expect", () => {
    expect(directory).toContain("Sort: Recommended");
    expect(directory).not.toContain("Sort: Default");
  });

  it("exposes the visible result count and active filter count", () => {
    expect(directory).toContain("Showing {Math.min(visibleCount, filteredServices.length)} of {filteredServices.length}");
    expect(directory).toContain("activeFilterCount");
    expect(directory).toContain("Filters{activeFilterCount > 0");
  });

  it("keeps consent compact and its dismiss control touch accessible", () => {
    expect(cookieConsent).toContain("max-w-md");
    expect(cookieConsent).toContain("min-h-11 min-w-11");
    expect(cookieConsent).toContain('role="region"');
    expect(cookieConsent).toContain('aria-label="Cookie consent"');
  });
});
