#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"
umask 027

[[ $# -eq 5 ]] || fail "usage: create-backup.sh RELEASE_ROOT BACKUP_ROOT MYSQL_DEFAULTS_FILE DATABASE_NAME RETENTION_DAYS"
release_root=$1
backup_root=$2
defaults_file=$3
database_name=$4
retention_days=$5
mysqldump_bin=${MYSQLDUMP_BIN:-mysqldump}
timestamp=${BACKUP_TIMESTAMP:-$(date -u +%Y%m%dT%H%M%SZ)}

[[ "$database_name" =~ ^[A-Za-z0-9_]+$ ]] || fail "invalid database name"
[[ "$retention_days" =~ ^[1-9][0-9]*$ ]] && (( retention_days <= 3650 )) || fail "retention days must be between 1 and 3650"
[[ -f "$defaults_file" && ! -L "$defaults_file" ]] || fail "MySQL defaults file must be a regular non-symlink file"
permissions=$(stat -c '%a' -- "$defaults_file")
if [[ ${NODE_ENV:-} != "test" || ${BACKUP_TEST_ALLOW_INSECURE_DEFAULTS:-0} != "1" ]]; then
  (( (8#$permissions & 077) == 0 )) || fail "MySQL defaults file must not be group/world accessible"
fi
[[ -L "$release_root/current" ]] || fail "current release link is missing"
[[ -d "$release_root/shared" ]] || fail "shared data directory is missing"
[[ -d "$release_root/shared/public/manus-storage" ]] || fail "persistent runtime storage directory is missing"

current_target=$(readlink -- "$release_root/current")
git_sha=$(basename -- "$current_target")
require_release_sha "$git_sha"
releases_root="$release_root/releases"
current_release="$releases_root/$git_sha"
[[ -d "$current_release" && "$release_root/current" -ef "$current_release" ]] || fail "current release points outside the release root"
while IFS= read -r -d '' source_path; do
  [[ "$source_path" != *$'\n'* && "$source_path" != *$'\r'* ]] || fail "backup input contains an unsafe filename"
done < <(find "$release_root/shared" "$current_release" -mindepth 1 -print0)
manifest="$current_release/dist/release-manifest.json"
[[ -f "$manifest" ]] || fail "active release manifest is missing"
manifest_sha=$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).gitSha" "$manifest")
[[ "$manifest_sha" == "$git_sha" ]] || fail "active release manifest SHA mismatch"

mkdir -p -- "$backup_root"
backup_root_real=$(cd -- "$backup_root" && pwd -P)
shared_real=$(cd -- "$release_root/shared" && pwd -P)
releases_real=$(cd -- "$releases_root" && pwd -P)
case "$backup_root_real/" in
  "$shared_real/"*|"$releases_real/"*) fail "backup root must be outside release and shared data" ;;
esac
lock="$backup_root/.backup.lock"
mkdir -- "$lock" 2>/dev/null || fail "another backup is already running"
staging="$backup_root/.staging-$timestamp-$$"
final="$backup_root/$timestamp-${git_sha:0:12}"
cleanup() {
  rm -rf -- "$staging"
  rmdir -- "$lock" 2>/dev/null || true
}
trap cleanup EXIT
[[ ! -e "$final" ]] || fail "backup already exists: $final"
mkdir -- "$staging"

"$mysqldump_bin" \
  --defaults-extra-file="$defaults_file" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --no-tablespaces \
  --set-gtid-purged=OFF \
  --default-character-set=utf8mb4 \
  "$database_name" | gzip -9 > "$staging/database.sql.gz"

[[ -s "$staging/database.sql.gz" ]] || fail "database dump is empty"
validate_database_dump "$staging/database.sql.gz"

tar --force-local -C "$releases_root" -czf "$staging/release.tar.gz" "$git_sha"
tar --force-local -C "$release_root" -czf "$staging/shared.tar.gz" shared
validate_archive() {
  local archive=$1
  local entry
  local names
  local verbose_listing
  names=$(tar --force-local -tzf "$archive") || fail "archive listing failed"
  while IFS= read -r entry; do
    [[ "$entry" != /* && "$entry" != ../* && "$entry" != *"/../"* && "$entry" != *"/.." ]] || fail "archive contains an unsafe path"
  done <<< "$names"
  verbose_listing=$(tar --force-local -tvzf "$archive") || fail "archive verbose listing failed"
  if grep -Eq '^[^d-]' <<< "$verbose_listing"; then
    fail "archive contains a link or special file"
  fi
}
validate_archive "$staging/release.tar.gz"
validate_archive "$staging/shared.tar.gz"
(
  cd -- "$staging"
  sha256sum database.sql.gz release.tar.gz shared.tar.gz > SHA256SUMS
  sha256sum -c SHA256SUMS >/dev/null
)

BACKUP_EVIDENCE_PATH="$staging/backup-evidence.json" \
BACKUP_TIMESTAMP_VALUE="$timestamp" \
BACKUP_GIT_SHA="$git_sha" \
BACKUP_DATABASE="$database_name" \
node <<'NODE'
const fs = require("node:fs");
const evidence = {
  schemaVersion: 1,
  app: "settle-clt",
  createdAt: process.env.BACKUP_TIMESTAMP_VALUE,
  gitSha: process.env.BACKUP_GIT_SHA,
  database: process.env.BACKUP_DATABASE,
  status: "verified",
  consistency: "transactional-database-before-append-only-shared-archive",
  sharedDataContract: "atomic-immutable-write-before-database-reference",
  artifacts: ["database.sql.gz", "release.tar.gz", "shared.tar.gz"],
  checksums: "SHA256SUMS",
};
fs.writeFileSync(process.env.BACKUP_EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, {
  mode: 0o600,
});
NODE

chmod 750 -- "$staging"
chmod 640 -- "$staging"/*
mv -- "$staging" "$final"

while IFS= read -r -d '' candidate; do
  [[ "$candidate" != "$final" ]] || continue
  [[ ! -e "$candidate/hold" ]] || continue
  [[ -f "$candidate/backup-evidence.json" && ! -L "$candidate/backup-evidence.json" ]] || continue
  if status=$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).status" "$candidate/backup-evidence.json" 2>/dev/null) && [[ "$status" == "verified" ]]; then
    rm -rf -- "$candidate"
  fi
done < <(find "$backup_root" -mindepth 1 -maxdepth 1 -type d \
  -name '????????T??????Z-????????????' -mtime "+$retention_days" -print0)

printf 'backup verified: %s\n' "$final"
