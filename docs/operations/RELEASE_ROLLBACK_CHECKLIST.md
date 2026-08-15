# Production Release Rollback Checklist

This checklist governs application traffic rollback for Settle CLT. It does not authorize production changes by itself. Each production command, service change, Nginx reload, or database action requires explicit approval.

## 1. Declare and stabilize

- [ ] Record the active and previous full Git SHAs.
- [ ] Capture the latest monitoring evidence and the reason for the rollback recommendation.
- [ ] Disable the affected server-enforced feature flag when that safely stops harmful writes.
- [ ] Freeze writes or the affected workflow if continued writes could make rollback unsafe.
- [ ] Confirm the previous application release is schema-compatible with the current database.
- [ ] Confirm the previous slot still passes its private version, liveness, readiness, and homepage checks.

## 2. Approval gate

- [ ] **Explicit rollback approval** has been given for this incident and this target SHA.
- [ ] An operator and observer are identified.
- [ ] The rollback target and current Nginx upstream are independently recorded.
- [ ] The latest verified backup evidence and SHA-256 checksums are available.

## 3. Application traffic rollback

Run only after the approval gate:

```bash
/opt/settleclt2/ops/release/rollback-traffic.sh \
  /opt/settleclt2 \
  /etc/nginx/settleclt-active-upstream.conf
```

The command smoke-tests the previous slot, atomically restores its upstream, runs `nginx -t`, and reloads Nginx. If validation or reload fails, stop and inspect the preserved configuration; do not improvise another traffic change.

## 4. Immediate verification

- [ ] `GET /api/version` reports the approved previous full Git SHA with `Cache-Control: no-store`.
- [ ] `/health/live` returns 200.
- [ ] `/health/ready` returns 200.
- [ ] Homepage and critical public routes return expected content.
- [ ] Authentication start/callback guards behave correctly.
- [ ] Stripe routes reject unsigned requests and no payment-corruption signal exists.
- [ ] Newsletter confirmation/unsubscribe boundaries remain intact.
- [ ] Error rate and latency return to the accepted baseline during the observation window.
- [ ] The failed release remains stopped or isolated from traffic without deleting its evidence.

## 5. Database boundary

**Do not restore the database as part of ordinary application rollback.** Additive expand-and-contract migrations normally remain in place. Database restore is a separately approved disaster-recovery action because it can discard valid writes made after the backup.

If the previous release is not schema-compatible, do not switch traffic. Disable the affected feature, stabilize the current release, and prepare a forward fix or separately reviewed database recovery plan.

## 6. Closeout

- [ ] Preserve version, monitor, Nginx validation, service, and backup evidence.
- [ ] Record start time, approval, traffic-switch time, verification outcome, and incident owner.
- [ ] Open follow-up work for the root cause and missing detection.
- [ ] Re-enable feature flags only through a reviewed release decision.
- [ ] Keep the failed release and relevant backup until incident review closes.
