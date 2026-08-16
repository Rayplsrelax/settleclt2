#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 4 ]] || fail "usage: assign-slot.sh RELEASE_ROOT ACTIVE_UPSTREAM_LINK SLOT GIT_SHA"
release_root=$1
active_link=$2
slot=$3
git_sha=$4
require_slot "$slot"
require_release_sha "$git_sha"

release="$release_root/releases/$git_sha"
manifest="$release/dist/release-manifest.json"
[[ -d "$release" ]] || fail "release is not prepared"
[[ -f "$manifest" ]] || fail "release manifest is missing"
manifest_sha=$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).gitSha" "$manifest")
[[ "$manifest_sha" == "$git_sha" ]] || fail "release manifest does not match requested SHA"

slot_upstream="$release_root/traffic/upstreams/$slot.conf"
if [[ -L "$active_link" && -f "$slot_upstream" && "$active_link" -ef "$slot_upstream" ]]; then
  fail "refusing to reassign the active traffic slot"
fi

mkdir -p -- "$release_root/slots"
slot_link="$release_root/slots/$slot"
[[ ! -e "$slot_link" || -L "$slot_link" ]] || fail "slot exists but is not a symbolic link"
atomic_symlink "../releases/$git_sha" "$slot_link"

# The slot unit resolves its WorkingDirectory through this symlink at start;
# flipping it alone leaves the running process on the old release. Restart
# so the unit actually serves the newly assigned release.
systemctl restart "settleclt@$slot"
printf 'slot assigned: %s %s\n' "$slot" "$git_sha"