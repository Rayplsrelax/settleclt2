# Settle CLT Release Manifest — 2026-08-04

## Repository: settleclt2

| Field | Value |
|---|---|
| Repository | `Rayplsrelax/settleclt2` |
| Branch | `feat/operations-system-and-premium-features` |
| PR | [#36](https://github.com/Rayplsrelax/settleclt2/pull/36) |
| Base | `main` at `cc4f842` |
| HEAD | `8077486` |
| Commits | 7 |
| Migrations | 22 (was 19 — added 0019-0022) |
| Schema tables | 35 (was 29 — added 6) |
| Test files | 93 (was 85) |
| Tests | 817 passed / 23 skipped (was 746) |
| TypeScript | Clean |
| Build | 760.1kb |
| Lint | Clean |

### New Tables

| Table | Migration | Purpose |
|---|---|---|
| `agent_tasks` | 0019 | Agent task queue with role, risk, lifecycle |
| `approval_records` | 0019 | Single-use payload-bound approvals |
| `audit_events` | 0019 | Immutable agent action log |
| `listing_verifications` | 0020 | Verification checks with evidence levels |
| `source_registry` | 0021 | Managed Charlotte source list |
| `business_leads` | 0022 | Premium tier lead capture |

### New tRPC Routers

| Router | Procedures | Purpose |
|---|---|---|
| `operations` | 10 | Cockpit, tasks, approvals, audit |
| `directoryOps` | 8 | Gap analysis, verification, freshness, closure, links |
| `eventOps` | 10 | Expiry, lifecycle, recurring, verification |
| `editorialOps` | 4 | Blog summary, stale posts, drafts |
| `communityOps` | 7 | Submissions, reviews, comments, moderation |
| `sourceRegistry` | 7 | Source CRUD, stats, needing check |

### New Premium Procedures

| Procedure | Purpose |
|---|---|
| `premium.getPhotoLimit` | Query tier-based photo limit |
| `premium.trackLead` | Create lead + increment counter + notify owner |
| `premium.getLeads` | View leads for a business |
| `premium.updateLeadStatus` | Manage lead lifecycle |
| `premium.getReport` | Monthly performance report with CTR/conversion |

### Commits in This Release

1. `368fcda` — Operations cockpit, approval system, audit logging (Phase 1)
2. `c6ed2c1` — Directory operations: gap analysis, verification, freshness, closure, links (Phase 2)
3. `5240bf9` — Event operations: expiry, lifecycle, recurring management (Phase 3)
4. `51759e2` — Editorial ops, community ops, source registry (Phases 4-5)
5. `1c32d70` — Premium tier features: photo limits, lead capture, lead tracking (Week 1)
6. `25aa471` — Directory premium priority placement (Week 1)
7. `8077486` — Monthly performance report + OAuth security tests (Week 2)

---

## Repository: settleclt-app (PWA)

| Field | Value |
|---|---|
| Repository | `Rayplsrelax/settleclt-app` |
| Branch | `main` |
| HEAD | `622d691` |
| Commit | `fix: support same-origin standalone app API` |
| Status | Pushed to origin |

---

## Infrastructure: VM 101 (settle-clt)

| Field | Value |
|---|---|
| OS | Ubuntu 24.04 (kernel 6.8.0-136) |
| MySQL | 8.0.46 at 10.10.10.101:3306 |
| Node.js | v22.23.2 |
| Hermes | v0.19.1 (gateway active, Telegram @RayshSettleCLTBot) |
| Backend service | `settleclt-app-backend.service` — active |
| Database | `settleclt_app` — 35 tables, 23 migrations |
| Backup | Nightly at 2:00 AM UTC (systemd timer) |
| Replica | VM 104 (read-only, GTID) |

### Deployed Backend

| Field | Value |
|---|---|
| Built from | `8077486` |
| Bundle size | 760.1kb |
| OAuth | 302 redirect to login.manus.im (working) |
| API health | `auth.me` returns 200 |
| Ops routers | All 6 respond (403 without auth — correct) |
| Source registry | 47 seeded sources across 6 categories |

---

## Infrastructure: VM 103 (web-staging)

| Field | Value |
|---|---|
| Public IP | 209.74.65.166 |
| nginx | Reverse proxy for app.settleclt.com |
| TLS | Let's Encrypt (expires 2026-11-01) |
| HTTP→HTTPS redirect | Active |

---

## Cron Jobs (12 active Settle CLT jobs)

| Schedule | Job | Type |
|---|---|---|
| Every 4h | Reliability watchdog | Script-only (silent) |
| Every 6h | Moderation queue check | Script-only (silent) |
| Every 6h | Community Moderator Agent | LLM agent |
| Mon 9am | Directory Curator Agent | LLM agent |
| Mon 10am | Events Editor Agent | LLM agent |
| Mon 11am | Source Discovery Agent | LLM agent |
| Tue 2pm | Content Editor Agent | LLM agent |
| Wed 9am | Business Success Agent | LLM agent |
| Fri 8am | Event expiry check | Script-only (silent) |
| Mon 9am | Weekly KPI Report | Script-only (silent) |
| Monthly 1st | SEO & Freshness Agent | LLM agent |
| Nightly 2am | Database backup | systemd timer |

---

## Verification Commands

```bash
# Full test suite
pnpm test

# TypeScript
pnpm run check

# Production build
pnpm run build

# Diff check
git diff --check

# VM 101 health
ssh -i ~/.ssh/hermes_proxmox_ed25519 -o ProxyJump=root@100.112.41.30 agent@10.10.10.101 \
  "systemctl is-active settleclt-app-backend && curl -sS http://localhost:3001/api/trpc/auth.me"

# Public endpoint
curl -sS https://app.settleclt.com/api/trpc/auth.me
```
