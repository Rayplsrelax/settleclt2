#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 5 ]] || fail "usage: dr-restore-drill.sh BACKUP_DIR DRILL_ROOT MYSQL_DEFAULTS_FILE DRILL_DATABASE EVIDENCE_PATH"
backup_dir=$1
drill_root=$2
defaults_file=$3
drill_database=$4
evidence_path=$5
provision_defaults_file=${DRILL_PROVISION_DEFAULTS_FILE:-}
[[ -n "$provision_defaults_file" ]] || fail "DRILL_PROVISION_DEFAULTS_FILE is required; provisioning and restore credentials must be separate"
mysql_bin=${MYSQL_BIN:-mysql}
provision_mysql_bin=${PROVISION_MYSQL_BIN:-$mysql_bin}
expected_server_uuid=${DRILL_EXPECTED_SERVER_UUID:-}
production_server_uuid=${DRILL_PRODUCTION_SERVER_UUID:-}
uuid_pattern='^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

[[ "$drill_database" =~ ^settleclt_dr_[0-9]{8}(_[A-Za-z0-9]+)?$ ]] || fail "drill database must use the settleclt_dr_YYYYMMDD naming convention"
[[ "$expected_server_uuid" =~ $uuid_pattern ]] || fail "DRILL_EXPECTED_SERVER_UUID must be a MySQL server UUID"
[[ "$production_server_uuid" =~ $uuid_pattern ]] || fail "DRILL_PRODUCTION_SERVER_UUID must be a MySQL server UUID"
[[ "${expected_server_uuid,,}" != "${production_server_uuid,,}" ]] || fail "drill and production server UUIDs must differ"
[[ -f "$defaults_file" && ! -L "$defaults_file" ]] || fail "MySQL restore defaults file must be a regular non-symlink file"
[[ -n "$provision_defaults_file" && -f "$provision_defaults_file" && ! -L "$provision_defaults_file" ]] || fail "DRILL_PROVISION_DEFAULTS_FILE must be a protected non-symlink file"
restore_permissions=$(stat -c '%a' -- "$defaults_file")
provision_permissions=$(stat -c '%a' -- "$provision_defaults_file")
if [[ ${NODE_ENV:-} != "test" || ${BACKUP_TEST_ALLOW_INSECURE_DEFAULTS:-0} != "1" ]]; then
  (( (8#$restore_permissions & 077) == 0 )) || fail "MySQL restore defaults file must not be group/world accessible"
  (( (8#$provision_permissions & 077) == 0 )) || fail "DRILL_PROVISION_DEFAULTS_FILE must not be group/world accessible"
fi
[[ -d "$backup_dir" && ! -L "$backup_dir" ]] || fail "backup directory must be a real directory"
for artifact in database.sql.gz release.tar.gz shared.tar.gz SHA256SUMS backup-evidence.json; do
  [[ -f "$backup_dir/$artifact" && ! -L "$backup_dir/$artifact" ]] || fail "backup artifact must be a regular non-symlink file: $artifact"
done

BACKUP_CHECKSUM_PATH="$backup_dir/SHA256SUMS" node <<'NODE'
const fs = require("node:fs");
const expected = ["database.sql.gz", "release.tar.gz", "shared.tar.gz"];
const lines = fs
  .readFileSync(process.env.BACKUP_CHECKSUM_PATH, "utf8")
  .split(/\r?\n/)
  .filter(Boolean);
if (lines.length !== expected.length) process.exit(1);
const names = lines.map(line => {
  const match = line.match(/^[0-9a-f]{64}  ([A-Za-z0-9.-]+)$/);
  if (!match) process.exit(1);
  return match[1];
});
if (new Set(names).size !== expected.length) process.exit(1);
if (names.sort().join("\n") !== expected.sort().join("\n")) process.exit(1);
NODE

(
  cd -- "$backup_dir"
  sha256sum --strict -c SHA256SUMS >/dev/null
)
validate_database_dump "$backup_dir/database.sql.gz"
source_sha=$(node -p "const e=JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); const expected=['database.sql.gz','release.tar.gz','shared.tar.gz']; if(e.app!=='settle-clt'||e.status!=='verified'||!/^[0-9a-f]{40}$/.test(e.gitSha)||e.consistency!=='transactional-database-before-append-only-shared-archive'||e.sharedDataContract!=='atomic-immutable-write-before-database-reference'||e.checksums!=='SHA256SUMS'||!Array.isArray(e.artifacts)||e.artifacts.slice().sort().join()!==expected.sort().join()) process.exit(1); e.gitSha" "$backup_dir/backup-evidence.json")
require_release_sha "$source_sha"

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
validate_archive "$backup_dir/release.tar.gz"
validate_archive "$backup_dir/shared.tar.gz"

restore_grants=$($mysql_bin --defaults-extra-file="$defaults_file" --batch --skip-column-names -e "SHOW GRANTS FOR CURRENT_USER")
DRILL_GRANTS="$restore_grants" node <<'NODE'
const grants = process.env.DRILL_GRANTS.split(/\r?\n/).filter(Boolean);
if (grants.length === 0) process.exit(1);
let scopedGrant = false;
for (const grant of grants) {
  if (/\bWITH GRANT OPTION\b|^GRANT PROXY\b/i.test(grant)) process.exit(1);
  if (/^GRANT USAGE ON \*\.\* TO /i.test(grant)) continue;
  if (/ ON (?:`settleclt\\_dr\\_%`|settleclt\\_dr\\_%)\.\* TO /i.test(grant)) {
    scopedGrant = true;
    continue;
  }
  process.exit(1);
}
if (!scopedGrant) process.exit(1);
NODE

database_state=$($mysql_bin --defaults-extra-file="$defaults_file" --batch --skip-column-names -e "SELECT @@server_uuid, @@read_only, @@super_read_only, @@event_scheduler")
read -r actual_server_uuid read_only super_read_only event_scheduler <<< "$database_state"
[[ "${actual_server_uuid,,}" == "${expected_server_uuid,,}" ]] || fail "restore target server UUID does not match the approved drill server"
[[ "${actual_server_uuid,,}" != "${production_server_uuid,,}" ]] || fail "restore target is the production MySQL server"
[[ "$read_only" == "0" && "$super_read_only" == "0" ]] || fail "restore target is read-only or replicated"
[[ "$event_scheduler" == "OFF" || "$event_scheduler" == "DISABLED" ]] || fail "restore target event scheduler must be disabled"
replica_state=$($mysql_bin --defaults-extra-file="$defaults_file" --batch --skip-column-names -e "SHOW REPLICA STATUS")
[[ -z "$replica_state" ]] || fail "restore target is a replica"
existing_database=$($mysql_bin --defaults-extra-file="$defaults_file" --batch --skip-column-names -e "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '$drill_database'")
[[ "$existing_database" == "0" ]] || fail "drill database already exists"

mkdir -p -- "$drill_root"
work="$drill_root/run-$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir -- "$work"
database_created=0
cleanup() {
  if (( database_created == 1 )); then
    $provision_mysql_bin --defaults-extra-file="$provision_defaults_file" -e "DROP DATABASE IF EXISTS \`$drill_database\`" >/dev/null 2>&1 || true
  fi
  rm -rf -- "$work"
}
trap cleanup EXIT

$provision_mysql_bin --defaults-extra-file="$provision_defaults_file" -e "CREATE DATABASE \`$drill_database\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
database_created=1
gzip -dc -- "$backup_dir/database.sql.gz" | $mysql_bin --binary-mode=1 --defaults-extra-file="$defaults_file" "$drill_database"

tar --force-local -C "$work" -xzf "$backup_dir/release.tar.gz"
tar --force-local -C "$work" -xzf "$backup_dir/shared.tar.gz"
manifest="$work/$source_sha/dist/release-manifest.json"
[[ -f "$manifest" ]] || fail "restored release manifest is missing"
restored_sha=$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).gitSha" "$manifest")
[[ "$restored_sha" == "$source_sha" ]] || fail "restored release SHA mismatch"
[[ -d "$work/shared" ]] || fail "restored shared data is missing"

tables=$($mysql_bin --defaults-extra-file="$defaults_file" --batch --skip-column-names -e "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$drill_database' AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME")
table_count=0
total_rows=0
while IFS= read -r table; do
  [[ -n "$table" ]] || continue
  escaped_table=${table//\`/\`\`}
  rows=$($mysql_bin --defaults-extra-file="$defaults_file" --batch --skip-column-names "$drill_database" -e "SELECT COUNT(*) FROM \`$escaped_table\`")
  [[ "$rows" =~ ^[0-9]+$ ]] || fail "invalid restored row count"
  table_count=$((table_count + 1))
  total_rows=$((total_rows + rows))
done <<< "$tables"
(( table_count > 0 )) || fail "restored database contains no tables"

$provision_mysql_bin --defaults-extra-file="$provision_defaults_file" -e "DROP DATABASE IF EXISTS \`$drill_database\`"
database_created=0

mkdir -p -- "$(dirname -- "$evidence_path")"
DR_EVIDENCE_PATH="$evidence_path" \
DR_SOURCE_SHA="$source_sha" \
DR_DATABASE="$drill_database" \
DR_SERVER_UUID="$actual_server_uuid" \
DR_TABLE_COUNT="$table_count" \
DR_TOTAL_ROWS="$total_rows" \
node <<'NODE'
const fs = require("node:fs");
const evidence = {
  schemaVersion: 1,
  app: "settle-clt",
  completedAt: new Date().toISOString(),
  status: "verified",
  sourceGitSha: process.env.DR_SOURCE_SHA,
  drillDatabase: process.env.DR_DATABASE,
  drillServerUuid: process.env.DR_SERVER_UUID,
  tableCount: Number.parseInt(process.env.DR_TABLE_COUNT, 10),
  totalRows: Number.parseInt(process.env.DR_TOTAL_ROWS, 10),
  checksumsVerified: true,
  releaseArtifactVerified: true,
  sharedDataVerified: true,
  drillDatabaseDropped: true,
};
fs.writeFileSync(process.env.DR_EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, {
  mode: 0o600,
});
NODE

printf 'disaster-recovery drill verified: %s\n' "$source_sha"
