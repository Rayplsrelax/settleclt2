# Release Safety Architecture

## Status

This document defines the staged path from in-place deployments to reversible blue-green releases. Repository preparation does not authorize production changes. Every production change to systemd, Nginx, MySQL, backup storage, or monitoring requires separate approval and verification.

## Release identity contract

`pnpm run build` writes `dist/release-manifest.json` atomically after the client and server builds complete.

```json
{
  "schemaVersion": 1,
  "app": "settle-clt",
  "version": "1.0.0",
  "gitSha": "<full 40-character commit SHA>",
  "builtAt": "<ISO-8601 timestamp>"
}
```

Production loads this immutable file during startup and refuses to start when it is missing or invalid. Development uses an explicit development marker.

`GET /api/version` returns the loaded manifest with `Cache-Control: no-store`. It exposes no hostname, environment variables, credentials, database state, branch name, or infrastructure addresses.

Release verification must compare the endpoint's full `gitSha` with the approved release commit. An HTTP 200 alone is not deployment proof.

## Target filesystem

```text
/opt/settleclt2/
  releases/<git-sha>/       immutable application release
  shared/                   uploads and non-versioned runtime data
  current -> releases/<sha> active release
  previous -> releases/<sha> last known-good release
```

Secrets remain in the protected systemd `EnvironmentFile`; they are never copied into a release directory or manifest.

## Target blue-green topology

```text
Nginx
  active upstream -> 127.0.0.1:3002 (blue)
                  or 127.0.0.1:3003 (green)
```

The inactive slot starts from the new immutable release. Private smoke tests must pass before an atomic Nginx upstream switch and reload. The old slot remains available during the monitoring window.

## Rollout phases and gates

1. **Release identity** — version endpoint and immutable manifest.
2. **Release directories** — create release, `current`, and `previous` primitives without changing production traffic.
3. **Rollback** — validate an atomic symlink rollback in an isolated directory.
4. **Second slot** — install templated blue/green systemd units; keep the new slot private.
5. **Private smoke tests** — version SHA, homepage, critical routes, auth guards, and API health.
6. **Nginx switch** — backup config, test with `nginx -t`, switch upstream, reload, and verify externally.
7. **Pre-deployment backup** — database-aware backup, checksum, retention, and isolated restore verification.
8. **Feature flags** — server-enforced kill switches; no client-only authorization or billing flags.
9. **Monitoring and rollback** — service, HTTP, error, database, OAuth, Stripe, and newsletter checks with a human-approved rollback decision.
10. **Disaster recovery drill** — periodic isolated restore of database, uploads, configuration, and a known release artifact.

## Database compatibility rule

Application rollback is permitted only while the previous release remains compatible with the current schema. Production migrations follow expand/transition/contract sequencing:

- Expand: additive, backward-compatible schema.
- Transition: backfill and dual-compatible application behavior.
- Contract: destructive cleanup only after the rollback window closes.

Automated rollback switches application traffic; it does not reverse database migrations.

## Required evidence per release

- Approved full commit SHA.
- CI tests, TypeScript, audits, and production build pass.
- Immutable release manifest matches the commit.
- Pre-migration backup and checksum complete when schema changes exist.
- Inactive-slot private smoke tests pass.
- Nginx configuration test passes before reload.
- Public route, header, API guard, and `/api/version` checks pass after cutover.
- Previous release and database compatibility are recorded.
- Monitoring window completes before old-slot retirement.

## Emergency rollback decision

Rollback when a new release causes sustained critical-route failures, authentication failure, payment/webhook corruption risk, or elevated server errors and the previous release remains schema-compatible. Freeze writes or disable the affected feature first when continued writes could make rollback unsafe.
