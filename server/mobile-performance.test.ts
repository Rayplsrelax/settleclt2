import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(__dirname, "..", relativePath), "utf-8");

describe("mobile homepage performance", () => {
  it("preloads the exact LCP hero image only on the homepage", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    const indexHtml = readProjectFile("client/index.html");
    const viteServer = readProjectFile("server/_core/vite.ts");
    const heroUrl = home.match(/const HERO_IMAGE\s*=\s*\n?\s*"([^"]+)"/)?.[1];

    expect(heroUrl).toBeTruthy();
    expect(indexHtml).not.toContain('rel="preload"\n      as="image"');
    expect(viteServer).toContain("injectRoutePreloads(template, req.path)");
    expect(viteServer).toContain(heroUrl);
  });

  it("loads global-search datasets only after search is opened", () => {
    const search = readProjectFile("client/src/components/GlobalSearch.tsx");

    expect(search).not.toMatch(/^import .*shared\/(services|neighborhoods)/m);
    expect(search).toContain('import("../../../shared/neighborhoods")');
    expect(search).toContain('import("../../../shared/services")');
    expect(search).toContain("if (!open || searchIndex)");
  });

  it("handles search-index loading failures with an explicit retry state", () => {
    const search = readProjectFile("client/src/components/GlobalSearch.tsx");

    expect(search).toContain('"loading" | "ready" | "error"');
    expect(search).toContain(".catch(error =>");
    expect(search).toContain("Loading search data");
    expect(search).toContain("Search data couldn't be loaded");
    expect(search).toContain("Retry");
  });

  it("defers passport neighborhood data until a stamp is clicked", () => {
    const quickStamp = readProjectFile(
      "client/src/components/QuickStampButton.tsx"
    );

    expect(quickStamp).not.toMatch(/^import .*shared\/neighborhoods/m);
    expect(quickStamp).toContain('await import("@shared/neighborhoods")');
  });

  it("guards deferred stamp submissions and handles chunk-load failures", () => {
    const quickStamp = readProjectFile(
      "client/src/components/QuickStampButton.tsx"
    );

    expect(quickStamp).toContain("submissionInFlight.current");
    expect(quickStamp).toContain("try {");
    expect(quickStamp).toContain("catch (error)");
    expect(quickStamp).toContain("finally {");
    expect(quickStamp).toContain('toast.error("Failed to prepare stamp")');
  });

  it("keeps passport stamp creation idempotent through cache refresh", () => {
    const quickStamp = readProjectFile(
      "client/src/components/QuickStampButton.tsx"
    );
    const schema = readProjectFile("drizzle/schema.ts");
    const database = readProjectFile("server/db.ts");
    const migration = readProjectFile(
      "drizzle/0030_passport_stamp_idempotency.sql"
    );

    expect(quickStamp).toContain(
      "await utils.passport.getEntries.invalidate()"
    );
    expect(schema).toContain("passport_entries_user_service_unique");
    expect(schema).toContain("passport_entries_user_event_unique");
    expect(database).toMatch(
      /addPassportEntry[\s\S]*?onDuplicateKeyUpdate\([\s\S]*?visitedAt:\s*sql`\$\{passportEntries\.visitedAt\}`/
    );
    expect(migration).toContain("DELETE duplicate_entry");
    expect(migration).toContain("passport_entries_user_service_unique");
    expect(migration).toContain("passport_entries_user_event_unique");
  });

  it("self-hosts critical fonts instead of loading render-shifting stylesheets", () => {
    const indexHtml = readProjectFile("client/index.html");
    const css = readProjectFile("client/src/index.css");

    expect(indexHtml).not.toContain("fonts.googleapis.com");
    expect(indexHtml).toContain("/fonts/inter-latin.woff2");
    expect(indexHtml).toContain("/fonts/plus-jakarta-sans-latin.woff2");
    expect(css).toContain('url("/fonts/inter-latin.woff2")');
    expect(css).toContain('url("/fonts/plus-jakarta-sans-latin.woff2")');
  });

  it("waits for window load before scheduling the analytics SDK", () => {
    const main = readProjectFile("client/src/main.tsx");
    const mixpanel = readProjectFile("client/src/lib/mixpanel.ts");

    expect(main).not.toContain("initMixpanel();");
    expect(mixpanel).toContain("enableAnalytics");
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
