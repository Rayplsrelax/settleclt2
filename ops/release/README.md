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
