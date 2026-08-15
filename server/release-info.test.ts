import express from "express";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  loadReleaseManifest,
  registerReleaseRoutes,
  type ReleaseManifest,
} from "./release-info";

const manifest: ReleaseManifest = {
  schemaVersion: 1,
  app: "settle-clt",
  version: "1.0.0",
  gitSha: "0123456789abcdef0123456789abcdef01234567",
  builtAt: "2026-08-14T20:00:00.000Z",
};

describe("release information routes", () => {
  it("returns immutable non-sensitive build identity without caching", async () => {
    const app = express();
    registerReleaseRoutes(app, manifest);

    const response = await request(app).get("/api/version").expect(200);

    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toEqual(manifest);
  });

  it("loads a validated immutable manifest in production", () => {
    const directory = mkdtempSync(join(tmpdir(), "settleclt-release-"));
    const manifestPath = join(directory, "release-manifest.json");
    writeFileSync(manifestPath, JSON.stringify(manifest));

    try {
      expect(loadReleaseManifest(manifestPath, true)).toEqual(manifest);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("refuses to start production without a release manifest", () => {
    expect(() => loadReleaseManifest("missing-release-manifest.json", true)).toThrow(
      "Production release manifest is missing or invalid"
    );
  });
});
