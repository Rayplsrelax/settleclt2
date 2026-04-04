# Settle CLT — Pre-Launch Audit & Roadmap

**Audit Date:** April 4, 2026  
**Domain:** settleclt.com  
**Status:** Development / Soft Launch  

---

## Executive Summary

Settle CLT is a comprehensive Charlotte relocation guide with 713 local businesses across 54 categories, 140 events across 10 categories, 20 neighborhoods, gamification features (passport, bingo, leaderboard), a blog, business claiming, premium listings with Stripe billing, referral tracking, and a real estate connection service. The platform is feature-rich and largely production-ready. This audit identifies **must-fix issues**, **should-fix improvements**, and **nice-to-have enhancements** before a full public launch.

---

## 1. MUST-FIX (Launch Blockers)

These issues could cause broken functionality, SEO penalties, or legal/compliance problems.

### 1.1 Sitemap URL Mismatch
| Issue | Detail |
|---|---|
| **Problem** | Sitemap generates `/privacy-policy` and `/terms-of-service` but actual routes are `/privacy` and `/terms` |
| **Impact** | Google will crawl 404 pages, hurting SEO |
| **Fix** | Update sitemap static pages array in `server/_core/index.ts` lines 145-146 to use `/privacy` and `/terms` |
| **Effort** | 5 minutes |

### 1.2 Missing OG Image
| Issue | Detail |
|---|---|
| **Problem** | No `og:image` or `twitter:image` meta tags in `client/index.html` |
| **Impact** | Social media shares show no preview image — significantly reduces click-through rate |
| **Fix** | Design a 1200x630 OG image, upload to CDN via `manus-upload-file --webdev`, add meta tags |
| **Effort** | 30 minutes |

### 1.3 Missing Favicon
| Issue | Detail |
|---|---|
| **Problem** | No `<link rel="icon">` tag in `client/index.html`, no favicon.ico in public/ |
| **Impact** | Browser tabs show generic icon, looks unprofessional |
| **Fix** | Generate favicon set (16x16, 32x32, apple-touch-icon 180x180), add to public/ and index.html |
| **Effort** | 20 minutes |

### 1.4 Meta Description Outdated
| Issue | Detail |
|---|---|
| **Problem** | Meta description says "400+ local businesses" but we have 713 |
| **Impact** | Misleading to users and search engines |
| **Fix** | Update all three description meta tags in `client/index.html` to say "700+ local businesses" |
| **Effort** | 5 minutes |

### 1.5 Broken `/admin` Link
| Issue | Detail |
|---|---|
| **Problem** | `AdminClaims.tsx` line 88 links to `/admin` which has no route — leads to 404 |
| **Impact** | Admin users clicking "back" from Claims page hit a dead end |
| **Fix** | Change to `/admin/enrich` or remove the back link |
| **Effort** | 5 minutes |

### 1.6 Stripe Sandbox Not Claimed
| Issue | Detail |
|---|---|
| **Problem** | Stripe test sandbox must be claimed before June 1, 2026 |
| **Impact** | Premium listings payment flow will stop working after expiry |
| **Fix** | Claim at https://dashboard.stripe.com/claim_sandbox/... and eventually add live keys in Settings → Payment |
| **Effort** | 10 minutes |

---

## 2. SHOULD-FIX (High Priority Improvements)

These improve user experience, SEO, and operational readiness.

### 2.1 Missing Footer Link: Find Your Home
| Issue | Detail |
|---|---|
| **Problem** | "Find Your Home" is in the navbar but missing from the footer |
| **Impact** | Reduced discoverability of the real estate referral feature |
| **Fix** | Add to Footer.tsx in the "Getting Started" section |
| **Effort** | 5 minutes |

### 2.2 No Cookie Consent Banner
| Issue | Detail |
|---|---|
| **Problem** | Site uses Mixpanel analytics and session cookies but has no cookie consent banner |
| **Impact** | May violate GDPR/CCPA if users from EU/California visit; Privacy Policy mentions cookies but no opt-out mechanism |
| **Fix** | Add a simple cookie consent banner component |
| **Effort** | 1-2 hours |

### 2.3 No Account Deletion Mechanism
| Issue | Detail |
|---|---|
| **Problem** | No way for users to delete their account or request data deletion |
| **Impact** | Required by CCPA and GDPR; Privacy Policy promises "right to deletion" but no UI exists |
| **Fix** | Add "Delete Account" button to Profile page with confirmation dialog |
| **Effort** | 2-3 hours |

