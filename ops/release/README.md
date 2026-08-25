# Immutable Release Scripts

These scripts prepare and switch release directories. They do not restart services, change Nginx, run migrations, or touch production unless an operator explicitly invokes them there.

## Build artifact

`pnpm run build` only compiles `dist/` and writes an explicitly non-deployable local-build manifest. It is safe to run on a dirty review worktree and does not create or refresh `release-artifact/`.

Only `RELEASE_GIT_SHA=<full-lowercase-sha> pnpm run release:package` creates `release-artifact/`. Packaging requires that SHA to equal `HEAD` exactly and rejects tracked changes plus relevant untracked release inputs. The documented `portfolio/` tree is excluded because it is not a release input. The command never consumes the repository's existing ignored `dist/`: it creates a temporary detached worktree at the exact SHA outside the repository, runs `pnpm install --frozen-lockfile` there (preferring the offline package store and falling back to configured network access), runs the ordinary non-deployable build there, then stamps, fully hashes, verifies, and publishes the deployable artifact from staging. It revalidates the original HEAD, clean state, and tracked packaging inputs immediately before publication; a source change or any build/package failure leaves an existing artifact unchanged. The temporary worktree and registration are removed in cleanup. Because dependencies are installed from the lockfile in isolation, packaging may require a populated pnpm store or package-registry/network access.

The staging-to-`release-artifact/` rename is the publication commit point. Removal of the previous-artifact backup is best-effort after that point. If cleanup fails, packaging still reports success and prints a warning with the retained `release-artifact.previous-*` path; verify the canonical artifact, then remove the retained backup manually only after confirming it is no longer needed for recovery.

The deployable package contains:

- `dist/`
- `ops/release/`, including systemd templates, smoke/monitor scripts, and traffic controls
- `migrations/`, containing every journaled Drizzle SQL file, the journal, the exact preflight/ledger/apply utilities, `package.json`, `pnpm-lock.yaml`, and `manifest.json` with SHA-256 hashes for every migration input
- `artifact-manifest.json`, the deterministic sorted SHA-256/type/executable-mode inventory of every regular non-symlink file under all three trees, plus the release SHA and whole-manifest digest

Use `release-artifact/` as the input to `prepare-release.sh`; do not construct a dist-only artifact manually.

## Prepare

```bash
ops/release/prepare-release.sh /opt/settleclt2 ./release-artifact FULL_40_CHARACTER_SHA
```

The artifact must contain a deployable `dist/release-manifest.json` with the same SHA and a valid complete top-level artifact manifest. A new release is copied first, descriptor-verified in staging against that complete manifest, made read-only, verified again, and atomically renamed into `releases/<sha>`. Reusing a SHA is allowed only when the real non-symlink existing directory and the source both exactly verify to the same artifact-manifest digest.

## Activate

Activation is the final application-pointer step. It descriptor-verifies every prepared artifact member immediately before switching and fails closed unless `/opt/settleclt2/migration-gates/<sha>.json` matches the prepared release SHA, journal-tip tag/timestamp/hash, required schema fingerprint, and exact top-level artifact-manifest digest.

```bash
ops/release/activate-release.sh /opt/settleclt2 FULL_40_CHARACTER_SHA
```

The prepared release becomes `current`. The formerly active release becomes `previous`. Link replacements use a temporary symbolic link followed by atomic rename.

Activation alone does not restart a process or change traffic. It also does not apply or reverse migrations. Rollback remains conditional on the previous application release being compatible with the now-current schema.

## Roll back

```bash
ops/release/rollback-release.sh /opt/settleclt2
```

`current` and `previous` are swapped after both targets are validated. This command does not reverse database migrations. Confirm schema compatibility before rollback.

## Acceptance gate

Before production installation, rerun `server/release-scripts.test.ts` on Linux or in a disposable Linux directory on the target VM. The Windows test uses Git Bash native symbolic-link mode to preserve Linux symlink behavior.

## Blue-green slots

The repository includes a `settleclt@.service` systemd template and non-secret slot environments:

- `blue`: `127.0.0.1:3002`
- `green`: `127.0.0.1:3003`

