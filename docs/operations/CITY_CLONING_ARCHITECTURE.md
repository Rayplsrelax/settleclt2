# City Cloning Architecture — Settle CLT → Settle {City}

**Status: APPROVED 2026-08-17 — direction locked (multi-tenant)**
**Date: 2026-08-17**
**Scope: architecture document. Implementation phases 1–4 sequenced AFTER Plan A ships.**

---

## 1. Goal

Launch the Settle platform in additional NC/SC cities (candidates: Raleigh, Durham, Greensboro, Asheville, Charleston, Greenville) without forking the codebase per city.

## 2. Recommendation: multi-tenant monorepo (single deployable, city-scoped data)

**Recommendation: Option A — one codebase, one database, city as a first-class dimension.**
Fork-per-city (Option B) is included for comparison and rejected.

## 3. Where Charlotte is hardcoded today (audit results)

| Layer | Location | Hardcoding |
|---|---|---|
| Data | `shared/neighborhoods.ts`, `metroNeighborhoods.ts`, `neighborhoodDevelopments.ts` | Charlotte neighborhood lists (20), area names |
| Data | `shared/services-data.ts` (implied) | Curated Charlotte businesses (700+) |
| Data | `shared/articles.ts` | Blog articles Charlotte-specific |
| Logic | `shared/areaDetection.ts` | CLT-area detection rules |
| Logic | `shared/quiz-*` (implied) | Quiz questions/copy |
| UI | Navbar/Footer/Home/Events/Directory | "CLT" branding, "Queen City", hero copy |
| DB | events, businesses, blog | Charlotte-centric rows (no city column) |
| SEO | route-seo, sitemap | Charlotte titles/descriptions |
| Config | domain settleclt.com | single-site assumption |

## 4. Target architecture

```
                    ┌────────────────────────────┐
                    │  Edge (VM103 nginx)        │
                    │  settleraleigh.com ──┐     │
                    │  settleclt.com ──────┼──► VM101 (single app) │
                    │  settlechsl.com ─────┘     │
                    └────────────────────────────┘
                                 │
                    ┌────────────▼───────────────┐
                    │  City config resolver       │
                    │  host → city slug           │
                    │  (cookie override for dev)  │
                    └────────────┬───────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
       city_configs        all queries        SEO/titles
       (per-city branding,  city_id-scoped     per-city strings
        neighborhoods,      (events, biz,      (route-seo map)
        services seed)      blog, quiz)
```

### 4.1 New `city` dimension

- New table `cities`: `id, slug, name, state, displayName, brandPrimary, brandGold, domain, tagline, heroCopyJson, active, launchedAt`
- City-scoped tables get `city_id` FK: events, businesses/listings, blog articles, promotions, quiz results, passport stamps, leaderboard
- Static `shared/` data files (neighborhoods, services seed) become city-keyed: `CITY_CONFIGS["clt"]`, `CITY_CONFIGS["ral"]` … — loaded once, tree-shaken per city or fetched from DB for large sets (business seeds move to DB-backed city data)

### 4.2 Request-time city resolution

1. **Host-based** (primary): `settleclt.com` → clt, `settleraleigh.com` → ral. Resolver in server middleware + client context.
2. **Cookie override** (`x-city`) for dev/staging on a single host.
3. All tRPC routers receive city context; every city-scoped query filters by `city_id` automatically (enforced via a scoped-db wrapper, not per-query discipline — one missed filter = cross-city data leak, so this is enforced centrally).

### 4.3 Branding & theming

- CSS tokens already central (`--primary` etc.); swap per-city palette via `data-city` attribute on `<html>`
- "CLT"/"Queen City" strings already moving into i18n dictionaries (PR #78) — extend with city-token interpolation: `{cityName}`, `{cityNickname}`
- Logo per city (city configs table)

### 4.4 SEO per city

- `route-seo` becomes city-aware: titles/descriptions from city config
- Sitemap per domain (host-aware sitemap route)
- Canonicals: each city domain is self-canonical (no cross-city canonicals → no duplicate-content entanglement)
- GSC property per domain (you already run one for settleclt.com)

### 4.5 i18n interaction

The just-merged i18n framework (EN/ES) layers cleanly: city resolution is orthogonal to locale. Key format stays `nav.home`; city copy comes from config, not dictionaries.

## 5. Launch runbook per new city (target: 1 day)

1. Insert `cities` row + neighborhood/service seed data
2. DNS: new domain → same VM103 edge, new nginx server block (server_name + cert via the shared wildcard/certbot flow — same pattern as the 7-subdomain wave1 cert)
3. City config active → site renders with new branding
4. GSC property + verification DNS record
5. Seed content (neighborhoods first, then curated businesses, then events)

## 6. Migration path for Charlotte (the only real risk)

Charlotte data becomes `city_id=1`. Steps:

1. Add `cities` table + `city_id` columns (nullable) on scoped tables
2. Backfill `city_id=1` for all existing rows (single UPDATE per table)
3. Enforce NOT NULL after backfill; add indexes
4. Central scoped-query wrapper merged BEFORE any second city exists (single-city behavior unchanged)
5. Charlotte domain keeps resolving exactly as today (host=clt)

This migration is invisible to users if done in order: columns first (nullable), backfill, then enforcement.

## 7. Option B rejected: fork-per-city

| | A: multi-tenant | B: fork per city |
|---|---|---|
| New city cost | ~1 day (data + DNS) | full redeploy per city |
| Feature shipping | once, all cities | N merges × N repos |
| i18n/theme/Plan A | inherited automatically | re-port every feature |
| Risk | central complexity (city resolver, scoped queries) | drift between cities, security patches ×N |
| Cost ceiling | one VM101 + one DB | N app servers |

Forking buys isolation but you own N codebases forever; every fix from the last 3 months (SEO, release safety, theme, i18n) would need N backports. Rejected.

## 8. Build plan (after approval)

| Phase | Contents | Notes |
|---|---|---|
| 1 | `cities` table + city resolver middleware + client CityContext + scoped-query wrapper + Charlotte backfill | zero user-visible change |
| 2 | City configs (branding tokens, neighborhoods data restructure) + host-based branding swap | Charlotte unchanged |
| 3 | Per-domain SEO (sitemap, route-seo map) + nginx server block pattern | new city ready |
| 4 | Second city dry-run on staging host (cookie override) | validate end-to-end before DNS |

Phase 1 is the only schema-touching phase; 2–4 are additive.

## 9. Open decisions for you

1. **First second-city candidate?** (Raleigh is the natural largest-market choice)
2. **Domains**: `settleraleigh.com`-style per city, or `raleigh.settleclt.com` subdomains? (Per-city domains are cleaner for local SEO; subdomains are cheaper/faster and reuse the wave1 cert)
3. **Timeline**: start Phase 1 after Plan A ships, or parallel?
4. **Content sourcing per city**: same manual curation as Charlotte, or AI-assisted seed + human review?
