#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 2 ]] || fail "usage: migrate-release.sh RELEASE_ROOT GIT_SHA"
release_root=$1
git_sha=$2
require_release_sha "$git_sha"
[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL must be supplied through the protected environment"
[[ "${EXPECTED_DATABASE_TARGET_SHA256:-}" =~ ^[0-9a-f]{64}$ ]] || fail "EXPECTED_DATABASE_TARGET_SHA256 must be supplied through the protected environment as 64 lowercase hexadecimal characters"
release="$release_root/releases/$git_sha"
migrations="$release/migrations"
runner="$migrations/bin/apply-release-migrations.mjs"
manifest="$migrations/manifest.json"
verifier="$SCRIPT_DIR/../../scripts/verify-release-artifact.mjs"
[[ -d "$release" && ! -L "$release" ]] || fail "release must be a real non-symlink directory"
[[ -d "$migrations" && ! -L "$migrations" ]] || fail "packaged migrations must be a real non-symlink directory"
[[ -f "$runner" && ! -L "$runner" ]] || fail "packaged migration runner must be a regular non-symlink file"
[[ -f "$manifest" && ! -L "$manifest" ]] || fail "packaged migration manifest must be a regular non-symlink file"
[[ -f "$verifier" && ! -L "$verifier" ]] || fail "trusted artifact verifier is missing"
node_verifier=$(cygpath -w "$verifier" 2>/dev/null || printf '%s' "$verifier")
artifact_manifest_digest=$(node "$node_verifier" "$release" "$git_sha") || fail "full prepared artifact verification failed before migration"
node - "$release" "$migrations" "$runner" "$manifest" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const [release, migrations, runner, manifest] = process.argv.slice(2).map(value => path.resolve(value));
for (const [candidate, kind, label] of [
  [release, "directory", "release"],
  [migrations, "directory", "packaged migrations"],
  [runner, "file", "migration runner"],
  [manifest, "file", "migration manifest"],
]) {
  const stat = fs.lstatSync(candidate);
  if (stat.isSymbolicLink() || (kind === "directory" ? !stat.isDirectory() : !stat.isFile())) {
    throw new Error(`${label} must be a real non-symlink ${kind}`);
  }
  if (path.resolve(fs.realpathSync.native(candidate)) !== candidate) throw new Error(`${label} fails realpath containment`);
}
const rel = path.relative(release, migrations);
if (!rel || rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) throw new Error("packaged migrations escape release");
for (const candidate of [runner, manifest]) {
  const member = path.relative(migrations, candidate);
  if (!member || member === ".." || member.startsWith(`..${path.sep}`) || path.isAbsolute(member)) throw new Error("packaged migration member escapes release");
}
NODE

mkdir -p -m 700 -- "$release_root/migration-gates"
[[ ! -L "$release_root/migration-gates" ]] || fail "migration gate directory must not be a symbolic link"
gate_path="$release_root/migration-gates/$git_sha.json"
[[ ! -L "$gate_path" ]] || fail "migration gate evidence path must not be a symbolic link"
MIGRATIONS_ROOT="$migrations" \
RELEASE_ARTIFACT_ROOT="$release" \
RELEASE_GIT_SHA="$git_sha" \
EXPECTED_ARTIFACT_MANIFEST_DIGEST="$artifact_manifest_digest" \
MIGRATION_GATE_PATH="$gate_path" \
node "$runner"
