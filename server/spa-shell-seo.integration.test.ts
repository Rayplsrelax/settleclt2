import express from "express";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { serveStatic } from "./_core/vite";

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
  serveStatic(app, distPublic);

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
});
