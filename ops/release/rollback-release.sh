#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 1 ]] || fail "usage: rollback-release.sh RELEASE_ROOT"
release_root=$1
[[ -L "$release_root/current" ]] || fail "current release link is missing"
[[ -L "$release_root/previous" ]] || fail "previous release link is missing"

current_target=$(readlink -- "$release_root/current")
previous_target=$(readlink -- "$release_root/previous")
[[ "$current_target" == releases/* ]] || fail "current release target is invalid"
[[ "$previous_target" == releases/* ]] || fail "previous release target is invalid"
[[ -d "$release_root/$current_target" ]] || fail "current release directory is missing"
[[ -d "$release_root/$previous_target" ]] || fail "previous release directory is missing"
[[ "$current_target" != "$previous_target" ]] || fail "current and previous point to the same release"

atomic_symlink "$previous_target" "$release_root/current"
atomic_symlink "$current_target" "$release_root/previous"
printf 'release rolled back: %s\n' "${previous_target#releases/}"
