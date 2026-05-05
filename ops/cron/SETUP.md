# Stale Blog Post Monthly Digest — Cron Setup

This folder contains a ready-to-install GitHub Actions workflow that runs the stale-blog digest at **14:00 UTC on the 1st of every month** (= 9 AM EST / 10 AM EDT).

> **Why this isn't already in `.github/workflows/`:** The CI bot account that opened the original PRs lacks GitHub's `workflows` permission scope, so the file has to be installed manually by a human user one time. Once installed, it runs forever automatically.

## One-time installation (2 minutes)

### 1. Move the workflow file into place

From the repo root:

```bash
mkdir -p .github/workflows
git mv ops/cron/github-actions-stale-blog-digest.yml .github/workflows/stale-blog-digest.yml
git commit -m "Ops: install monthly stale-blog cron"
git push
```

### 2. Add the required repo secrets

Go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Value | Where to find it |
|---|---|---|
| `DATABASE_URL` | `mysql://user:pass@host:port/db?ssl={...}` | Same TiDB Cloud connection string the production app uses |
| `BUILT_IN_FORGE_API_URL` | `https://...` | Same value as the runtime env in production |
| `BUILT_IN_FORGE_API_KEY` | `...` | Same value as the runtime env in production |

If `BUILT_IN_FORGE_*` are not set, the digest will still run and print to the GitHub Actions log — only the owner-email send will be skipped.

## Verifying the install

After step 1, go to **Actions → Stale Blog Post Monthly Digest → Run workflow** to do a one-off run on demand. You can override:
- `stale_after_days` (default 90)
- `notify` (set to `false` for a dry-run that only logs)

If you'd rather run it from your own machine right now without touching GitHub:

```bash
DATABASE_URL='mysql://...'  STALE_NOTIFY=1  npx tsx scripts/notify-stale-blog-posts.mjs
```

## What the workflow does

The workflow runs `scripts/notify-stale-blog-posts.mjs`, which:
1. Queries published blog posts whose `updatedAt` is older than `STALE_DAYS` (default 90)
2. Logs each one to the run output with title, slug, days-old, and category
3. If `STALE_NOTIFY=1`, sends a single owner-email digest via `notifyOwner` containing the top 20 stalest posts and a link to `/admin/blog`

## Alternative if you don't use GitHub Actions

The same script works against any cron host — your own VPS, a Cloud Scheduler job, etc. All it needs is Node 22+, `pnpm install` once, and the env vars above.
