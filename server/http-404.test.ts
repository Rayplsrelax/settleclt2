import express from "express";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveSpaStatus } from "./_core/spa-route-status";

const cleanup: Array<() => void> = [];
afterEach(() => {
  while (cleanup.length) cleanup.pop()?.();
});

async function requestProductionFallback(path: string) {
  const distRoot = mkdtempSync(join(tmpdir(), "settleclt-404-"));
  const distPublic = join(distRoot, "public");
  mkdirSync(distPublic, { recursive: true });
  writeFileSync(
    join(distPublic, "index.html"),
    "<!doctype html><title>Settle CLT</title>"
  );

  const app = express();
  app.use(express.static(distPublic));

  const { resolveSpaStatus, getProductionLookups } = await import(
    "./_core/spa-route-status"
  );
  app.use("*", async (req, res) => {
    let lookups;
    try {
      lookups = await getProductionLookups();
    } catch {
      // no DB available — optimistic
    }
    const status = await resolveSpaStatus(req.originalUrl, lookups);
    res.status(status).sendFile(join(distPublic, "index.html"));
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
  return fetch(`http://127.0.0.1:${address.port}${path}`, {
    headers: { Accept: "text/html" },
  });
}

describe("SPA HTTP status resolution", () => {
  it("recognizes static routes and rejects unknown root paths", async () => {
    await expect(resolveSpaStatus("/")).resolves.toBe(200);
    await expect(resolveSpaStatus("/events")).resolves.toBe(200);
    await expect(resolveSpaStatus("/find-a-realtor")).resolves.toBe(301);
    await expect(resolveSpaStatus("/hermes-phase8-missing")).resolves.toBe(404);
    await expect(resolveSpaStatus("/404")).resolves.toBe(200);
  });

  it("validates data-backed route families", async () => {
    await expect(resolveSpaStatus("/neighborhood/south-end")).resolves.toBe(
      200
    );
    await expect(
      resolveSpaStatus("/neighborhood/not-a-real-neighborhood")
    ).resolves.toBe(404);
    await expect(
      resolveSpaStatus("/directory/category/plumbers")
    ).resolves.toBe(200);
    await expect(
      resolveSpaStatus("/directory/category/not-a-real-category")
    ).resolves.toBe(404);
    await expect(resolveSpaStatus("/events/category/festivals")).resolves.toBe(
      200
    );
    await expect(
      resolveSpaStatus("/events/category/not-a-real-category")
    ).resolves.toBe(404);
    await expect(resolveSpaStatus("/directory/at-t-fiber")).resolves.toBe(200);
    await expect(
      resolveSpaStatus("/directory/not-a-real-business")
    ).resolves.toBe(404);
  });

  it("uses injected lookups for database-backed slugs", async () => {
    const lookups = {
      blogExists: async (slug: string) => slug === "known-post",
      tagExists: async (slug: string) => slug === "known-tag",
    };

    await expect(resolveSpaStatus("/blog/known-post", lookups)).resolves.toBe(
      200
    );
    await expect(resolveSpaStatus("/blog/missing-post", lookups)).resolves.toBe(
      404
    );
    await expect(resolveSpaStatus("/tag/known-tag", lookups)).resolves.toBe(
      200
    );
    await expect(resolveSpaStatus("/tag/missing-tag", lookups)).resolves.toBe(
      404
    );
  });

  it("serves the SPA shell with the resolved production status", async () => {
    const known = await requestProductionFallback("/events");
    expect(known.status).toBe(200);
    expect(await known.text()).toContain("Settle CLT");

    const missing = await requestProductionFallback("/hermes-phase8-missing");
    expect(missing.status).toBe(404);
    expect(await missing.text()).toContain("Settle CLT");
  });
});
