#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 2 ]] || fail "usage: smoke-slot.sh SLOT GIT_SHA"
slot=$1
git_sha=$2
require_slot "$slot"
require_release_sha "$git_sha"

port=$(slot_port "$slot")
curl_bin=${CURL_BIN:-curl}
base_url="http://127.0.0.1:$port"
manifest=$(
  "$curl_bin" --fail --silent --show-error --max-time 10 \
    "$base_url/api/version"
)
node - "$git_sha" "$manifest" <<'NODE'
const [expectedSha, rawManifest] = process.argv.slice(2);
const manifest = JSON.parse(rawManifest);
if (
  manifest.schemaVersion !== 1 ||
  manifest.app !== "settle-clt" ||
  manifest.gitSha !== expectedSha
) {
  throw new Error("private slot returned an unexpected release manifest");
}
NODE

"$curl_bin" --fail --silent --show-error --max-time 10 \
  "$base_url/health/ready" >/dev/null

homepage=$(
  "$curl_bin" --fail --silent --show-error --max-time 10 \
    "$base_url/"
)
[[ "$homepage" == *"<"* ]] || fail "private slot homepage response is empty or invalid"
printf 'slot smoke passed: %s %s\n' "$slot" "$git_sha"