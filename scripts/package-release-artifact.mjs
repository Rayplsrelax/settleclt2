import { cpSync, mkdirSync, rmSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const artifact = resolve(root, "release-artifact");
const dist = resolve(root, "dist");
const releaseOps = resolve(root, "ops", "release");

if (!statSync(resolve(dist, "release-manifest.json")).isFile()) {
  throw new Error("dist/release-manifest.json must exist before packaging");
}

rmSync(artifact, { recursive: true, force: true });
mkdirSync(artifact, { recursive: true });
cpSync(dist, resolve(artifact, "dist"), { recursive: true });
cpSync(releaseOps, resolve(artifact, "ops", "release"), { recursive: true });
console.log("Packaged dist and release operations into release-artifact");
