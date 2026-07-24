# Settle CLT Revenue Operating System

This is the simple operating package for turning Settle CLT from a local directory into a business.

## Core dashboard

Open:

```txt
/admin/revenue
```

Use it as the daily command center for:

- Realtor lead follow-up
- Business claim approvals
- Featured/Premium listing sales
- Event sponsor opportunities
- Microsite funnel checks

## Revenue lanes

### 1. Realtor leads

Traffic sources:

- `/find-your-home`
- `/quiz`
- neighborhood pages
- `movingtocharlotteguide.com`

Daily action:

1. Open `/admin/referrals`.
2. Sort/review hot and qualified leads.
3. Contact hot leads same day.
4. Move status from `new` → `contacted` → `matched` → `closed` or `lost`.
5. Add admin notes after each contact.

### 2. Business listings

Traffic sources:

- `/directory`
- `/directory/category/:slug`
- `/business-pricing`
- business detail pages
- `charlottehomepros.org`

Daily action:

1. Open `/admin/claims`.
2. Approve real business owners.
3. Send owner to `/my-business` and `/business-pricing`.
4. Pitch Featured at $29/mo or Premium at $79/mo.

### 3. Events and sponsors

Traffic sources:

- `/events`
- `/things-to-do`
- weekend roundup blog posts
- `charlotteweekendevents.com`

Weekly action:

1. Keep 10+ current events live.
2. Publish/update weekend roundup.
3. Pitch featured event or weekend sponsor.
4. Track event clicks in Mixpanel.

### 4. Microsite funnels

Domains:

- `movingtocharlotteguide.com` → realtor leads
- `charlotteweekendevents.com` → event traffic/sponsors
- `charlottejobmarket.com` → relocation/job traffic
- `charlotteneighborhoodsguide.com` → neighborhoods/realtor leads
- `charlottehomepros.org` → home service businesses

Weekly action:

1. Confirm all sites are live.
2. Confirm UTM parameters are visible in analytics.
3. Submit sitemap/indexing in Search Console.
4. Improve pages based on clicks and impressions.

## First monthly revenue target

| Lane | Target | Price | Monthly value |
|---|---:|---:|---:|
| Featured listings | 20 | $29/mo | $580/mo |
| Premium listings | 10 | $79/mo | $790/mo |
| Weekend sponsors | 4 | $99/week | $396/mo |
| Realtor referral/commission value | 1 | $1,500 est. | $1,500/mo |

Target: **~$3,266/month** before scaling.

## Daily checklist

- [ ] Check `/admin/revenue`.
- [ ] Check `/admin/referrals` for hot leads and due next actions.
- [ ] Check `/admin/claims` for pending claims.
- [ ] Check `/admin/events` for stale/empty event coverage.
- [ ] Check `/admin/analytics` for search/content gaps.
- [ ] Improve or contact at least 5 businesses from `docs/seo/LISTING_ENRICHMENT_PRIORITIES.md`.

## Weekly checklist

- [ ] Run/update listing enrichment report.
- [ ] Run/update event growth loop report.
- [ ] Check Search Console priority URLs.
- [ ] Check Mixpanel UTM sources from microsites.
- [ ] Publish one SEO/content improvement.
- [ ] Contact 20 businesses in money categories.
- [ ] Contact 5 event venues/promoters.

## Stage 5–10 completion map

- Stage 5: Realtor lead operations/dashboard workflow — implemented.
- Stage 6: Business claim monetization path — implemented.
- Stage 7: Category SEO landing pages — implemented.
- Stage 8: Listing enrichment workflow/content improvements — implemented.
- Stage 9: Event growth loop improvements — implemented.
- Stage 10: Revenue system/dashboard packaging — implemented.

## Manual launch items outside code

These still require authenticated accounts or live deployment access:

- Deploy latest GitHub changes to production.
- Run Drizzle migration against production database with secure `DATABASE_URL`.
- Backfill existing referral lead operations fields once, if production already has realtor leads:

```bash
DATABASE_URL='[REDACTED]' pnpm exec tsx scripts/backfill-referral-lead-ops.ts --dry-run
DATABASE_URL='[REDACTED]' pnpm exec tsx scripts/backfill-referral-lead-ops.ts
```

  Use `--all` only if you want to recompute every non-closed referral, including rows that already have a score/next action.
- Host/connect microsite domains.
- Submit microsite sitemaps to Search Console.
- Confirm live Mixpanel events after production deploy.
