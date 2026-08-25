#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 3 ]] || fail "usage: prepare-release.sh RELEASE_ROOT ARTIFACT_DIR GIT_SHA"
release_root=$1
artifact_dir=$2
git_sha=$3
require_release_sha "$git_sha"
[[ -d "$artifact_dir" && ! -L "$artifact_dir" ]] || fail "artifact directory must be a real non-symlink directory"
verifier="$SCRIPT_DIR/../../scripts/verify-release-artifact.mjs"
[[ -f "$verifier" && ! -L "$verifier" ]] || fail "trusted artifact verifier is missing"
node_verifier=$(cygpath -w "$verifier" 2>/dev/null || printf '%s' "$verifier")

source_digest=$(node "$node_verifier" "$artifact_dir" "$git_sha") || fail "source artifact verification failed"
mkdir -p -- "$release_root/releases"
[[ -d "$release_root/releases" && ! -L "$release_root/releases" ]] || fail "releases root must be a real non-symlink directory"
release="$release_root/releases/$git_sha"
[[ ! -L "$release" ]] || fail "existing release SHA path must not be a symbolic link"
if [[ -e "$release" ]]; then
  [[ -d "$release" ]] || fail "existing release SHA path must be a real directory"
  existing_digest=$(node "$node_verifier" "$release" "$git_sha") || fail "existing release fails full artifact verification"
  [[ "$existing_digest" == "$source_digest" ]] || fail "existing release differs from the requested artifact manifest"
  printf 'release already prepared: %s\n' "$git_sha"
  exit 0
fi

staging="$release_root/releases/.staging-${git_sha}-$$"
cleanup() { chmod -R u+w -- "$staging" 2>/dev/null || true; rm -rf -- "$staging"; }
trap cleanup EXIT
mkdir -- "$staging"
# Copy first. The staged tree, not the mutable source pathname, is the object
# subsequently authenticated and published.
cp -a -- "$artifact_dir/." "$staging/"
staged_digest=$(node "$node_verifier" "$staging" "$git_sha") || fail "staged artifact verification failed after copy"
[[ "$staged_digest" == "$source_digest" ]] || fail "staged artifact manifest digest changed during copy"
chmod -R a-w -- "$staging"
# Verify again after permissions are finalized and immediately before rename.
final_digest=$(node "$node_verifier" "$staging" "$git_sha") || fail "read-only staged artifact verification failed"
[[ "$final_digest" == "$source_digest" ]] || fail "read-only staged artifact digest mismatch"
mv -T -- "$staging" "$release"
trap - EXIT
printf 'release prepared: %s\n' "$git_sha"
