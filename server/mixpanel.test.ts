import { describe, it, expect } from "vitest";

describe("Mixpanel Integration", () => {
  it("should have VITE_MIXPANEL_TOKEN environment variable set", () => {
    // The token is a VITE_ prefixed env var, available at build time
    // We verify the env var exists in the process environment
    const token = process.env.VITE_MIXPANEL_TOKEN;
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token!.length).toBeGreaterThan(0);
  });

  it("should have a valid Mixpanel token format (32-char hex)", () => {
    const token = process.env.VITE_MIXPANEL_TOKEN!;
    // Mixpanel tokens are typically 32-character hex strings
    expect(token).toMatch(/^[a-f0-9]{32}$/);
  });
});
