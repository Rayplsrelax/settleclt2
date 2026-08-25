import { describe, expect, it } from "vitest";
import { safeDecodeURIComponent } from "./safe-decode";
import { resolveRouteSeo } from "./route-seo";

describe("safeDecodeURIComponent", () => {
  it("decodes valid URI components", () => {
    expect(safeDecodeURIComponent("food%20drink")).toBe("food drink");
  });

  it("returns null for malformed URI components", () => {
    expect(safeDecodeURIComponent("%E0%A4%A")).toBeNull();
  });

  it("keeps shell SEO resolution non-throwing for every malformed dynamic family", () => {
    for (const path of [
      "/neighborhood/%E0%A4%A",
      "/directory/category/%E0%A4%A",
      "/events/category/%E0%A4%A",
      "/directory/%E0%A4%A",
      "/blog/%E0%A4%A",
      "/tag/%E0%A4%A",
    ]) {
      expect(() => resolveRouteSeo(path, undefined, "es"), path).not.toThrow();
    }
  });
});
