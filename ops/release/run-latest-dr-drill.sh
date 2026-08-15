#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 4 ]] || fail "usage: run-latest-dr-drill.sh BACKUP_ROOT DRILL_ROOT MYSQL_DEFAULTS_FILE EVIDENCE_ROOT"
backup_root=$1
drill_root=$2
defaults_file=$3
evidence_root=$4

shopt -s nullglob
backups=("$backup_root"/????????T??????Z-????????????)
(( ${#backups[@]} > 0 )) || fail "no backup directories found"
latest=""
for ((index = ${#backups[@]} - 1; index >= 0; index--)); do
  candidate=${backups[index]}
  [[ -d "$candidate" && ! -L "$candidate" ]] || continue
  [[ -f "$candidate/backup-evidence.json" && ! -L "$candidate/backup-evidence.json" ]] || continue
  status=$(node -p "try { JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).status } catch { '' }" "$candidate/backup-evidence.json")
  [[ "$status" == "verified" ]] || continue
  complete=1
  for artifact in database.sql.gz release.tar.gz shared.tar.gz SHA256SUMS backup-evidence.json; do
    [[ -f "$candidate/$artifact" && ! -L "$candidate/$artifact" ]] || complete=0
  done
  (( complete == 1 )) || continue
  if ! ( cd -- "$candidate" && sha256sum --strict -c SHA256SUMS >/dev/null ); then
    continue
  fi
  if ! validate_database_dump "$candidate/database.sql.gz" >/dev/null 2>&1; then
    continue
  fi
  latest=$candidate
  break
done
[[ -n "$latest" ]] || fail "no complete verified backup directories found"

date_stamp=$(date -u +%Y%m%d)
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p -- "$evidence_root"
exec "$SCRIPT_DIR/dr-restore-drill.sh" \
  "$latest" \
  "$drill_root" \
  "$defaults_file" \
  "settleclt_dr_${date_stamp}_scheduled" \
  "$evidence_root/$timestamp.json"