Both slots load the same protected `/etc/settleclt-app/web.env`, but each starts from `/opt/settleclt2/slots/<slot>`. `RELEASE_SLOT` disables automatic fallback to another port, so a collision fails instead of drifting into the other slot.

The checked-in unit is a template, not an installed production unit. Confirm the production service user, Node path, environment file, ownership, and upload/shared-storage paths before installation.

## Safe inactive-slot sequence

After preparing an immutable release, assign only the inactive slot:

```bash
ops/release/assign-slot.sh \
  /opt/settleclt2 \
  /etc/nginx/settleclt-active-upstream.conf \
  green \
  FULL_40_CHARACTER_SHA
```

The assignment command refuses to repoint the slot currently selected by Nginx. An operator then starts or restarts only the inactive systemd instance and runs:

```bash
ops/release/smoke-slot.sh green FULL_40_CHARACTER_SHA
```

The smoke test calls the private loopback port, requires the exact release SHA from `/api/version`, requires `/health/ready`, and verifies that the homepage returns non-empty markup.

## Nginx traffic switch

Public traffic terminates on VM 103. The production site file is `/etc/nginx/sites-enabled/settleclt-com`, and it proxies to VM 101 at `10.10.10.101`. The switch command performs private candidate checks, changes exactly one Settle CLT `proxy_pass`, stores a timestamped backup outside `sites-enabled`, runs `nginx -t`, and reloads Nginx:

```bash
ops/release/switch-traffic.sh \
  /etc/nginx/sites-enabled/settleclt-com \
  /var/backups/settleclt-nginx \
  10.10.10.101 \
  green \
  FULL_40_CHARACTER_SHA
```

Rollback is explicit and uses the prior slot's full SHA:

```bash
ops/release/rollback-traffic.sh \
  /etc/nginx/sites-enabled/settleclt-com \
  /var/backups/settleclt-nginx \
  10.10.10.101 \
  blue \
  PREVIOUS_FULL_SHA
```

The switch prints an exact backup restore command after success. Backup files must not be placed in `sites-enabled`; Nginx loads files in that directory and duplicate server names create conflicting virtual-host warnings.

Traffic rollback does not reverse database migrations. Confirm that the previous application release remains compatible with the current schema.

## Migration release gate

Treat database migration and application activation as separate approvals. The required order is:

1. **Load the protected database target contract.** Root provisions `/etc/settleclt-app/release-database.env` as a regular non-symlink mode-`0600` file containing exactly the runtime database connection and its approved target digest:

   ```text
   DATABASE_URL=...
   EXPECTED_DATABASE_TARGET_SHA256=<64 lowercase hexadecimal characters>
   ```

   The digest is SHA-256 over the UTF-8 bytes `database-target-v1\n<canonical-server-uuid>\n<canonical-schema>`. Canonicalization trims both values, normalizes them to Unicode NFC, and lowercases the server UUID only. Generate and approve it through a protected operator workflow that reads exact `@@server_uuid` and `DATABASE()` without printing, logging, or writing either raw value or the connection URL. The digest is non-secret, but it is a protected deployment binding. Never provide either value in positional arguments.

   Load the protected file without shell tracing before every preflight, migration, and activation command:

   ```bash
   set -a
   . /etc/settleclt-app/release-database.env
   set +a
   ```

2. **Read-only preflight.** With that protected environment loaded, run this exact command against the prepared full-SHA release:

   ```bash
   ops/release/preflight-release.sh \
     /opt/settleclt2 \
     FULL_40_CHARACTER_SHA
   ```

   The command first descriptor-verifies the complete immutable artifact and its whole-manifest digest, then verifies every packaged migration input and uses the packaged self-contained read-only preflight runner. Before any other live inspection it reads exact `@@server_uuid` and `DATABASE()`, computes the canonical target digest in memory, and requires an exact match to `EXPECTED_DATABASE_TARGET_SHA256`. It then inspects the complete ledger prefix, duplicate non-null `(serviceKey,userId)` identities, exact 0032 `event_promotions` table metadata, exact 0033 `business_claims_service_user_unique` index metadata, and partial-DDL state. It executes only `SELECT` queries: it does not acquire advisory locks, run DDL/DML, invoke the mutating runner, or write ledger, gate, or evidence files.

   Expected non-secret JSON is either `{"status":"ready","appliedTip":"...","pending":["..."]}` or `{"status":"current","appliedTip":"0033_business_claim_identity_unique","pending":[]}`. Stop if the command exits nonzero, emits invalid JSON, reports anything other than `ready` or `current`, identifies an unexpected pending sequence, or reports ledger/schema/duplicate/read-only/partial-DDL drift. Do not proceed on warnings or by manually editing the ledger.
