#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 2 ]] || fail "usage: preflight-release.sh RELEASE_ROOT GIT_SHA"
release_root=$1
git_sha=$2
require_release_sha "$git_sha"
[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL must be supplied through the protected environment"
[[ "${EXPECTED_DATABASE_TARGET_SHA256:-}" =~ ^[0-9a-f]{64}$ ]] || fail "EXPECTED_DATABASE_TARGET_SHA256 must be supplied through the protected environment as 64 lowercase hexadecimal characters"
release="$release_root/releases/$git_sha"
migrations="$release/migrations"
runner="$migrations/bin/preflight-release.mjs"
verifier="$SCRIPT_DIR/../../scripts/verify-release-artifact.mjs"
[[ -d "$release" && ! -L "$release" ]] || fail "release must be a real non-symlink directory"
[[ -d "$migrations" && ! -L "$migrations" ]] || fail "packaged migrations must be a real non-symlink directory"
[[ -f "$runner" && ! -L "$runner" ]] || fail "packaged preflight runner must be a regular non-symlink file"
[[ -f "$verifier" && ! -L "$verifier" ]] || fail "trusted artifact verifier is missing"
node_verifier=$(cygpath -w "$verifier" 2>/dev/null || printf '%s' "$verifier")
node_runner=$(cygpath -w "$runner" 2>/dev/null || printf '%s' "$runner")
node "$node_verifier" "$release" "$git_sha" >/dev/null || fail "full prepared artifact verification failed before preflight"
MIGRATIONS_ROOT="$migrations" \
RELEASE_ARTIFACT_ROOT="$release" \
RELEASE_GIT_SHA="$git_sha" \
node "$node_runner"
