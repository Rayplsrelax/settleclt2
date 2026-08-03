# Phase 6C3 — Migration 0018 recovery runbook

This runbook covers `drizzle/0018_fearless_bedlam.sql`. It does **not** authorize a production migration. Obtain an approved maintenance window, verified backup/PITR coverage, and explicit deployment approval first.

## Why recovery is required

MySQL-family DDL can commit independently of the transaction used by the migration runner. If statement 0018 fails after creating a table or unique index but before Drizzle writes its journal row, rerunning the migration starts from statement one and eventually fails on an existing object.

The recovery command restores a narrowly verified, unjournaled partial 0018 state to its pre-0018 shape. It never applies the migration itself.

## Safety contract

The recovery tool:

- runs read-only unless `--apply` is present;
- requires an exact connected-database confirmation;
- requires the literal migration confirmation `0018_fearless_bedlam`;
- requires an explicit write-quiescence confirmation;
- refuses cleanup if migration 0018 is already journaled and reports `blocked` if its expected schema is incomplete;
- fingerprints both migration-owned tables by exact ordered columns, types, nullability, defaults, update/auto-increment behavior, indexes, constraints, and absence of triggers before proposing a drop;
- fingerprints index uniqueness, ordered columns, full-column versus prefix/expression parts, collation, type, visibility, packing, nullability, and comments before proposing a drop;
- reinspects the live state immediately before every individual cleanup action and aborts if it changed after planning;
- refuses to drop `business_memberships` when it contains any row that is not exactly reproducible from a current approved, user-bound claim;
- refuses to drop `stripe_checkout_reconciliations` when it contains any audit row;
- only removes the two 0018 tables and three named premium-listing indexes;
- can be rerun if cleanup itself is interrupted.

The operator must stop application, worker, administrator, and migration-runner writes before inspection and keep them stopped through cleanup, migration retry, and verification. The confirmation flag records this operational fact; it does not acquire a database-wide lock.

## 1. Validate on a disposable matching engine

Use a disposable database with migrations through 0017. Never point the integration suite at production.

```bash
PHASE6C3_DATABASE_URL='mysql://user:password@host:port/admin_database' \
  pnpm exec vitest run \
  server/phase6c3-migration-recovery.test.ts \
  server/phase6c3-migration-integration.test.ts
```

The test account must be allowed to create and drop only the disposable database `settleclt_phase6c3_integration`.

Before production approval, repeat this suite against a disposable database on the same TiDB Cloud engine/version and SQL mode as production. Local MySQL verification is necessary but does not prove TiDB-specific DDL behavior.

## 2. Inspect only

```bash
DATABASE_URL='[REDACTED]' \
  pnpm exec tsx scripts/phase6c3-migration-recovery.ts
```

Expected statuses:

- `ready`: no permanent 0018 artifact exists; run the normal migration.
- `already-applied`: the 0018 journal timestamp is present; do not clean up.
- `recoverable`: only deterministic partial artifacts exist; review every proposed action.
- `blocked`: preserve the database and investigate manually. Do not bypass the guard.

## 3. Recover an approved partial state

Only after backup/PITR verification, maintenance mode, stopped workers, exact plan review, and explicit change approval:

```bash
DATABASE_URL='[REDACTED]' \
  pnpm exec tsx scripts/phase6c3-migration-recovery.ts \
  --apply \
  --confirm-database='EXACT_DATABASE_NAME_FROM_PLAN' \
  --confirm-migration='0018_fearless_bedlam' \
  --confirm-write-quiescence
```

Successful cleanup ends with:

```text
mode=apply
result=ready
```

If cleanup is interrupted, rerun plan-only inspection. The resulting plan contains only remaining artifacts.

## 4. Retry migration 0018

Run the repository's normal migration command only after cleanup reports `ready`. Do not generate another migration and do not edit the journal manually.

After the migration succeeds, rerun plan-only inspection. It must report `already-applied`.

## 5. Post-migration verification

Verify before restoring writes:

- one active owner membership per approved, user-bound canonical claim;
- pending, rejected, and unbound claims did not gain membership authority;
- unique indexes exist for membership `(serviceKey, userId)`, active owner, premium service key, Stripe customer ID, and Stripe subscription ID;
- `stripe_checkout_reconciliations` exists with event/session uniqueness;
- the latest `__drizzle_migrations.created_at` covers migration 0018;
- application authorization, billing, and reconciliation smoke tests pass.

Keep the pre-change backup until application and audit verification are complete.

## Blocked-state escalation

Do not use ad-hoc `DROP TABLE`, `DROP INDEX`, or journal inserts when the tool reports `blocked`. Preserve evidence and determine whether the rows were created by live application traffic, a previous deployment, or manual intervention. A blocked state requires a case-specific data-preserving migration reviewed independently before execution.
