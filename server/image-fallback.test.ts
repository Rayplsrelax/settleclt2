import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  IMAGE_FALLBACK_SRC,
  applyImageFallback,
} from "../client/src/hooks/useImageFallbacks";

describe("global image fallback", () => {
  it("replaces a failed image once and removes its broken srcset", () => {
    const removeAttribute = vi.fn();
    const image = {
      src: "https://cdn.example.test/missing.jpg",
      dataset: {} as DOMStringMap,
      removeAttribute,
    } as unknown as HTMLImageElement;

    expect(applyImageFallback(image)).toBe(true);
    expect(image.src).toBe(IMAGE_FALLBACK_SRC);
    expect(image.dataset.imageFallbackApplied).toBe("true");
    expect(removeAttribute).toHaveBeenCalledWith("srcset");
    expect(applyImageFallback(image)).toBe(false);
  });

  it("registers the capture hook once at the application root", () => {
    const app = readFileSync(
      resolve(__dirname, "../client/src/App.tsx"),
      "utf-8"
    ).replace(/\s+/g, " ");

    expect(app).toContain('import { useImageFallbacks } from "@/hooks/useImageFallbacks"');
    expect(app).toContain("function App() { useImageFallbacks(); return (");
  });
});
