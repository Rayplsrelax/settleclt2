#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 4 ]] || fail "usage: switch-traffic.sh RELEASE_ROOT ACTIVE_UPSTREAM_LINK SLOT GIT_SHA"
release_root=$1
active_link=$2
slot=$3
git_sha=$4
require_slot "$slot"
require_release_sha "$git_sha"

slot_release="$release_root/slots/$slot"
[[ -L "$slot_release" ]] || fail "slot release link is missing"
[[ -f "$slot_release/dist/release-manifest.json" ]] || fail "slot release manifest is missing"
manifest_sha=$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).gitSha" "$slot_release/dist/release-manifest.json")
[[ "$manifest_sha" == "$git_sha" ]] || fail "slot release manifest does not match requested SHA"

candidate="$release_root/traffic/upstreams/$slot.conf"
[[ -f "$candidate" ]] || fail "slot upstream configuration is missing"
expected_upstream="server 127.0.0.1:$(slot_port "$slot");"
actual_upstream=$(tr -d '\r' < "$candidate" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
[[ "$actual_upstream" == "$expected_upstream" ]] || fail "slot upstream does not match its private port"
"$SCRIPT_DIR/smoke-slot.sh" "$slot" "$git_sha"

nginx_bin=${NGINX_BIN:-nginx}
previous_link="$release_root/traffic/previous"
old_active=""
old_previous=""
[[ ! -e "$active_link" || -L "$active_link" ]] || fail "active upstream exists but is not a symbolic link"
[[ ! -e "$previous_link" || -L "$previous_link" ]] || fail "previous upstream exists but is not a symbolic link"
[[ -L "$active_link" ]] && old_active=$(readlink -- "$active_link")
[[ -L "$previous_link" ]] && old_previous=$(readlink -- "$previous_link")

if [[ -L "$active_link" && "$active_link" -ef "$candidate" ]]; then
  "$nginx_bin" -t || fail "nginx rejected the active upstream"
  printf 'traffic already active: %s %s\n' "$slot" "$git_sha"
  exit 0
fi

restore_links() {
  if [[ -n "$old_active" ]]; then
    atomic_symlink "$old_active" "$active_link"
  else
    rm -f -- "$active_link"
  fi
  if [[ -n "$old_previous" ]]; then
    atomic_symlink "$old_previous" "$previous_link"
  else
    rm -f -- "$previous_link"
  fi
}

if [[ -n "$old_active" ]]; then
  atomic_symlink "$old_active" "$previous_link"
fi
atomic_symlink "$candidate" "$active_link"

if ! "$nginx_bin" -t; then
  restore_links
  fail "nginx rejected the candidate upstream"
fi
if ! "$nginx_bin" -s reload; then
  restore_links
  "$nginx_bin" -t && "$nginx_bin" -s reload || true
  fail "nginx reload failed; prior upstream restored"
fi

printf 'traffic switched: %s %s\n' "$slot" "$git_sha"