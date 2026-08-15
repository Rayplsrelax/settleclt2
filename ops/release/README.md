# Immutable Release Scripts

These scripts prepare and switch release directories. They do not restart services, change Nginx, run migrations, or touch production unless an operator explicitly invokes them there.

## Prepare

```bash
ops/release/prepare-release.sh /opt/settleclt2 /path/to/artifact FULL_40_CHARACTER_SHA
```

The artifact must contain `dist/release-manifest.json` with the same SHA. A new release is copied through a staging directory, made read-only, and renamed into `releases/<sha>`. Reusing a SHA is allowed only when the existing directory exactly matches the artifact.

## Activate

```bash
ops/release/activate-release.sh /opt/settleclt2 FULL_40_CHARACTER_SHA
```

The prepared release becomes `current`. The formerly active release becomes `previous`. Link replacements use a temporary symbolic link followed by atomic rename.

Activation alone does not restart a process or change traffic.

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

`nginx/settleclt-upstream.conf` defines the `settleclt_app` upstream. The existing HTTPS server block must proxy to `http://settleclt_app` and include an operator-managed active-upstream symlink at `/etc/nginx/settleclt-active-upstream.conf`.

The switch command performs the private smoke test again, verifies an exact loopback upstream, preserves the prior target, atomically replaces the active symlink, runs `nginx -t`, and reloads Nginx:

```bash
ops/release/switch-traffic.sh \
  /opt/settleclt2 \
  /etc/nginx/settleclt-active-upstream.conf \
  green \
  FULL_40_CHARACTER_SHA
```

If Nginx validation or reload fails, the prior links are restored. Repeating a switch to the already-active slot does not overwrite the rollback target.

Rollback uses the preserved slot and validates it before switching:

```bash
ops/release/rollback-traffic.sh \
  /opt/settleclt2 \
  /etc/nginx/settleclt-active-upstream.conf
```

Traffic rollback does not reverse database migrations. Confirm that the previous application release remains compatible with the current schema.

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
