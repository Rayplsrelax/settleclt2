# Settle CLT Hermes Revenue + Lead Operations Agent

## Purpose

This agent turns Settle CLT into a weekly/daily revenue operations system. It watches existing Settle CLT business data and creates draft-only operator tasks for:

- realtor lead follow-up
- business claim review
- paid listing payment recovery
- canceled listing winback
- monthly paid-listing value reports
- microsite launch checks
- weekly growth summaries

## Safety rule

The agent does not send outreach automatically.

Every task is created as:

```txt
status: draft_only
sendAutomatically: false
requiresHumanApproval: true
```

The owner/admin must review and send messages manually.

## Data sources

The agent uses existing Settle CLT tables and helpers:

- referrals / realtor leads
- business claims
- premium listings
- microsite launch status config

It does not create a free-trial system. Settle CLT is not VieworaTV. The goal is owner/realtor/local-business revenue operations.

## Admin router

Added tRPC router:

```txt
hermesRevenueOps.snapshot
hermesRevenueOps.tasks
hermesRevenueOps.draft
```

### snapshot

Returns:

```txt
summary
tasks
```

### tasks

Returns due draft-only revenue tasks.

### draft

Input:

```json
{ "taskId": "claim-123" }
```

Returns a human-review draft for that task.

## CLI report

Run:

```bash
pnpm exec tsx scripts/hermes-revenue-ops-report.ts
```

This prints:

- weekly summary
- due tasks
- draft subjects
- sendAutomatically flags

If DATABASE_URL is not configured, live DB rows may be empty; the pure planner is still tested independently.

## Revenue lanes

### Realtor lead follow-up

Input:

- lead score
- lead priority
- next action due date
- lead status

Output:

- same-day hot lead tasks
- qualified lead follow-ups
- nurture follow-ups

### Business claim review

Input:

- pending business claims

Output:

- listing-confirmation-first email drafts
- no hard sell
- no guaranteed lead claims
- paid upgrade only after public listing accuracy is confirmed

### Paid listing recovery

Input:

- premium listings with paymentStatus = past_due

Output:

- billing-help draft
- no pressure language
- option to keep basic listing if paid placement is not useful

### Canceled listing winback

Input:

- premium listings with paymentStatus = canceled

Output:

- reason/feedback draft
- performance recap offer
- restart only if useful

### Monthly value reports

Input:

- active featured/premium listings
- views, clicks, leads this period

Output:

- monthly report task
- listing improvement recommendation

### Microsite launch checks

Input:

- configured microsite domains and statuses

Output:

- DNS/HTTPS/UTM/sitemap checks
- Google Search Console action reminder

## Current microsites tracked

```txt
movingtocharlotteguide.com
charlotteweekendevents.com
charlottejobmarket.com
charlotteneighborhoodsguide.com
charlottehomepros.org
```

## Manual daily loop

1. Open admin revenue dashboard.
2. Review Hermes revenue ops snapshot/tasks.
3. Handle urgent realtor leads first.
4. Review pending claims.
5. Handle payment recovery and cancellations.
6. Prepare paid-listing value reports.
7. Check microsite launch/indexing tasks.
8. Send only approved messages manually.
9. Update statuses in the normal admin tools.

## Weekly loop

1. Run the Hermes revenue report script.
2. Review estimated listing MRR.
3. Count hot leads, pending claims, past-due listings, and microsite blockers.
4. Pick the next 5 manual actions.
5. Do not mark outreach sent unless it was actually sent.

## Compliance guardrails

- No guaranteed leads.
- No exclusive/objective ranking claims.
- No paid placement disguised as neutral ranking.
- Use listing accuracy and public-info confirmation as the first touch.
- For realtor leads, avoid Fair Housing steering language.
- Keep neighborhood/service-area language neutral and user-led.
- Paid upgrades are optional and should come after a response/confirmation.
