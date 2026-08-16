#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)

[[ $# -eq 5 ]] || {
  printf 'release error: usage: rollback-traffic.sh NGINX_SITE BACKUP_DIR UPSTREAM_HOST SLOT GIT_SHA\n' >&2
  exit 1
}

exec "$SCRIPT_DIR/switch-traffic.sh" "$@"
