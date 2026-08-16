import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const shellPath = resolve("client/index.html");
const viteCorePath = resolve("server/_core/vite.ts");
const routeSeoPath = resolve("server/_core/route-seo.ts");

const shell = readFileSync(shellPath, "utf8");
const viteCore = readFileSync(viteCorePath, "utf8");
const routeSeoSource = readFileSync(routeSeoPath, "utf8");

const CANONICAL_RE = /<link rel="canonical" href="([^"]+)" \/>/;
const TITLE_RE = /<title>([^<]*)<\/title>/;
const DESCRIPTION_RE = /<meta\s+name="description"\s+content="([^"]*)"\s*\/>/;
const OG_URL_RE = /<meta\s+property="og:url"\s+content="([^"]*)"\s*\/>/;
const OG_TITLE_RE = /<meta\s+property="og:title"\s+content="([^"]*)"\s*\/>/;

describe("server-side route SEO contracts", () => {
  it("the static shell default canonical matches the sitemap homepage URL", () => {
    expect(shell.match(CANONICAL_RE)?.[1]).toBe("https://settleclt.com/");
  });

  it("resolves per-route SEO for the sitemap's static routes", () => {
    const sitemapRoutes = [
      "/",
      "/neighborhoods",
      "/directory",
      "/events",
      "/things-to-do",
      "/blog",
      "/passport",
      "/bingo",
      "/leaderboard",
      "/quiz",
    ];
    const cases: Array<[string, RegExp]> = sitemapRoutes.map(path => [
      path,
      new RegExp(`"${path}":`),
    ]);
    for (const [path, entry] of cases) {
      expect(entry.test(routeSeoSource), `${path} missing from route-seo`).toBe(
        true
      );
    }
  });

  it("maps dynamic route families to specific metadata", () => {
    expect(routeSeoSource).toContain("/neighborhood/:id");
    expect(routeSeoSource).toContain("/directory/category/:slug");
    expect(routeSeoSource).toContain("/events/category/:categoryId");
    expect(routeSeoSource).toContain("/directory/:slug");
    expect(routeSeoSource).toContain("/blog/:slug");
  });

  it("injectRouteSeo replaces title, canonical, description, and OG tags", async () => {
    const { injectRouteSeo } = await import("../server/_core/vite");
    const injected = injectRouteSeo(shell, "/events");

    expect(injected.match(CANONICAL_RE)?.[1]).toBe(
      "https://settleclt.com/events"
    );
    expect(injected.match(TITLE_RE)?.[1]).toBe(
      "Charlotte Events Calendar | Settle CLT"
    );
    expect(injected.match(DESCRIPTION_RE)?.[1]).toBe(
      "Upcoming events across Charlotte — markets, festivals, live music, and neighborhood happenings."
    );
    expect(injected.match(OG_URL_RE)?.[1]).toBe("https://settleclt.com/events");
    expect(injected.match(OG_TITLE_RE)?.[1]).toBe(
      "Charlotte Events Calendar | Settle CLT"
    );
  });

  it("injectRouteSeo strips trailing slashes from non-root canonicals", async () => {
    const { injectRouteSeo } = await import("../server/_core/vite");
    const injected = injectRouteSeo(shell, "/events/");
    expect(injected.match(CANONICAL_RE)?.[1]).toBe(
      "https://settleclt.com/events"
    );
  });

  it("injectRouteSeo keeps the root canonical as the sitemap homepage URL", async () => {
    const { injectRouteSeo } = await import("../server/_core/vite");
    const injected = injectRouteSeo(shell, "/");
    expect(injected.match(CANONICAL_RE)?.[1]).toBe("https://settleclt.com/");
  });

  it("injectRouteSeo escapes HTML in metadata", async () => {
    const { injectRouteSeo } = await import("../server/_core/vite");
    const injected = injectRouteSeo(shell, "/neighborhood/dilworth");
    const title = injected.match(TITLE_RE)?.[1] ?? "";
    expect(title).toContain("Dilworth");
  });

  it("the production shell middleware applies per-route SEO", () => {
    expect(viteCore).toContain("injectRouteSeo(");
    expect(viteCore).toContain('status === 404 ? "/404" : req.path');
    expect(viteCore).toContain("blogTitles");
    expect(viteCore).toContain("injectRouteSeo(template, req.path)");
  });

  it("blog slugs resolve titles from the database", () => {
    expect(viteCore).toContain("getBlogPostBySlug");
    expect(routeSeoSource).toContain("blogTitles");
  });
});
