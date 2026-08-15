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
[[ -d "$artifact_dir" ]] || fail "artifact directory does not exist"

manifest="$artifact_dir/dist/release-manifest.json"
[[ -f "$manifest" ]] || fail "artifact release manifest is missing"
node - "$manifest" "$git_sha" <<'NODE'
const fs = require("node:fs");
const [manifestPath, expectedSha] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (
  manifest.schemaVersion !== 1 ||
  manifest.app !== "settle-clt" ||
  manifest.gitSha !== expectedSha
) {
  throw new Error("artifact release manifest does not match the requested release");
}
NODE

mkdir -p -- "$release_root/releases"
release="$release_root/releases/$git_sha"
if [[ -e "$release" ]]; then
  diff -qr -- "$artifact_dir" "$release" >/dev/null || fail "existing release differs from artifact"
  printf 'release already prepared: %s\n' "$git_sha"
  exit 0
fi

staging="$release_root/releases/.staging-${git_sha}-$$"
cleanup() { rm -rf -- "$staging"; }
trap cleanup EXIT
mkdir -- "$staging"
cp -a -- "$artifact_dir/." "$staging/"
chmod -R a-w -- "$staging"
mv -- "$staging" "$release"
trap - EXIT
printf 'release prepared: %s\n' "$git_sha"
