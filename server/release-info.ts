import type { Express } from "express";
import { readFileSync } from "node:fs";

export type ReleaseManifest = {
  schemaVersion: 1;
  app: string;
  version: string;
  gitSha: string;
  builtAt: string;
};

function isReleaseManifest(value: unknown): value is ReleaseManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Record<string, unknown>;
  return (
    manifest.schemaVersion === 1 &&
    manifest.app === "settle-clt" &&
    typeof manifest.version === "string" &&
    manifest.version.length > 0 &&
    typeof manifest.gitSha === "string" &&
    /^[0-9a-f]{40}$/.test(manifest.gitSha) &&
    typeof manifest.builtAt === "string" &&
    !Number.isNaN(Date.parse(manifest.builtAt))
  );
}

export function loadReleaseManifest(
  manifestPath: string,
  isProduction: boolean
): ReleaseManifest {
  try {
    const manifest: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (isReleaseManifest(manifest)) return manifest;
  } catch {
    // Production fails closed below; development uses an explicit local marker.
  }

  if (isProduction) {
    throw new Error("Production release manifest is missing or invalid");
  }

  return {
    schemaVersion: 1,
    app: "settle-clt",
    version: "development",
    gitSha: "0000000000000000000000000000000000000000",
    builtAt: new Date(0).toISOString(),
  };
}

export function registerReleaseRoutes(
  app: Express,
  manifest: ReleaseManifest
): void {
  app.get("/api/version", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(manifest);
  });
}