3. **Verified backup and manual approval.** Only after a successful preflight, create and independently verify the database/shared-file backup described below. Record its approved identifier outside the immutable release. A human operator must approve migration after reviewing the preflight and backup. Do not proceed without both a restorable backup and that approval.
4. **Exact apply.** Run only the migration command from the prepared full-SHA release with the same protected environment loaded:

   ```bash
   ops/release/migrate-release.sh \
     /opt/settleclt2 \
     FULL_40_CHARACTER_SHA
   ```

   `DATABASE_URL` and `EXPECTED_DATABASE_TARGET_SHA256` must come only from the protected process environment/defaults file; never put either in positional arguments, shell tracing, logs, or evidence other than the approved digest field. The command rereads and verifies the exact live database target before acquiring the lock. It verifies every packaged SHA-256 input, acquires a MySQL advisory lock, applies only pending entries from the packaged journal, never runs `drizzle-kit generate`, and never assigns a slot, restarts a service, or changes traffic.
5. **Post-verify.** The migration command rereads the complete ledger and the required schema. The required schema fingerprint covers the exact `event_promotions` columns/indexes/foreign keys and the full-column ordered unique `(serviceKey,userId)` index. A ledgered-but-missing object or same-name drifted object fails closed.
6. **Gate evidence.** Only after post-verification succeeds, the command atomically writes mode-`0600`, non-secret evidence to `/opt/settleclt2/migration-gates/<sha>.json`, outside the immutable release. Evidence requires schema version `1`, release SHA, journal-tip tag/timestamp/SQL hash, required schema fingerprint, whole-artifact manifest digest, `databaseTargetSha256`, verification time, a nonempty safe engine version of at most 128 characters, and canonical SQL mode. Canonical SQL mode is a nonempty, comma-separated, duplicate-free, lexicographically sorted list of uppercase `[A-Z][A-Z0-9_]{0,63}` tokens with a total maximum of 1024 characters. Evidence contains no URL, raw server UUID, database name, user, password, host, SQL, provider object, or stack cause.
7. **Activate, then separately approve traffic.** With the same protected environment loaded, `activate-release.sh` requires `EXPECTED_DATABASE_TARGET_SHA256`, verifies the immutable inputs, validates every required gate field and runtime-metadata bound, and requires the gate's `databaseTargetSha256` to match exactly before changing `current`. This prevents replay of a valid gate from staging, a different server, or a different schema. Slot assignment, service start, smoke testing, and public traffic switching remain later, separately approved operations.

All provider failures exposed by standalone preflight or migration are reduced to a bounded stage, optional migration tag/statement index, and allowlisted classification. Raw provider messages, SQL, URLs, host/schema identifiers, credentials, provider objects, and causes are never emitted.

`pnpm run db:generate` is an authoring command only. `pnpm run db:migrate` and the compatibility alias `pnpm run db:push` apply reviewed migrations without generation. Do not use an unbuilt checkout's Drizzle files for a release migration.

### Stop and recovery conditions for 0032/0033

MySQL DDL auto-commits. Never repair the ledger manually and never blindly replay a whole SQL file:

- **Duplicate identities before 0033:** stop before permanent 0033 DDL. Consolidate duplicates through a separately reviewed data-repair procedure, rerun the read-only preflight, take a fresh backup if the data changed, then rerun the exact release command.
- **0032 unledgered, `event_promotions` absent:** normal retry applies 0032.
- **0032 unledgered, `event_promotions` present in any state (including an exact-looking complete table):** stop with `partial-DDL/manual reconciliation required`. The runner never fingerprints an unjournaled table to authorize or synthesize a ledger row, never advances the ledger, and never writes a migration gate. Inspect every column, index, foreign key, trigger, and row; use a separately reviewed recovery plan and fresh backup before retry.
- **0033 unledgered, `business_claims_service_user_unique` present in any state (including the exact full-column ordered unique index):** stop with `partial-DDL/manual reconciliation required`. The runner never treats an unjournaled index as authorization to record 0033, never advances the ledger, and never writes a migration gate. Inspect and recover under a separately reviewed, write-quiesced plan.
- **0032 or 0033 ledgered but required schema missing/drifted:** stop as inconsistent. Do not forge, delete, or advance ledger rows.
- **Read-only target:** stop. Confirm target identity and approved role; never disable read-only protections merely to make the command pass.