### 2.4 No Contact Page
| Issue | Detail |
|---|---|
| **Problem** | No dedicated contact page; only email reference is `hello@settleclt.com` in the claim dialog |
| **Impact** | Users have no clear way to reach support |
| **Fix** | Add a simple Contact page or add contact info to the footer |
| **Effort** | 30 minutes - 1 hour |

### 2.5 Event Images Missing
| Issue | Detail |
|---|---|
| **Problem** | Many of the 140 events lack cover images |
| **Impact** | Events page looks sparse without visual content |
| **Fix** | Source event images from venues/organizers, upload to CDN, update event records |
| **Effort** | 2-4 hours |

### 2.6 Blog Content Expansion
| Issue | Detail |
|---|---|
| **Problem** | Only 9 blog posts currently published |
| **Impact** | Thin content for SEO; blog is a key traffic driver |
| **Fix** | Use the settle-clt-blog-research skill to generate 10-20 more posts |
| **Effort** | 3-5 hours |

---

## 3. NICE-TO-HAVE (Post-Launch Enhancements)

These would improve the platform but are not blocking launch.

### 3.1 Performance Optimizations
- **Lazy-load enrichment data on Directory page** — currently fetches all 388 enrichments on page load
- **Add image lazy loading** — use `loading="lazy"` on business photos in directory cards
- **Consider pagination** for the directory (713 items rendered at once)

### 3.2 Feature Enhancements
- **Price Range filter** on Directory page (enrichment data already has Google price levels)
- **Settle Score radar chart** on business detail pages (deferred — needs chart library)
- **Show business override data** on directory cards (claimed business custom hours/descriptions)
- **Admin dashboard overview page** at `/admin` — currently no landing page, just individual tools
- **Bulk area re-detection** — run new `detectArea` logic on existing custom listings

### 3.3 Content & Data
- **Enrich more businesses** — 388 of 713 have Google Places data (54%); target 80%+
- **Add more bingo cards** — gamification content to increase engagement
- **Add user-generated reviews** — currently 0 reviews in database
- **Expand sports & recreation data** — leverage the sportsRec.ts data more

### 3.4 SEO & Marketing
- **Add canonical URLs** to all pages
- **Add structured data** for events (Event schema), businesses (LocalBusiness schema)
- **Create a Google Business Profile** for Settle CLT itself
- **Set up Google Search Console** and submit sitemap
- **Add social media links** to footer (Instagram, TikTok, etc.)

### 3.5 Operational
- **Set up email service** for newsletter delivery (currently collecting subscribers but no send mechanism)
- **Configure notification webhooks** for critical events (new referrals, business claims)
- **Set up error monitoring** (Sentry or similar) for production error tracking
- **Database backup strategy** — ensure regular backups of user data

---

## 4. Current Feature Inventory

### Public Pages (12)
| Page | Route | Status |
|---|---|---|
| Home / Landing | `/` | Complete |
| Neighborhoods | `/neighborhoods` | Complete |
| Neighborhood Detail | `/neighborhood/:id` | Complete (20 neighborhoods) |
| Directory | `/directory` | Complete (713 businesses, 54 categories) |
| Business Detail | `/directory/:slug` | Complete (with enrichment, reviews, photos) |
| Events | `/events` | Complete (140 events, 10 categories) |
| Blog | `/blog` | Complete (9 posts) |
| Blog Article | `/blog/:slug` | Complete |
| Neighborhood Quiz | `/quiz` | Complete |
| Compare Neighborhoods | `/compare` | Complete |
| Find Your Home | `/find-your-home` | Complete (referral form with NCREC disclosure) |
| List Your Business | `/list-your-business` | Complete |

### User Features (6)
| Feature | Route | Status |
|---|---|---|
| Profile | `/profile` | Complete |
| CLT Passport | `/passport` | Complete (stamp collection) |
| CLT Bingo | `/bingo` | Complete (bingo cards) |
| Wishlist | `/wishlist` | Complete |
| Leaderboard | `/leaderboard` | Complete |
| Submit Event | `/submit-event` | Complete (draft → admin approval) |

