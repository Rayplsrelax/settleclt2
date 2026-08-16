#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 5 ]] || fail "usage: switch-traffic.sh NGINX_SITE BACKUP_DIR UPSTREAM_HOST SLOT GIT_SHA"
nginx_site=$1
backup_dir=$2
upstream_host=$3
slot=$4
git_sha=$5
require_slot "$slot"
require_release_sha "$git_sha"
if [[ "$nginx_site" != /* && ! "$nginx_site" =~ ^[A-Za-z]:[\\/] ]] || [[ "$backup_dir" != /* && ! "$backup_dir" =~ ^[A-Za-z]:[\\/] ]]; then
  fail "nginx site and backup directory must be absolute paths"
fi
[[ -f "$nginx_site" && ! -L "$nginx_site" ]] || fail "nginx site must be a regular non-symlink file"
[[ "$upstream_host" =~ ^[A-Za-z0-9.-]+$ ]] || fail "upstream host is invalid"
if ! ACTIVE_CONFIG_DIR="$(dirname -- "$nginx_site")" BACKUP_DIR="$backup_dir" node <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const active = fs.realpathSync(process.env.ACTIVE_CONFIG_DIR);
const backupParent = path.dirname(process.env.BACKUP_DIR);
const backupParentReal = fs.realpathSync(backupParent);
const backup = path.resolve(backupParentReal, path.basename(process.env.BACKUP_DIR));
const relative = path.relative(active, backup);
if (relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) {
  process.exit(2);
}
NODE
then
  fail "backups must live outside the active nginx configuration tree"
fi
mkdir -p -- "$backup_dir"
[[ -d "$backup_dir" && ! -L "$backup_dir" ]] || fail "backup directory must be a real directory"

candidate_port=$(slot_port "$slot")
candidate_origin="http://$upstream_host:$candidate_port"
curl_bin=${CURL_BIN:-curl}
nginx_bin=${NGINX_BIN:-nginx}

version=$($curl_bin -fsS --max-time 5 "$candidate_origin/api/version") || fail "candidate version probe failed"
VERSION_JSON="$version" EXPECTED_SHA="$git_sha" node <<'NODE'
const value = JSON.parse(process.env.VERSION_JSON);
if (value.app !== "settle-clt" || value.gitSha !== process.env.EXPECTED_SHA) {
  throw new Error("candidate version does not match requested SHA");
}
NODE
$curl_bin -fsS --max-time 5 "$candidate_origin/health/ready" >/dev/null || fail "candidate readiness probe failed"
$curl_bin -fsS --max-time 5 "$candidate_origin/" >/dev/null || fail "candidate homepage probe failed"

configured_port=$(UPSTREAM_HOST="$upstream_host" NGINX_SITE="$nginx_site" node <<'NODE'
const fs = require("node:fs");
const source = fs.readFileSync(process.env.NGINX_SITE, "utf8");
const escaped = process.env.UPSTREAM_HOST.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const matches = [...source.matchAll(new RegExp(`proxy_pass\\s+http://${escaped}:(3002|3003);`, "g"))];
if (matches.length !== 1) process.exit(2);
process.stdout.write(matches[0][1]);
NODE
) || fail "nginx site must contain exactly one Settle CLT slot proxy_pass"
current_port=$configured_port

if [[ "$current_port" == "$candidate_port" ]]; then
  "$nginx_bin" -t || fail "nginx rejected the active site"
  printf 'traffic already active: %s %s\n' "$slot" "$git_sha"
  exit 0
fi

stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup="$backup_dir/$(basename -- "$nginx_site").before-${current_port}-to-${candidate_port}.$stamp"
cp -a -- "$nginx_site" "$backup"

restore_site() {
  cp -a -- "$backup" "$nginx_site"
}

UPSTREAM_HOST="$upstream_host" NGINX_SITE="$nginx_site" CURRENT_PORT="$current_port" CANDIDATE_PORT="$candidate_port" node <<'NODE'
const fs = require("node:fs");
const path = process.env.NGINX_SITE;
const source = fs.readFileSync(path, "utf8");
const escaped = process.env.UPSTREAM_HOST.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pattern = new RegExp(`(proxy_pass\\s+http://${escaped}:)${process.env.CURRENT_PORT}(;)`, "g");
const matches = [...source.matchAll(pattern)];
if (matches.length !== 1) throw new Error("expected exactly one current upstream");
const temporary = `${path}.tmp-${process.pid}`;
fs.writeFileSync(
  temporary,
  source.replace(pattern, `$1${process.env.CANDIDATE_PORT}$2`),
  { mode: fs.statSync(path).mode }
);
fs.renameSync(temporary, path);
NODE

if ! "$nginx_bin" -t; then
  restore_site
  fail "nginx rejected the candidate; prior site restored"
fi
if ! "$nginx_bin" -s reload; then
  restore_site
  "$nginx_bin" -t && "$nginx_bin" -s reload || true
  fail "nginx reload failed; prior site restored"
fi

printf 'traffic switched: %s %s\n' "$slot" "$git_sha"
printf 'backup: %s\n' "$backup"
printf 'rollback: cp -a -- %q %q && %q -t && %q -s reload\n' "$backup" "$nginx_site" "$nginx_bin" "$nginx_bin"