After any DDL-before-ledger interruption, repeated preflight/apply attempts must stop deterministically until an operator completes a separately reviewed manual reconciliation; retries do not auto-recover or record the object. Rerun the read-only preflight first and use only the same immutable full-SHA release. A different SQL hash, journal timestamp/tag, schema fingerprint, or target state invalidates prior evidence and requires inspection. The disposable real-MySQL integration entry point is `pnpm run test:migrations:mysql`; it is intentionally excluded from the default Vitest suite and prints an explicit `SKIP:` reason only when Windows or the official download/network is unavailable.

## Persistent uploads

Production must set `SETTLECLT_STORAGE_DIR=/opt/settleclt2/shared/public/manus-storage`; the checked-in systemd template does this explicitly. Production startup fails closed if the variable is absent or relative. The production storage root and all parent directories must already exist as real, root-owned directories before the web service starts; the web process never creates that hierarchy. Development/test may create their repository-local `public/manus-storage` default.

Before starting either slot for the first time, copy the existing production `public/manus-storage` tree into the shared path, preserve ownership and modes, compare file counts and hashes, and keep the source unchanged through the rollback window. This migration is a separately approved production step.

Stored objects are append-only: publication uses an exclusive temporary file and atomic no-replace hard link, every path component is checked with `lstat`/`realpath`, and links beneath the storage root are rejected. Application code must persist an object before committing any database reference and must not mutate or delete published objects. That contract lets backup capture a transactional database snapshot first and the immutable shared tree second: every object referenced by the database snapshot is present, while later unreferenced objects are harmless extras.

## Service identities and ownership

Create dedicated non-login identities before installing any unit: `settleclt-web`, `settleclt-backup`, `settleclt-drill`, and `settleclt-monitor`. Create `settleclt-data` for read access to append-only uploads and `settleclt-backups` for read access to verified backup sets. Only the web and backup identities join `settleclt-data`; only backup and drill identities join `settleclt-backups`. The web identity must not be able to read MySQL defaults files, backup sets, drill evidence, or monitor credentials.

Keep `/opt/settleclt2` root-owned and non-writable by service identities. Every production upload directory, including the storage root and each accepted nested key parent, must be pre-created, owned by root, and use the sticky bit; grant `settleclt-web` create access with a dedicated POSIX ACL rather than directory ownership. All ancestors above the storage root remain root-owned and group/world non-writable. This kernel-enforced topology prevents the web identity from replacing a validated parent while pathname-based Node operations run. Own `/var/backups/settleclt` as `settleclt-backup:settleclt-backups` with setgid mode `2750`; verified set directories/files are `0750`/`0640`. Own each protected defaults/environment file by only the identity that consumes it and use mode `0600`. The web unit mounts the application tree read-only, removes ambient/bounding capabilities, and grants write access only through the upload-directory ACLs.

## Verified backups

The backup command writes a staged MySQL dump, active immutable release, persistent shared tree, SHA-256 checksums, and non-secret evidence before atomically publishing the set:

```bash
ops/release/create-backup.sh \
  /opt/settleclt2 \
  /var/backups/settleclt \
  /etc/settleclt-app/mysql-backup.cnf \
  settleclt \
  14
```

The defaults file must be a regular non-symlink file with no group/world access. It uses a `[client]` section; never pass a password on the command line. The dump includes routines, triggers, and events and is accepted only when gzip, completion-footer, SQL-boundary, archive, and checksum verification pass. SQL validation rejects database selectors, qualified cross-schema objects, account/privilege changes, global settings, plugin installation, and server-side file I/O, including statements hidden in executable comments. Backups require `shared/public/manus-storage` and fail if the backup destination is nested under release/shared data.

