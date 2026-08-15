#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

[[ $# -eq 6 ]] || fail "usage: monitor-release.sh PUBLIC_ORIGIN EXPECTED_SHA EVIDENCE_PATH SAMPLES INTERVAL_SECONDS FAILURE_THRESHOLD"
origin=${1%/}
expected_sha=$2
evidence_path=$3
samples=$4
interval_seconds=$5
failure_threshold=$6
curl_bin=${CURL_BIN:-curl}
curl_options=(-fsS)
if [[ -n "${MONITOR_CURL_CONFIG:-}" ]]; then
  [[ -f "$MONITOR_CURL_CONFIG" && ! -L "$MONITOR_CURL_CONFIG" ]] || fail "monitor curl config must be a regular non-symlink file"
  config_permissions=$(stat -c '%a' -- "$MONITOR_CURL_CONFIG")
  (( (8#$config_permissions & 077) == 0 )) || fail "monitor curl config must not be group/world accessible"
  curl_options+=(--config "$MONITOR_CURL_CONFIG")
fi
minimum_requests=${MONITOR_MIN_REQUESTS:-100}
maximum_5xx_rate=${MONITOR_MAX_5XX_RATE:-0.05}

require_release_sha "$expected_sha"
[[ "$origin" =~ ^https?://[^/]+$ ]] || fail "public origin must be an HTTP(S) origin"
[[ "$samples" =~ ^[1-9][0-9]*$ ]] || fail "samples must be positive"
[[ "$interval_seconds" =~ ^[0-9]+$ ]] || fail "interval must be non-negative"
[[ "$failure_threshold" =~ ^[1-9][0-9]*$ ]] || fail "failure threshold must be positive"
(( failure_threshold <= samples )) || fail "failure threshold cannot exceed samples"
[[ "$minimum_requests" =~ ^[1-9][0-9]*$ ]] || fail "minimum requests must be positive"
node -e 'const n=Number(process.argv[1]); if (!Number.isFinite(n) || n < 0 || n > 1) process.exit(1)' "$maximum_5xx_rate" || fail "maximum 5xx rate must be between 0 and 1"

curl_request() {
  "$curl_bin" "${curl_options[@]}" "$@"
}

parse_metrics() {
  METRICS_JSON="$1" node <<'NODE'
const value = JSON.parse(process.env.METRICS_JSON);
if (!Number.isInteger(value.requestCount) || value.requestCount < 0) process.exit(1);
if (!Number.isInteger(value.status5xx) || value.status5xx < 0) process.exit(1);
process.stdout.write(`${value.requestCount} ${value.status5xx}`);
NODE
}

failed_samples=0
observed_samples=0
version_mismatches=0
readiness_failures=0
liveness_failures=0
homepage_failures=0
metrics_failures=0
traffic_sufficient=0
maximum_observed_requests=0
maximum_observed_5xx_rate=0
decision=PASS
baseline_valid=0
baseline_requests=0
baseline_5xx=0
if baseline_summary=$(curl_request --max-time 5 "$origin/health/summary" 2>/dev/null) && baseline=$(parse_metrics "$baseline_summary"); then
  read -r baseline_requests baseline_5xx <<< "$baseline"
  baseline_valid=1
fi
if (( baseline_valid == 0 )); then
  decision=HOLD
else
for ((sample = 1; sample <= samples; sample++)); do
  observed_samples=$sample
  sample_failed=0

  if version=$(curl_request --max-time 5 "$origin/api/version" 2>/dev/null); then
    if ! VERSION_JSON="$version" EXPECTED_SHA="$expected_sha" node <<'NODE'
const value = JSON.parse(process.env.VERSION_JSON);
if (value.app !== "settle-clt" || value.gitSha !== process.env.EXPECTED_SHA) process.exit(1);
NODE
    then
      version_mismatches=$((version_mismatches + 1))
      sample_failed=1
    fi
  else
    version_mismatches=$((version_mismatches + 1))
    sample_failed=1
  fi

  if ! curl_request --max-time 5 "$origin/health/live" >/dev/null 2>&1; then
    liveness_failures=$((liveness_failures + 1))
    sample_failed=1
  fi
  if ! curl_request --max-time 5 "$origin/health/ready" >/dev/null 2>&1; then
    readiness_failures=$((readiness_failures + 1))
    sample_failed=1
  fi
  if ! homepage=$(curl_request --max-time 10 "$origin/" 2>/dev/null) || [[ "$homepage" != *"<"* ]]; then
    homepage_failures=$((homepage_failures + 1))
    sample_failed=1
  fi

  metrics_valid=0
  if (( baseline_valid == 1 )) && summary=$(curl_request --max-time 5 "$origin/health/summary" 2>/dev/null); then
    if metrics=$(parse_metrics "$summary"); then
      metrics_valid=1
      read -r current_requests current_5xx <<< "$metrics"
      if (( current_requests < baseline_requests || current_5xx < baseline_5xx )); then
        metrics_valid=0
      else
        observed_requests=$((current_requests - baseline_requests))
        observed_5xx=$((current_5xx - baseline_5xx))
        observed_5xx_rate=$(node -e 'const requests=Number(process.argv[1]); const failures=Number(process.argv[2]); process.stdout.write(String(requests === 0 ? 0 : failures / requests))' "$observed_requests" "$observed_5xx")
      fi
    fi
    if (( metrics_valid == 1 )); then
      if (( observed_requests > maximum_observed_requests )); then
        maximum_observed_requests=$observed_requests
      fi
      maximum_observed_5xx_rate=$(node -e 'process.stdout.write(String(Math.max(Number(process.argv[1]), Number(process.argv[2]))))' "$maximum_observed_5xx_rate" "$observed_5xx_rate")
      if (( observed_requests >= minimum_requests )); then
        traffic_sufficient=1
        if node -e 'process.exit(Number(process.argv[1]) > Number(process.argv[2]) ? 0 : 1)' "$observed_5xx_rate" "$maximum_5xx_rate"; then
          metrics_failures=$((metrics_failures + 1))
          sample_failed=1
        fi
      fi
    fi
  fi
  if (( metrics_valid == 0 )); then
    metrics_failures=$((metrics_failures + 1))
    sample_failed=1
  fi

  if (( sample_failed == 1 )); then
    failed_samples=$((failed_samples + 1))
  fi
  if (( failed_samples >= failure_threshold )); then
    decision=ROLLBACK_RECOMMENDED
    break
  fi
  if (( sample < samples && interval_seconds > 0 )); then
    sleep "$interval_seconds"
  fi
done
fi

if [[ "$decision" == "PASS" ]] && (( traffic_sufficient == 0 )); then
  decision=HOLD
fi

mkdir -p -- "$(dirname -- "$evidence_path")"
MONITOR_EVIDENCE_PATH="$evidence_path" \
MONITOR_EXPECTED_SHA="$expected_sha" \
MONITOR_SAMPLES="$samples" \
MONITOR_OBSERVED="$observed_samples" \
MONITOR_FAILED="$failed_samples" \
MONITOR_VERSION_MISMATCHES="$version_mismatches" \
MONITOR_LIVENESS_FAILURES="$liveness_failures" \
MONITOR_READINESS_FAILURES="$readiness_failures" \
MONITOR_HOMEPAGE_FAILURES="$homepage_failures" \
MONITOR_METRICS_FAILURES="$metrics_failures" \
MONITOR_MIN_REQUESTS="$minimum_requests" \
MONITOR_MAX_5XX_RATE="$maximum_5xx_rate" \
MONITOR_OBSERVED_REQUESTS="$maximum_observed_requests" \
MONITOR_OBSERVED_5XX_RATE="$maximum_observed_5xx_rate" \
MONITOR_DECISION="$decision" \
node <<'NODE'
const fs = require("node:fs");
const number = name => Number.parseInt(process.env[name], 10);
const evidence = {
  schemaVersion: 1,
  app: "settle-clt",
  observedAt: new Date().toISOString(),
  expectedGitSha: process.env.MONITOR_EXPECTED_SHA,
  samples: number("MONITOR_SAMPLES"),
  observedSamples: number("MONITOR_OBSERVED"),
  failedSamples: number("MONITOR_FAILED"),
  failures: {
    version: number("MONITOR_VERSION_MISMATCHES"),
    liveness: number("MONITOR_LIVENESS_FAILURES"),
    readiness: number("MONITOR_READINESS_FAILURES"),
    homepage: number("MONITOR_HOMEPAGE_FAILURES"),
    metrics: number("MONITOR_METRICS_FAILURES"),
  },
  traffic: {
    minimumRequests: number("MONITOR_MIN_REQUESTS"),
    observedRequests: number("MONITOR_OBSERVED_REQUESTS"),
    maximum5xxRate: Number(process.env.MONITOR_MAX_5XX_RATE),
    observed5xxRate: Number(process.env.MONITOR_OBSERVED_5XX_RATE),
  },
  decision: process.env.MONITOR_DECISION,
  automaticRollbackExecuted: false,
};
fs.writeFileSync(process.env.MONITOR_EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, {
  mode: 0o600,
});
NODE

if [[ "$decision" == "ROLLBACK_RECOMMENDED" ]]; then
  printf 'rollback recommended; human approval required\n' >&2
  exit 2
fi
if [[ "$decision" == "HOLD" ]]; then
  printf 'monitoring hold: insufficient application traffic; human review required\n' >&2
  exit 3
fi
printf 'monitoring passed: %s\n' "$expected_sha"
