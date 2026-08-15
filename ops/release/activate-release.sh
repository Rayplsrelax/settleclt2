#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 2 ]] || fail "usage: activate-release.sh RELEASE_ROOT GIT_SHA"
release_root=$1
git_sha=$2
require_release_sha "$git_sha"
[[ -d "$release_root/releases/$git_sha" ]] || fail "release is not prepared"

mkdir -p -- "$release_root"
new_target=$(release_target "$git_sha")
if [[ -L "$release_root/current" ]]; then
  current_target=$(readlink -- "$release_root/current")
  if [[ "$current_target" == "$new_target" ]]; then
    printf 'release already active: %s\n' "$git_sha"
    exit 0
  fi
  [[ -d "$release_root/$current_target" ]] || fail "current release target is invalid"
  atomic_symlink "$current_target" "$release_root/previous"
elif [[ -e "$release_root/current" ]]; then
  fail "current exists but is not a symbolic link"
fi

atomic_symlink "$new_target" "$release_root/current"
printf 'release activated: %s\n' "$git_sha"
