import { describe, expect, it } from "vitest";
import { getConfiguredPublicOrigin } from "./public-origin";

describe("getConfiguredPublicOrigin", () => {
  it("returns the exact normalized configured HTTP origin", () => {
    expect(getConfiguredPublicOrigin("https://settleclt.com/")).toBe(
      "https://settleclt.com"
    );
  });

  it("rejects configured URLs containing a path, query, hash, or credentials", () => {
    for (const value of [
      "https://settleclt.com/my-business",
      "https://settleclt.com?next=evil",
      "https://settleclt.com#fragment",
      "https://user:pass@settleclt.com",
    ]) {
      expect(() => getConfiguredPublicOrigin(value)).toThrow(
        "PUBLIC_APP_ORIGIN must be an origin only"
      );
    }
  });

  it("rejects non-HTTP protocols", () => {
    expect(() => getConfiguredPublicOrigin("javascript:alert(1)")).toThrow(
      "PUBLIC_APP_ORIGIN must use HTTP or HTTPS"
    );
  });

  it("requires an explicit origin in production", () => {
    expect(() => getConfiguredPublicOrigin(undefined, true)).toThrow(
      "PUBLIC_APP_ORIGIN is required in production"
    );
  });

  it("uses a local-only default outside production", () => {
    expect(getConfiguredPublicOrigin(undefined, false)).toBe("http://localhost:3000");
  });
});
