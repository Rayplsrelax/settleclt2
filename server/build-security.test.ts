import { describe, expect, it } from "vitest";
import viteConfig from "../vite.config";

describe("production build security", () => {
  it("does not publish client source maps", () => {
    expect(viteConfig.build?.sourcemap).toBe(false);
  });
});
