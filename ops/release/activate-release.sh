#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 2 ]] || fail "usage: activate-release.sh RELEASE_ROOT GIT_SHA"
release_root=$1
git_sha=$2
require_release_sha "$git_sha"
[[ "${EXPECTED_DATABASE_TARGET_SHA256:-}" =~ ^[0-9a-f]{64}$ ]] || fail "EXPECTED_DATABASE_TARGET_SHA256 must be supplied through the protected environment as 64 lowercase hexadecimal characters"
[[ -d "$release_root/releases/$git_sha" ]] || fail "release is not prepared"
release="$release_root/releases/$git_sha"
verifier="$SCRIPT_DIR/../../scripts/verify-release-artifact.mjs"
[[ -f "$verifier" && ! -L "$verifier" ]] || fail "trusted artifact verifier is missing"
node_verifier=$(cygpath -w "$verifier" 2>/dev/null || printf '%s' "$verifier")
artifact_manifest_digest=$(node "$node_verifier" "$release" "$git_sha") || fail "full prepared artifact verification failed"

migration_manifest="$release_root/releases/$git_sha/migrations/manifest.json"
migration_gate="$release_root/migration-gates/$git_sha.json"
[[ -f "$migration_manifest" && ! -L "$migration_manifest" ]] || fail "release migration manifest is missing"
[[ -f "$migration_gate" && ! -L "$migration_gate" ]] || fail "migration gate evidence is missing"
node - "$migration_manifest" "$migration_gate" "$git_sha" "$artifact_manifest_digest" <<'NODE'
const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
const [manifestPath, gatePath, expectedSha, expectedArtifactManifestDigest] = process.argv.slice(2);
const expectedDatabaseTargetSha256 = process.env.EXPECTED_DATABASE_TARGET_SHA256;
const contained = (root, candidate) => {
  const rel = path.relative(root, candidate);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
};
const requireRealDirectory = (candidate, label) => {
  const absolute = path.resolve(candidate);
  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink() || !stat.isDirectory() || path.resolve(fs.realpathSync.native(absolute)) !== absolute) {
    throw new Error(`${label} must be a real non-symlink directory`);
  }
  return absolute;
};
const same = (left, right) => left.dev === right.dev && left.ino === right.ino && left.size === right.size && left.mtimeMs === right.mtimeMs;
const readRegular = (candidate, root, label) => {
  const absolute = path.resolve(candidate);
  if (!contained(root, absolute)) throw new Error(`${label} escapes containment`);
  let cursor = root;
  const parts = path.relative(root, absolute).split(path.sep);
  for (const part of parts.slice(0, -1)) {
    cursor = path.resolve(cursor, part);
    const parent = fs.lstatSync(cursor);
    if (parent.isSymbolicLink() || !parent.isDirectory()) throw new Error(`${label} has a symlinked parent`);
  }
  const before = fs.lstatSync(absolute);
  if (before.isSymbolicLink() || !before.isFile()) throw new Error(`${label} must be a regular non-symlink file`);
  const realBefore = fs.realpathSync.native(absolute);
  if (!contained(root, realBefore) || path.resolve(realBefore) !== absolute) throw new Error(`${label} fails realpath containment`);
  const descriptor = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const opened = fs.fstatSync(descriptor);
    if (!opened.isFile() || !same(before, opened)) throw new Error(`${label} was retargeted before open`);
    const bytes = fs.readFileSync(descriptor);
    const after = fs.lstatSync(absolute);
    const realAfter = after.isSymbolicLink() ? null : fs.realpathSync.native(absolute);
    if (after.isSymbolicLink() || !after.isFile() || realAfter === null || path.resolve(realAfter) !== absolute || !contained(root, realAfter) || !same(before, after) || !same(before, fs.fstatSync(descriptor))) {
      throw new Error(`${label} was retargeted while reading`);
    }
    return bytes;
  } finally {
    fs.closeSync(descriptor);
  }
};
const migrationRoot = requireRealDirectory(path.dirname(manifestPath), "release migrations directory");
const releaseDirectory = requireRealDirectory(path.dirname(migrationRoot), "release directory");
if (!contained(releaseDirectory, migrationRoot)) throw new Error("release migrations escape the release directory");
const gateRoot = requireRealDirectory(path.dirname(gatePath), "migration gate directory");
const manifest = JSON.parse(readRegular(manifestPath, migrationRoot, "release migration manifest").toString("utf8"));
const gate = JSON.parse(readRegular(gatePath, gateRoot, "migration gate evidence").toString("utf8"));
const validHash = value => /^[0-9a-f]{64}$/.test(String(value));
const validEngineVersion = value => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._+:-]{0,127}$/.test(value);
const validCanonicalSqlMode = value => {
  if (typeof value !== "string" || value.length < 1 || value.length > 1024) return false;
  const tokens = value.split(",");
  return tokens.every(token => /^[A-Z][A-Z0-9_]{0,63}$/.test(token)) &&
    new Set(tokens).size === tokens.length &&
    [...tokens].sort().join(",") === value;
};
const requiredInputs = new Set([
  "drizzle/meta/_journal.json",
  `drizzle/${manifest.journalTip?.tag}.sql`,
  "scripts/apply-release-migrations.mjs",
  "scripts/migration-artifact-lib.mjs",
  "scripts/migration-schema-lib.mjs",
  "scripts/release-database-safety-lib.mjs",
  "bin/apply-release-migrations.mjs",
  "scripts/preflight-migration-state.mjs",
  "scripts/verify-migration-ledger.mjs",
  "package.json",
  "pnpm-lock.yaml",
]);
if (
  manifest.schemaVersion !== 1 ||
  manifest.releaseGitSha !== expectedSha ||
  !manifest.journalTip ||
  !validHash(manifest.journalTip.hash) ||
  !validHash(manifest.requiredSchemaFingerprint) ||
  !Array.isArray(manifest.files) ||
  manifest.files.length === 0
) {
  throw new Error("release migration manifest is invalid");
}
const seen = new Set();
for (const file of manifest.files) {
  if (
    typeof file.path !== "string" ||
    file.path.includes("\\") ||
    file.path.split("/").some(part => !part || part === "." || part === "..") ||
    !validHash(file.sha256) ||
    seen.has(file.path)
  ) {
    throw new Error("release migration manifest contains an invalid input");
  }
  seen.add(file.path);
  const input = path.resolve(migrationRoot, ...file.path.split("/"));
  if (!contained(migrationRoot, input) || input === migrationRoot) {
    throw new Error("release migration input escapes the immutable release");
  }
  const actual = crypto.createHash("sha256").update(readRegular(input, migrationRoot, `immutable migration input ${file.path}`)).digest("hex");
  if (actual !== file.sha256) {
    throw new Error(`immutable migration input hash mismatch: ${file.path}`);
  }
}
for (const required of requiredInputs) {
  if (!seen.has(required)) throw new Error(`required immutable migration input is missing: ${required}`);
}
const tipInput = manifest.files.find(file => file.path === `drizzle/${manifest.journalTip.tag}.sql`);
if (tipInput.sha256 !== manifest.journalTip.hash) {
  throw new Error("journal tip hash does not match its immutable migration input");
}
if (
  gate.schemaVersion !== 1 ||
  gate.releaseGitSha !== expectedSha ||
  gate.journalTip?.tag !== manifest.journalTip.tag ||
  Number(gate.journalTip?.when) !== Number(manifest.journalTip.when) ||
  gate.journalTip?.hash !== manifest.journalTip.hash ||
  gate.requiredSchemaFingerprint !== manifest.requiredSchemaFingerprint ||
  gate.artifactManifestDigest !== expectedArtifactManifestDigest ||
  !validHash(gate.databaseTargetSha256) ||
  gate.databaseTargetSha256 !== expectedDatabaseTargetSha256 ||
  !validEngineVersion(gate.engineVersion) ||
  !validCanonicalSqlMode(gate.sqlMode) ||
  Number.isNaN(Date.parse(gate.verifiedAt))
) {
  throw new Error("migration gate evidence does not match the immutable release");
}
NODE

# Descriptor-verify every deployable byte again immediately before changing
# release pointers. This catches post-gate mutation of dist, ops, migrations,
# or either manifest.
final_artifact_manifest_digest=$(node "$node_verifier" "$release" "$git_sha") || fail "full prepared artifact verification failed immediately before activation"
[[ "$final_artifact_manifest_digest" == "$artifact_manifest_digest" ]] || fail "artifact manifest digest changed before activation"

mkdir -p -- "$release_root"
new_target=$(release_target "$git_sha")
if [[ -L "$release_root/current" ]]; then
  current_target=$(readlink -- "$release_root/current")
  if [[ "$current_target" == "$new_target" ]]; then
    printf 'release already active: %s\n' "$git_sha"
    exit 0
  fi
  [[ -d "$release_root/$current_target" ]] || fail "current release target is invalid"
  atomic_symlink "$current_target" "$release_root/previous"
elif [[ -e "$release_root/current" ]]; then
  fail "current exists but is not a symbolic link"
fi

atomic_symlink "$new_target" "$release_root/current"
printf 'release activated: %s\n' "$git_sha"
printf 'warning: rollback requires application compatibility with the migrated schema; activation does not reverse migrations\n'
