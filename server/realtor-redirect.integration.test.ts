import express from "express";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { registerLegacySpaRedirects, serveStatic } from "./_core/vite";

const cleanup: Array<() => void> = [];
afterEach(() => {
  while (cleanup.length) cleanup.pop()?.();
});

const SHELL = `<!doctype html><html lang="en"><head><title>Settle CLT</title><meta name="description" content="default" /><meta property="og:title" content="Settle CLT" /><meta property="og:description" content="default" /><meta property="og:url" content="https://settleclt.com/" /><link rel="canonical" href="https://settleclt.com/" /></head><body>shell</body></html>`;

async function listen(app: express.Express) {
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  cleanup.push(() => server.close());
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing address");
  return `http://127.0.0.1:${address.port}`;
}

async function assertRedirect(base: string) {
  const response = await fetch(`${base}/find-a-realtor`, { redirect: "manual" });
  expect([301, 308]).toContain(response.status);
  expect(response.headers.get("location")).toBe("/find-your-home");
  expect(response.headers.get("link")).toBe(
    '<https://settleclt.com/find-your-home>; rel="canonical"'
  );
  const body = await response.text();
  expect(body).not.toContain("<!doctype html>");
  expect(body).not.toContain("shell");
}

describe("legacy realtor server redirect", () => {
  it("redirects before a dev-style SPA fallback and serves the destination canonical", async () => {
    const app = express();
    registerLegacySpaRedirects(app);
    app.use((req, res) => {
      res.type("html").send(
        req.path === "/find-your-home"
          ? SHELL.replace(
              '<link rel="canonical" href="https://settleclt.com/" />',
              '<link rel="canonical" href="https://settleclt.com/find-your-home" />'
            )
          : SHELL
      );
    });
    const base = await listen(app);
    await assertRedirect(base);
    const destination = await fetch(`${base}/find-your-home`);
    expect(await destination.text()).toContain(
      '<link rel="canonical" href="https://settleclt.com/find-your-home" />'
    );
  });

  it("redirects before the production static shell and destination canonical is authoritative", async () => {
    const dist = mkdtempSync(join(tmpdir(), "settleclt-redirect-"));
    mkdirSync(dist, { recursive: true });
    writeFileSync(join(dist, "index.html"), SHELL);
    cleanup.push(() => rmSync(dist, { recursive: true, force: true }));
    const app = express();
    serveStatic(app, dist, {
      getPublishedBlog: async slug => ({ title: slug }),
      tagExists: async () => true,
    });
    const base = await listen(app);
    await assertRedirect(base);
    const destination = await fetch(`${base}/find-your-home`);
    expect(await destination.text()).toContain(
      '<link rel="canonical" href="https://settleclt.com/find-your-home" />'
    );
  });
});
