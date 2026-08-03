# Settle CLT Canonical Authority and Publishing Map

> Last verified: 2026-08-03

## Systems Overview

### settleclt.com (Manus-hosted public website)

| Aspect | Value |
|---|---|
| Host | Manus |
| Source repo | `Rayplsrelax/settleclt2` (branch `main`) |
| Current HEAD | `cc4f842` (Phase 6C merged via PR #35) |
| Database | TiDB Cloud (Manus-managed) |
| Public content | Directory, events, blogs, neighborhoods, SEO pages |
| Auth | Manus OAuth (website app ID) |
| Billing | Stripe (website-connected) |
| Role | Canonical public discovery and SEO |
| Agent access | Read-only research; no direct publish |

### app.settleclt.com (Independent operations workspace)

| Aspect | Value |
|---|---|
| Host | VM 101 backend + VM 103 nginx/TLS edge |
| Source repo | `C:\Users\Raysh\SettleCLT_App` (branch `main`, HEAD `622d691`) |
| Backend repo | `C:\Users\Raysh\settleclt2` (same codebase, app profile) |
| Database | VM 101 MySQL 8.0.46, database `settleclt_app` (29 tables, 19 migrations) |
| Replica | VM 104 (read-only, GTID replication, zero lag) |
| Public hostname | `app.settleclt.com` → VM 103 `209.74.65.166` → VM 101:3001 |
| Auth | Manus OAuth (separate app ID, not yet installed) |
| Role | Authenticated business workspace, agent operations, approval queues |
| Agent access | Restricted operations API (planned) |

## Data Ownership Map

| Data type | Canonical system | Read from | Write to | Public route |
|---|---|---|---|---|
| Directory listings | settleclt.com (Manus/TiDB) | Both | Manus only via PR | `settleclt.com/directory` |
| Events | settleclt.com (Manus/TiDB) | Both | Manus only via PR | `settleclt.com/events` |
| Blog posts | settleclt.com (Manus/TiDB) | Both | Manus only via PR | `settleclt.com/blog` |
| Neighborhoods | settleclt.com (Manus/TiDB) | Both | Manus only via PR | `settleclt.com/neighborhoods` |
| Business claims | VM 101 `settleclt_app` | App | App | `app.settleclt.com` |
| Memberships | VM 101 `settleclt_app` | App | App | `app.settleclt.com` |
| Reviews | settleclt.com (Manus/TiDB) | Both | Manus only via PR | `settleclt.com` |
| Comments | settleclt.com (Manus/TiDB) | Both | Manus only via PR | `settleclt.com` |
| Premium/billing | VM 101 `settleclt_app` | App | App | `app.settleclt.com` |
| Agent tasks | VM 101 `settleclt_app` | App | App | Internal |
| Approval records | VM 101 `settleclt_app` | App | App | Internal |
| Audit events | VM 101 `settleclt_app` | App | App | Internal |

## Publishing Paths

### Current (Stage A — GitHub PR + Manual Manus Publish)

```
Agent research → verified draft + sources + diff
    → Operations cockpit approval (owner)
    → GitHub PR (settleclt2 repo)
    → Manus workspace sync
    → Owner publishes in Manus
    → Agent verifies live production
```

### Future Stage B — Documented Manus API (if available)

```
Agent draft → approval → restricted operations API → Manus content API → publish → verify
```

### Future Stage C — Independent website

```
After 30+ stable operating days:
Build independent website → migrate content → prove SEO/URL parity → DNS cutover with rollback
```

## Infrastructure

| Component | Location | Access |
|---|---|---|
| Proxmox host | `100.112.41.30` (Tailscale) | SSH only |
| VM 101 (settle-clt) | `10.10.10.101` | Internal network only |
| VM 103 (web-staging) | `209.74.65.166` | Public 80/443 only |
| VM 104 (replica) | `10.10.10.104` | Internal, read-only |
| MySQL | `10.10.10.101:3306` | bind-address `10.10.10.101` |
| Backend | VM 101 port 3001 | Via nginx proxy only |
| nginx | VM 103 | `app.settleclt.com` only |

## Non-Negotiable Boundaries

1. Do not modify Manus website source, deployment, OAuth app, DNS apex, www, or TiDB data without approved PR.
2. Do not share cookies or credentials across `settleclt.com` and `app.settleclt.com`.
3. Do not expose MySQL, Node port 3001, SSH, Proxmox, or agent management ports publicly.
4. Every business operation is authorized from active membership, not browser-supplied role/claim data.
5. Agents may draft and recommend; publishing, messaging, billing, claim approval, deployment, and destructive changes require explicit human approval.
6. All agent actions produce durable database and vault audit records.
7. Agents operate only inside the Settle CLT project boundary.