### Admin Pages (7)
| Page | Route | Status |
|---|---|---|
| Enrich Directory | `/admin/enrich` | Complete (Google Places enrichment + smart area detection) |
| Blog Editor | `/admin/blog` | Complete (CRUD with markdown) |
| Events Manager | `/admin/events` | Complete (CRUD + approval) |
| Analytics | `/admin/analytics` | Complete (tag engagement, search queries) |
| Monthly Digest | `/admin/digest` | Complete |
| Referrals | `/admin/referrals` | Complete (status tracking, follow-up) |
| Business Claims | `/admin/claims` | Complete (approve/reject workflow) |

### Business Owner Features (2)
| Feature | Route | Status |
|---|---|---|
| Claim Business | Dialog on detail page | Complete |
| My Business Dashboard | `/my-business` | Complete (override hours, description, photos) |

### Monetization (1)
| Feature | Status |
|---|---|
| Premium Listings (Stripe) | Complete (Basic/Featured/Premium tiers, checkout, webhooks) |

### Gamification (3)
| Feature | Status |
|---|---|
| CLT Passport | Complete (stamp collection, shareable card) |
| CLT Bingo Cards | Complete (multiple cards, progress tracking) |
| Leaderboard | Complete (points, rankings, badges) |

### SEO & Technical (5)
| Feature | Status |
|---|---|
| Dynamic Sitemap | Complete (800+ URLs) |
| Robots.txt | Complete |
| Structured Data (JSON-LD) | Complete (WebSite, LocalBusiness, BlogPosting) |
| Lazy-loaded Routes | Complete (29 lazy imports) |
| Error Boundary | Complete |

### Integrations (5)
| Integration | Status |
|---|---|
| Manus OAuth | Complete |
| Stripe Payments | Complete (test mode) |
| Google Maps (Places API) | Complete (enrichment + map views) |
| Mixpanel Analytics | Complete |
| Umami Analytics | Complete |

---

## 5. Database Summary

| Table | Records | Notes |
|---|---|---|
| users | 2 | Owner + 1 test user |
| events | 140 | 10 categories, March-October 2026 |
| blog_posts | 9 | All published |
| enriched_services | 388 | 54% of 713 businesses enriched |
| tags | 24 | Content tagging system |
| content_tags | 92 | Tag-content associations |
| tag_engagement | 1,589 | User interaction tracking |
| newsletter_subscribers | 1 | Need email delivery setup |
| passport_entries | 1 | Test data |
| bingo_progress | 1 | Test data |
| wishlists | 1 | Test data |
| directory_listings | 1 | Admin-added listings |
| comments | 0 | No user comments yet |
| reviews | 0 | No user reviews yet |
| referrals | 0 | No referral submissions yet |
| business_claims | 0 | No claims yet |
| premium_listings | 0 | No premium subscribers yet |

---

## 6. Test Coverage

- **29 test files** with **342 tests**, all passing
- Coverage areas: auth, services data, enrichment, events/tags, directory enhancements, area detection, premium listings, reviews, referrals, claims, bingo, leaderboard, SEO, notifications, newsletter, quiz, sports/rec, trending, community features, analytics

---

## 7. Automated Tasks

| Task | Schedule | Description |
|---|---|---|
| Monthly Event Refresh | 1st of each month, 9:00 AM | Scan Charlotte sources, add 5-10 events per category, archive expired events |

---

## 8. Skills Created

| Skill | Purpose |
|---|---|
| `settle-clt-event-scout` | Research and gather Charlotte events across all categories |
| `settle-clt-content-scout` | Discover businesses, events, stories for the platform |
| `settle-clt-blog-research` | Research and generate blog content ideas |

---

## 9. Recommended Launch Sequence

### Phase 1: Fix Blockers (1-2 hours)
1. Fix sitemap URL mismatch
2. Create and add OG image
3. Create and add favicon
4. Update meta descriptions to "700+"
5. Fix broken `/admin` link
6. Claim Stripe sandbox

### Phase 2: Compliance & Trust (3-5 hours)
1. Add cookie consent banner
2. Add account deletion mechanism
3. Add contact page or footer contact info
4. Verify all legal pages are accurate

### Phase 3: Content Expansion (5-10 hours)
1. Source event images for all 140 events
2. Write 10-20 more blog posts
3. Enrich remaining 325 businesses with Google Places data
4. Add more bingo cards

### Phase 4: Marketing & Growth (Ongoing)
1. Set up Google Search Console
2. Create social media accounts
3. Set up newsletter email delivery
4. Configure error monitoring
5. Plan community launch event
