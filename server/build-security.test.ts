import { describe, expect, it } from "vitest";
import viteConfig from "../vite.config";

describe("production build security", () => {
  it("does not publish client source maps", () => {
    expect(viteConfig.build?.sourcemap).toBe(false);
  });

  it("does not ship the Manus editor runtime in production", () => {
    const manusPlugin = viteConfig.plugins?.find(
      plugin =>
        plugin &&
        "name" in plugin &&
        plugin.name === "vite-plugin-manus-runtime"
    );

    expect(manusPlugin).toMatchObject({ apply: "serve" });
  });
});
