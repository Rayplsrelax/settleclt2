# Mixpanel Tracking Plan — Settle CLT

This document defines the event taxonomy and property schema for Settle CLT's Mixpanel analytics implementation.

---

## Core Events

### Page View

Fires on every route change via `useMixpanelPageView` hook.

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| page | string | `/neighborhood/dilworth` | Route path |
| full_url | string | `https://settleclt.com/neighborhood/dilworth?utm_source=google` | Complete URL with query params |
| referrer | string | `https://google.com/` | Document referrer |
| utm_source | string | `google` | UTM source parameter |
| utm_medium | string | `organic` | UTM medium parameter |
| utm_campaign | string | `seo-july-2026` | UTM campaign parameter |
| utm_content | string | `events-cta` | UTM content parameter |
| utm_term | string | `charlotte events` | UTM term parameter |

### Search

Fires when user performs a search.

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| query | string | `breweries noda` | Search query text |
| result_count | number | `12` | Number of results returned |
| source | string | `global-search` | Where the search was initiated |

### Tag Click

Fires when user clicks a tag/category filter.

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| tag_name | string | `Breweries` | Display name of the tag |
| tag_slug | string | `breweries` | URL-safe tag identifier |
| surface | string | `events-filter` | UI surface where click occurred |

### Passport Stamp

Fires when user checks in to a place or event.

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| service_key | string | `noda-brewing` | Business identifier |
| event_slug | string | `speed-street-2026` | Event identifier (if event stamp) |
| type | string | `place` or `event` | Stamp type |

### Bingo Progress

Fires when user completes a bingo card square.

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| card_id | string | `brewery-tour` | Bingo card identifier |
| square_index | number | `4` | Which square was completed |
| card_complete | boolean | `true` | Whether entire card is now complete |

### Business Listing View

Fires when user views a directory listing detail page.

| Property | Type | Example | Description |
|----------|------|---------|-------------|
| service_key | string | `noda-brewing` | Business identifier |
| category | string | `breweries` | Business category |
| area | string | `NoDa` | Business area/neighborhood |

---

## UTM Parameter Strategy

### For Google Search Console tracking

When sharing links or creating campaigns, use these UTM patterns:

```
?utm_source=google&utm_medium=organic
?utm_source=twitter&utm_medium=social&utm_campaign=weekly-events
?utm_source=newsletter&utm_medium=email&utm_campaign=weekly-digest
?utm_source=reddit&utm_medium=social&utm_campaign=neighborhood-guide
```

### For internal cross-linking

When linking from blog posts or emails to key pages:

```
/events?utm_source=blog&utm_medium=internal&utm_campaign=events-cta
/things-to-do?utm_source=homepage&utm_medium=internal&utm_content=hero-cta
```

---

## Mixpanel Dashboard Setup

### Key Funnels

1. **Visitor → Signup**: Page View → Sign In Click → Auth Complete
2. **Visitor → Engagement**: Page View → Search/Filter → Business View → Passport Stamp
3. **Blog → Conversion**: Blog Page View → Internal Link Click → Neighborhood/Directory View

### Key Segments

- **Traffic source**: utm_source (google, twitter, newsletter, direct)
- **Content type**: page path prefix (/neighborhood, /events, /blog, /directory)
- **User type**: authenticated vs anonymous
- **Geography**: referrer domain patterns

### Weekly KPIs to Monitor

| KPI | Target | How to Measure |
|-----|--------|---------------|
| Organic traffic | +10% MoM | Page Views where utm_source = google OR referrer contains google |
| Events page engagement | > 2 min avg | Time on /events page |
| Blog CTR from search | > 3% | GSC data cross-referenced with Mixpanel |
| Signup conversion | > 2% | Funnel: Page View → Auth Complete |
| Passport adoption | > 5% of signups | Users with 1+ stamp / total signups |

---

## Implementation Notes

- All tracking is client-side via the `@/lib/mixpanel` module
- Mixpanel token is set via `VITE_MIXPANEL_TOKEN` environment variable
- Page views auto-fire via `useMixpanelPageView` hook in the Router component
- Custom events use `trackEvent(name, properties)` from the mixpanel lib
- Tag engagement is tracked server-side in the `tag_engagement` table AND client-side in Mixpanel
