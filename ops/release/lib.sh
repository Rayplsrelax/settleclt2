#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'release error: %s\n' "$*" >&2
  exit 1
}

require_release_sha() {
  [[ "$1" =~ ^[0-9a-f]{40}$ ]] || fail "release SHA must be 40 lowercase hexadecimal characters"
}

atomic_symlink() {
  local target=$1
  local link=$2
  local temporary="${link}.tmp.$$"
  rm -f -- "$temporary"
  ln -s -- "$target" "$temporary"
  mv -Tf -- "$temporary" "$link"
}

release_target() {
  printf 'releases/%s' "$1"
}

require_slot() {
  [[ "$1" == "blue" || "$1" == "green" ]] || fail "slot must be blue or green"
}

slot_port() {
  case "$1" in
    blue) printf '%s' "${SLOT_PORT_BLUE:-3002}" ;;
    green) printf '%s' "${SLOT_PORT_GREEN:-3003}" ;;
    *) fail "slot must be blue or green" ;;
  esac
}
