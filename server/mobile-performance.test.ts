import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(__dirname, "..", relativePath), "utf-8");

describe("mobile homepage performance", () => {
  it("discovers the exact LCP hero image from the initial HTML", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    const indexHtml = readProjectFile("client/index.html");
    const normalizedIndexHtml = indexHtml.replace(/\s+/g, " ");
    const heroUrl = home.match(/const HERO_IMAGE\s*=\s*\n?\s*"([^"]+)"/)?.[1];

    expect(heroUrl).toBeTruthy();
    expect(normalizedIndexHtml).toContain(
      '<link rel="preconnect" href="https://files.manuscdn.com" crossorigin />'
    );
    expect(normalizedIndexHtml).toContain(
      `<link rel="preload" as="image" href="${heroUrl}" fetchpriority="high" />`
    );
  });

  it("waits for window load before scheduling the analytics SDK", () => {
    const main = readProjectFile("client/src/main.tsx");
    const mixpanel = readProjectFile("client/src/lib/mixpanel.ts");

    expect(main).toContain("initMixpanel();");
    expect(mixpanel).toContain('document.readyState === "complete"');
    expect(mixpanel).toContain(
      'window.addEventListener("load", scheduleLoad, { once: true })'
    );
    expect(mixpanel).toContain("loadImmediately = true");
    expect(mixpanel).toMatch(
      /export function trackPageView[\s\S]*?withSdk\([\s\S]*?false\s*\);/
    );
  });

  it("keeps heavy neighborhood and service data behind near-viewport boundaries", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    const deferredSection = readProjectFile(
      "client/src/components/DeferredSection.tsx"
    );

    expect(home).not.toContain('from "@shared/neighborhoods"');
    expect(home).not.toContain('from "@shared/services"');
    expect(home).toMatch(
      /lazy\(\s*\(\)\s*=>\s*import\("@\/components\/home\/FeaturedNeighborhoods"\)\s*\)/
    );
    expect(home).toMatch(
      /lazy\(\s*\(\)\s*=>\s*import\("@\/components\/home\/DirectoryPreview"\)\s*\)/
    );
    expect(home).toMatch(
      /<DeferredSection minHeight=\{416\}>\s*<Suspense fallback=\{null\}>\s*<FeaturedNeighborhoods \/>\s*<\/Suspense>\s*<\/DeferredSection>/
    );
    expect(home).toMatch(
      /<DeferredSection minHeight=\{392\}>\s*<Suspense fallback=\{null\}>\s*<DirectoryPreview \/>\s*<\/Suspense>\s*<\/DeferredSection>/
    );
    expect(home.match(/<DeferredSection/g)).toHaveLength(2);
    expect(deferredSection).toContain("new IntersectionObserver");
    expect(deferredSection).toContain('rootMargin: "100px 0px"');
    expect(deferredSection).toContain("minHeight");
    expect(deferredSection).toContain("isNearViewport ? children : null");
  });
});
