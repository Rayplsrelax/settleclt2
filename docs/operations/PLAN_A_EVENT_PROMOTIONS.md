# Plan A — Paid Event Promotion Package

**Status: DRAFT — awaiting user review**
**Date: 2026-08-17**
**Scope: design document only. No code until approved.**

---

## 1. What Plan A is

A one-time, prepaid promotion package event organizers buy so their event gets:

1. **Boosted placement on settleclt.com** — pinned to top of `/events` with a "Promoted" badge for the package window
2. **A dedicated microsite page** at `/events/:slug` (the existing event detail route) enriched with organizer branding, sponsor message, and a shareable link
3. **Scheduled social posts** — promoted to the Settle CLT social channels (Facebook/Instagram) on the existing approved-post pipeline

Target buyer: event organizers who already submit events (free path exists at `/submit-event`).

## 2. Existing infrastructure this builds on (verified in code 2026-08-17)

| Component | Status | Location |
|---|---|---|
| Stripe account + secret key | ✅ live (business memberships) | `server/stripe-helpers.ts` |
| `checkout.sessions.create` | ✅ pattern established (subscription mode) | `server/stripe-helpers.ts:89` |
| Raw-body webhook handler | ✅ live at `/api/stripe/webhook` | `server/_core/index.ts:83` |
| `checkout.session.completed` handling | ✅ live (activates premium listings) | `server/_core/index.ts:119` |
| `event_sponsorships` table | ✅ **defined in schema, never wired** | `drizzle/schema.ts:1043` |
| Events table with `featured` flag | ✅ live | `drizzle/schema.ts:388` |
| Social posting pipeline | ✅ live (approved-only, buffered) | outside repo (cron 8ecf9be219c6) |

## 3. Package definition (pricing TBD by user)

| | Boost (B) | Spotlight (S) | Headliner (H) |
|---|---|---|---|
| Price (one-time) | $19 | $49 | $149 |
| Duration | 7 days | 14 days | 30 days |
| Boosted placement | /events top | /events top + category page top | /events top pinned |
| "Promoted" badge | ✅ | ✅ | ✅ |
| Microsite page | standard detail page | + organizer logo + sponsor message | + custom headline + ticket CTA |
| Social posts | 1 scheduled post | 3 scheduled posts | 5 scheduled posts + 1 newsletter mention |

**Single payment (mode: "payment"), not subscription.** Uses `price_data` inline (one-off product, no pre-created Price objects needed — simpler than the membership flow).

## 3a. Boost ranking semantics

Boosted events sort by `(featured/promoted) > date` within `/events` lists: active promotion ⇒ top of list with badge; expiry auto-demotes (status flips to `expired` when `endsAt < now()` on read or via a scheduled sweep).

## 3b. Microsite additions (Spotlight/Headliner)

- Organizer logo + sponsor message rendered on the event detail page (`event_sponsorships.message`, `level`)
- Headliner: custom headline slot + prominent ticket CTA button (uses `events.rsvpUrl` or `externalUrl`)
- SEO: event detail pages already self-canonical; `sponsored` content is marked `noindex` for the *microsite variant* only if we add separate URLs. **Decision: no separate URL — enrich the canonical event page. No new SEO surface, no duplicate-content risk.**

## 4. Data model changes

New table (reusing the unused `event_sponsorships` shape):

```sql
-- drizzle/0033_event_promotions.sql
event_promotions:
  id, event_id, purchased_by (user_id), level (boost|spotlight|headliner),
  status (pending|active|expired|canceled),
  stripe_payment_ref (checkout session id), price_cents,
  starts_at, ends_at,
  -- headliner extras
  custom_headline, sponsor_message, organizer_logo_url,
  -- social pipeline handoff
  social_posts_due (int), social_posts_sent (int default 0),
  created_at, updated_at
```

Drop/replace the unused `event_sponsorships` table definition (never wired, no data — verified zero references in `server/`).

## 5. Purchase flow

```
Organizer: /events → "Promote this event" (on their event) or /submit-event success screen
  → POST /api/events/promotions/checkout  (auth: must own event or be organizer)
     - creates event_promotions row (status=pending)
     - creates Stripe Checkout (mode=payment, price_data inline, metadata={promotion_id, event_id, user_id})
  → Stripe hosted checkout
  → webhook: checkout.session.completed
     - match metadata.promotion_id
     - status → active, starts_at=now, ends_at=now+duration
     - event.featured = true (while promotion active)
     - enqueue social posts (social_posts_due per level)
  → success_url: /my-events?promotion=success
```

**Refunds/cancel**: webhook `charge.refunded` → status=canceled, event.featured=false, unsent social posts dropped. No portal needed (one-time payment).

**Expiry sweep**: on-read demotion (cheap) + daily cron sweep as backstop — avoids a paid event staying pinned forever if traffic switches missed it.

**Failure path (fail-closed)**: if the webhook can't activate (DB error), Stripe retries; pending rows older than 48h get a reconciliation pass mirroring `stripe-checkout-reconciliation.ts` patterns.

## 6. Social pipeline handoff

Promotion activation writes to the **existing** approved-post buffer the social cron (8ecf9be219c6) already reads. Posts are drafted into `pending` state — they still flow through the existing approve-before-post gate (blanket approval covers only pre-approved content categories; paid posts get human eyes first until you say otherwise). Posts spread across the promotion window (e.g. Headliner's 5 posts at day 0/7/14/21/28).

## 7. Build plan (3 PRs)

| PR | Contents | Est. |
|---|---|---|
| #1 Schema + purchase API + webhook | migration 0033, checkout endpoint, webhook branch, ownership check, tests | largest |
| #2 Boost rendering + microsite | /events boost sort + badge, detail page enrichment (level-gated), /my-events status | medium |
| #3 Social handoff + expiry sweep | buffer writer, spread scheduler, daily sweep, admin visibility | small |

Each PR: full gates (tsc, vitest, prettier), CI green, review threads resolved before merge. No deploy until all three merge + your explicit approval.

## 8. Open decisions for you

1. **Pricing** — keep $19/$49/$149? Or different tiers/prices?
2. **Who can buy** — any signed-in organizer who submitted the event, or admins only for now?
3. **Social posts on paid tier** — flow through human approval (my default) or auto-post since they're paid?
4. **Microsite** — enrich canonical event page (my recommendation, no new SEO surface) vs. separate /events/:slug/promoted URL?
5. **Refunds** — auto-cancel promotion on Stripe refund (my default), or manual review?
