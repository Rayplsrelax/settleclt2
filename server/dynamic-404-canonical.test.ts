import express from "express";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { hydratedDynamicCanonicalPath } from "../client/src/lib/dynamic-canonical";
import { serveStatic } from "./_core/vite";

const cleanup: Array<() => void> = [];
afterEach(() => {
  while (cleanup.length) cleanup.pop()?.();
});

const SHELL = `<!doctype html><html lang="en"><head><title>Settle CLT</title><meta name="description" content="default" /><meta property="og:title" content="Settle CLT" /><meta property="og:description" content="default" /><meta property="og:url" content="https://settleclt.com/" /><link rel="canonical" href="https://settleclt.com/" /></head><body>shell</body></html>`;

async function startMissingShell() {
  const dist = mkdtempSync(join(tmpdir(), "settleclt-dynamic-404-"));
  mkdirSync(dist, { recursive: true });
  writeFileSync(join(dist, "index.html"), SHELL);
  const app = express();
  app.use((req, res, next) => {
    res.setHeader(
      "Link",
      `<https://settleclt.com${req.path}>; rel=\"canonical\"`
    );
    next();
  });
  serveStatic(app, dist, {
    getPublishedBlog: async () => null,
    tagExists: async () => false,
  });
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  cleanup.push(() => {
    server.close();
    rmSync(dist, { recursive: true, force: true });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing address");
  return `http://127.0.0.1:${address.port}`;
}

describe("one dynamic 404 canonical policy", () => {
  it.each([
    "/neighborhood/not-a-neighborhood",
    "/blog/not-a-post",
    "/tag/not-a-tag",
    "/directory/not-a-business",
  ])("serves missing %s with HTTP 404 and /404 canonical", async path => {
    const base = await startMissingShell();
    const response = await fetch(`${base}${path}`);
    const html = await response.text();
    expect(response.status).toBe(404);
    expect(response.headers.get("link")).toBe(
      '<https://settleclt.com/404>; rel="canonical"'
    );
    expect(html).toContain('<link rel="canonical" href="https://settleclt.com/404" />');
    expect(html).toContain('<meta property="og:url" content="https://settleclt.com/404" />');
    expect(html).not.toContain(`rel="canonical" href="https://settleclt.com${path}"`);
  });

  it("keeps resource canonical while loading/found and switches only missing resources to /404", () => {
    expect(hydratedDynamicCanonicalPath("/blog/fixture", "loading")).toBe("/blog/fixture");
    expect(hydratedDynamicCanonicalPath("/blog/fixture", "found")).toBe("/blog/fixture");
    expect(hydratedDynamicCanonicalPath("/blog/fixture", "missing")).toBe("/404");
  });

  it("uses the shared hydrated policy in all four dynamic components without nested SEO effects", () => {
    const files = [
      "NeighborhoodDetail.tsx",
      "BlogArticle.tsx",
      "TagPage.tsx",
      "BusinessDetail.tsx",
    ];
    for (const file of files) {
      const source = readFileSync(
        new URL(`../client/src/pages/${file}`, import.meta.url),
        "utf8"
      );
      expect(source, file).toContain("hydratedDynamicCanonicalPath(");
      expect(source, file).not.toContain("return <NotFound />");
    }
  });
});
