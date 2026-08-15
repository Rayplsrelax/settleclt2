import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const gitSha = (
  process.env.RELEASE_GIT_SHA ??
  execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" })
).trim().toLowerCase();
const builtAt = process.env.RELEASE_BUILT_AT ?? new Date().toISOString();

if (!/^[0-9a-f]{40}$/.test(gitSha)) {
  throw new Error("RELEASE_GIT_SHA must be a full 40-character commit SHA");
}
if (Number.isNaN(Date.parse(builtAt))) {
  throw new Error("RELEASE_BUILT_AT must be an ISO-8601 timestamp");
}

const manifest = {
  schemaVersion: 1,
  app: packageJson.name,
  version: packageJson.version,
  gitSha,
  builtAt,
};
const dist = resolve(root, "dist");
const target = resolve(dist, "release-manifest.json");
const temporary = `${target}.tmp`;
mkdirSync(dist, { recursive: true });
writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`, {
  encoding: "utf8",
  mode: 0o644,
});
renameSync(temporary, target);
console.log(`Wrote release manifest for ${gitSha}`);
