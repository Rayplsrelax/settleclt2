#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 2 ]] || fail "usage: rollback-traffic.sh RELEASE_ROOT ACTIVE_UPSTREAM_LINK"
release_root=$1
active_link=$2
previous_link="$release_root/traffic/previous"
[[ -L "$previous_link" ]] || fail "previous traffic target is missing"

previous_target=$(readlink -- "$previous_link")
case "$(basename -- "$previous_target")" in
  blue.conf) slot=blue ;;
  green.conf) slot=green ;;
  *) fail "previous traffic target is invalid" ;;
esac

manifest="$release_root/slots/$slot/dist/release-manifest.json"
[[ -f "$manifest" ]] || fail "previous slot release manifest is missing"
git_sha=$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).gitSha" "$manifest")
require_release_sha "$git_sha"
exec "$SCRIPT_DIR/switch-traffic.sh" "$release_root" "$active_link" "$slot" "$git_sha"