Retention runs only after a new verified backup is published. It preserves the newest set, `hold` markers, malformed or unverified sets, symlinks, and unknown entries. Copy verified sets to separately access-controlled off-host storage for disaster tolerance; local checksums alone do not protect against malicious replacement.

`systemd/settleclt-backup.service` and `.timer` are repository templates for a persistent daily 02:00 run. Installation, ownership, destination capacity, MySQL privileges, and a manual first backup require explicit production approval.

## Feature controls and health

The server strictly parses these optional values from `/etc/settleclt-app/feature-flags.env`; omitted values preserve current behavior:

- `FEATURE_BUSINESS_CHECKOUT`
- `FEATURE_EVENT_SUBMISSIONS`

Only `true`, `false`, `1`, and `0` are accepted. Checkout and event-submission writes are enforced server-side. Add a newsletter-digest flag only when a concrete digest execution path exists to enforce it. Flags never replace authentication, authorization, origin checks, Stripe signature verification, or compliance operations.

Operational endpoints use `Cache-Control: no-store`:

- `/api/version` — exact immutable release identity.
- `/health/live` — process liveness, no dependency call.
- `/health/ready` — bounded database connectivity.
- `/health/summary` — operator-token-protected aggregate request/status counts only; no URLs, headers, bodies, or identities.
- `/api/feature-flags` — non-secret public feature availability.

## Release monitoring

After an approved traffic switch, run the parameterized systemd service with the full release SHA or invoke:

```bash
ops/release/monitor-release.sh \
  https://settleclt.com \
  FULL_40_CHARACTER_SHA \
  /var/lib/settleclt-monitor/FULL_40_CHARACTER_SHA.json \
  12 10 2
```

Set a strong `OPERATIONS_MONITOR_TOKEN` in the web environment. Store the matching curl header only in `/etc/settleclt-app/monitor-curl.conf`, owned by `settleclt-monitor` with mode `0600`, using curl config syntax `header = "Authorization: Bearer ..."`; never pass the token as a command argument. The monitor validates that file before use.

The monitor verifies version, liveness, readiness, homepage markup, minimum application traffic, and aggregate 5xx rate. Request and 5xx decisions use deltas from a protected baseline captured at the start of the observation window; decreasing counters fail closed. It writes `PASS`, `HOLD`, or `ROLLBACK_RECOMMENDED`. Exit 2 recommends rollback; exit 3 holds for human review. It never invokes Nginx, systemd, traffic switching, or database recovery.

## Isolated restore drill

`run-latest-dr-drill.sh` selects the latest verified set and calls `dr-restore-drill.sh`. The drill uses the separate protected `/etc/settleclt-app/mysql-drill.cnf` and `/etc/settleclt-app/drill.env`. The latter must define the approved `DRILL_EXPECTED_SERVER_UUID` and a different `DRILL_PRODUCTION_SERVER_UUID`. Before writing, the drill verifies the target's exact MySQL server UUID, exactly one checksum for each expected regular non-symlink artifact, the backup consistency contract, SQL boundaries, and archive paths; it then requires an absent `settleclt_dr_YYYYMMDD_*` database, rejects replicas/read-only targets, requires the MySQL event scheduler off, restores and validates data/release/shared state, drops the drill database, and writes restricted evidence.

The monthly persistent timer is a template. It uses two separate protected defaults files: `mysql-drill-provision.cnf` is used only by the provisioning identity to create/drop the uniquely named empty drill database, while `mysql-drill.cnf` is used by the restore identity and has only privileges on the escaped drill-schema pattern `settleclt\_dr\_%`. The restore identity has no global privileges and cannot access `mysql`, production, or unrelated schemas. Neither credential is passed as a process argument. UUID checks are defense in depth, not a substitute for database-enforced least privilege. A real first drill, evidence review, and cleanup verification require separate approval.

## Final rollback procedure

Follow `docs/operations/RELEASE_ROLLBACK_CHECKLIST.md`. A monitoring recommendation is evidence, not authorization. Application rollback requires explicit approval and schema compatibility. Ordinary application rollback must not restore the database.
