import express from "express";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { injectRouteSeo, serveStatic } from "./_core/vite";

const cleanup: Array<() => void> = [];
afterEach(() => {
  while (cleanup.length) cleanup.pop()?.();
});

const SHELL = `<!doctype html>
<html lang="en">
  <head>
    <title>Settle CLT</title>
    <meta name="description" content="default description" />
    <meta property="og:title" content="Settle CLT" />
    <meta property="og:description" content="default description" />
    <meta property="og:url" content="https://settleclt.com/" />
    <link rel="canonical" href="https://settleclt.com/" />
  </head>
  <body></body>
</html>`;

async function startProductionShell() {
  const distRoot = mkdtempSync(join(tmpdir(), "settleclt-seo-"));
  const distPublic = join(distRoot, "public");
  mkdirSync(distPublic, { recursive: true });
  writeFileSync(join(distPublic, "index.html"), SHELL);
  // serveStatic resolves the shell relative to the dist root's public dir
  writeFileSync(join(distRoot, "index.html"), SHELL);

  const app = express();
  serveStatic(app, distPublic, {
    getPublishedBlog: async slug => ({ title: `Published ${slug}` }),
    tagExists: async () => true,
  });

  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  cleanup.push(() => {
    server.close();
    rmSync(distRoot, { recursive: true, force: true });
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing test address");
  return `http://127.0.0.1:${address.port}`;
}

describe("production SPA shell per-route SEO (integration)", () => {
  it("serves each sitemap route its own canonical and title", async () => {
    const base = await startProductionShell();
    const res = await fetch(`${base}/events`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain(
      '<link rel="canonical" href="https://settleclt.com/events" />'
    );
    expect(html).toContain(
      "<title>Charlotte Events Calendar | Settle CLT</title>"
    );
  });

  it.each(["/events/", "/events/?source=fixture"])(
    "normalizes the HTML and Link canonicals for %s",
    async requestPath => {
      const base = await startProductionShell();
      const res = await fetch(`${base}${requestPath}`);
      const html = await res.text();
      expect(res.status).toBe(200);
      expect(res.headers.get("link")).toBe(
        '<https://settleclt.com/events>; rel="canonical"'
      );
      expect(html).toContain(
        '<link rel="canonical" href="https://settleclt.com/events" />'
      );
      expect(html).toContain(
        '<meta property="og:url" content="https://settleclt.com/events" />'
      );
    }
  );

  it("normalizes query, hash, and trailing slash before direct metadata injection", () => {
    const html = injectRouteSeo(SHELL, "/events/?source=fixture#calendar");
    expect(html).toContain(
      '<link rel="canonical" href="https://settleclt.com/events" />'
    );
  });

  it("serves the directory route its own canonical and title", async () => {
    const base = await startProductionShell();
    const res = await fetch(`${base}/directory`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain(
      '<link rel="canonical" href="https://settleclt.com/directory" />'
    );
    expect(html).toContain(
      "<title>Charlotte Local Business Directory | Settle CLT</title>"
    );
  });

  it("uses req.originalUrl, not the Express-4 stripped req.path", async () => {
    const base = await startProductionShell();
    const res = await fetch(`${base}/neighborhood/dilworth`);
    const html = await res.text();
    expect(html).toContain(
      '<link rel="canonical" href="https://settleclt.com/neighborhood/dilworth" />'
    );
    expect(html).toContain(
      "<title>Dilworth: Guide to Living There | Settle CLT</title>"
    );
  });

  it("returns 404 with page-not-found metadata for unknown routes", async () => {
    const base = await startProductionShell();
    const res = await fetch(`${base}/this-page-does-not-exist`);
    const html = await res.text();
    expect(res.status).toBe(404);
    expect(html).toContain("<title>Page Not Found | Settle CLT</title>");
  });

  it("uses one published-blog lookup for status and title without exposing drafts", async () => {
    const distRoot = mkdtempSync(join(tmpdir(), "settleclt-blog-seo-"));
    mkdirSync(distRoot, { recursive: true });
    writeFileSync(join(distRoot, "index.html"), SHELL);
    const app = express();
    serveStatic(app, distRoot, {
      getPublishedBlog: async slug =>
        slug === "published-post" ? { title: "Published Fixture Title" } : null,
      tagExists: async () => true,
    });
    const server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    cleanup.push(() => {
      server.close();
      rmSync(distRoot, { recursive: true, force: true });
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test address");
    const base = `http://127.0.0.1:${address.port}`;

    const published = await fetch(`${base}/blog/published-post`);
    expect(published.status).toBe(200);
    expect(await published.text()).toContain(
      "<title>Published Fixture Title | Settle CLT</title>"
    );
    for (const slug of ["draft-post", "missing-post"]) {
      const response = await fetch(`${base}/blog/${slug}`);
      const html = await response.text();
      expect(response.status, slug).toBe(404);
      expect(response.headers.get("link"), slug).toBe(
        '<https://settleclt.com/404>; rel="canonical"'
      );
      expect(html, slug).not.toContain("Draft Fixture Title");
      expect(html, slug).toContain("<title>Page Not Found | Settle CLT</title>");
    }
  });

  it("serves malformed dynamic paths as a localized 404 shell without crashing", async () => {
    const base = await startProductionShell();
    for (const path of [
      "/neighborhood/%E0%A4%A",
      "/directory/category/%E0%A4%A",
      "/events/category/%E0%A4%A",
      "/directory/%E0%A4%A",
      "/blog/%E0%A4%A",
      "/tag/%E0%A4%A",
    ]) {
      const res = await fetch(`${base}${path}`, {
        headers: { cookie: "site_locale=es" },
      });
      const html = await res.text();
      expect(res.status, path).toBe(404);
      expect(html, path).toContain('<html lang="es">');
      expect(html, path).toContain(
        "<title>Página no encontrada | Settle CLT</title>"
      );
    }
  });

  it("keeps the homepage canonical matching the sitemap URL", async () => {
    const base = await startProductionShell();
    const res = await fetch(`${base}/`);
    const html = await res.text();
    expect(html).toContain(
      '<link rel="canonical" href="https://settleclt.com/" />'
    );
    expect(html).toContain(
      "<title>Your Complete Guide to Living in Charlotte, NC | Settle CLT</title>"
    );
  });

  it("serves Spanish business pricing metadata from the first response", async () => {
    const base = await startProductionShell();
    const res = await fetch(`${base}/business-pricing`, {
      headers: { cookie: "site_locale=es" },
    });
    const html = await res.text();
    expect(html).toContain('<html lang="es">');
    expect(html).toContain("<title>Precios para negocios de Settle CLT</title>");
    expect(res.headers.get("vary")).toContain("Cookie");
    expect(res.headers.get("vary")).toContain("Accept-Language");
  });

  it("honors weighted Accept-Language preferences without a locale cookie", async () => {
    const base = await startProductionShell();
    const res = await fetch(`${base}/business-pricing`, {
      headers: { "accept-language": "en;q=0.1, es;q=1" },
    });
    const html = await res.text();
    expect(html).toContain('<html lang="es">');
  });

  it("owns Spanish first-response metadata for referral intake", async () => {
    const base = await startProductionShell();
    const res = await fetch(`${base}/referrals`, {
      headers: { cookie: "site_locale=es" },
    });
    const html = await res.text();
    expect(html).toContain("<title>Referencias de negocios locales en Charlotte | Settle CLT</title>");
  });

  it("serves localized first-response metadata for business details", async () => {
    const base = await startProductionShell();
    const res = await fetch(`${base}/directory/amelie-s-french-bakery`, {
      headers: { cookie: "site_locale=es" },
    });
    const html = await res.text();
    expect(html).toContain('<html lang="es">');
    expect(html).not.toContain("reviews, details, and neighborhood info");
  });

  it.each([
    ["/newcomer-plan", "Plan para recién llegados a Charlotte"],
    ["/tag/food-drink", "Etiqueta Food Drink en Charlotte"],
  ])("serves Spanish Batch 5 metadata and preserves the %s canonical", async (path, title) => {
    const base = await startProductionShell();
    const res = await fetch(`${base}${path}`, {
      headers: { cookie: "site_locale=es" },
    });
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('<html lang="es">');
    expect(html).toContain(`<title>${title} | Settle CLT</title>`);
    expect(html).toContain(`<link rel="canonical" href="https://settleclt.com${path}" />`);
  });
});
