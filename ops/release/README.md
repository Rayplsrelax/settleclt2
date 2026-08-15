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

The smoke test calls the private loopback port, requires the exact release SHA from `/api/version`, and verifies that the homepage returns non-empty markup.

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
