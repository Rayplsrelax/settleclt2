# Settle CLT — Project TODO

- [x] Design system: Charlotte-inspired color palette, typography, global CSS variables
- [x] Dark/light theme toggle with persistent localStorage preference
- [x] Shared data: neighborhoods.ts with 8 neighborhoods (stats, narratives, tips, comparisons)
- [x] Shared data: services.ts with 400+ businesses across 40 categories / 6 super groups
- [x] Shared data: articles.ts for blog content
- [x] Home page: hero, featured neighborhoods, directory CTA, lead form teaser
- [x] Neighborhoods listing page: 8 clickable cards with stats, tags, descriptions
- [x] Neighborhood detail page: hero, stats bar, day-in-the-life, cost, honest truths, first weekend, moving-from comparisons, directory CTAs
- [x] Services directory page: search, super group tabs, category filters, area filter dropdown
- [x] Directory deep-link support from neighborhood pages (?category=&area=&neighborhood=)
- [x] My-neighborhood personalization via localStorage (banner + sort priority)
- [x] Moving quotes lead capture form (name, email, from-city, move-date)
- [x] Business listing submission form
- [x] Blog section with article cards and detail view
- [x] Responsive mobile-first design for all screen sizes
- [x] tRPC backend: lead capture endpoint with DB persistence
- [x] tRPC backend: business listing submission endpoint with DB persistence
- [x] Navigation: top nav with links to all sections
- [x] Vitest tests for backend endpoints
- [x] Final checkpoint and delivery
- [x] Remove "Get Free Moving Quotes" section from home page
- [x] Remove "Get Moving Quotes" link from footer
- [x] Add real Unsplash photos to neighborhood cards on home page
- [x] Add Charlotte skyline hero image behind headline
- [x] Replace quotes section with newsletter signup
- [x] Add "How Settle CLT Works" explainer section
- [x] Show 4 featured neighborhoods instead of 3
- [x] Add real images to blog preview cards (code supports images; data uses gradients as fallback)
- [x] Replace all generic Unsplash neighborhood photos with authentic Charlotte NC neighborhood-specific photos
- [x] Move "List Your Business" CTA section above newsletter on home page
- [x] Evaluate neighborhood listing and detail pages (pros, cons, gaps)
- [x] Rework neighborhood pages based on evaluation
- [x] Build neighborhood comparison tool
- [x] Expand neighborhoods data: add localsLove, localsDontLove, hiddenGems, keyPlaces, monthlyCosts, settlingTimeline arrays
- [x] Listing page: Add filter bar (budget/lifestyle/walkability)
- [x] Listing page: Add compare checkboxes on cards
- [x] Listing page: Remove adjacent neighborhood labels from cards
- [x] Listing page: Show more stats (home price, schools, nightlife, pet, family)
- [x] Detail page: Add photo carousel in hero
- [x] Detail page: Add sticky section navigation
- [ ] Detail page: Add Settle Score radar chart (deferred — no chart library conflict)
- [x] Detail page: Add "Vibe Check" locals love / don't love section
- [x] Detail page: Add embedded map placeholder with key places
- [x] Detail page: Enrich services section with actual business cards
- [x] Detail page: Break up text walls with pull quotes
- [x] Detail page: Add "Hidden Gems" insider section
- [x] Detail page: Add "Timeline to Settled" progress tracker
- [x] Build /compare page with side-by-side neighborhood comparison
- [x] Add compare route to App.tsx
- [x] Remove "Honest Truth" section from all neighborhood detail pages (redundant with Vibe Check)
- [x] Remove "Your First 48 Hours" section from all neighborhood detail pages (redundant with Timeline to Settled)
- [x] Transform stats bar into an easy-to-read visual graphic (radar chart with stat cards)
- [x] Add interactive Google Map to neighborhood detail pages with key places markers and legend
- [x] Fix: Google Maps JavaScript API loaded multiple times on neighborhood detail pages
- [x] Fix: Cannot unfavorite a neighborhood (Set as my neighborhood button doesn't toggle off)
- [x] Audit all directory business listings for broken website links and closed businesses
- [x] Remove invalid/closed businesses from services data (63 removed: 54 DNS dead + 9 parked domains)
- [x] Add metro Charlotte areas to neighborhoods page, visually distinguished from core neighborhoods
- [x] Add interactive map to the directory page showing business locations
- [x] Clean up junk area values in services data (Online, Anywhere, Expanding, etc. → Charlotte Metro)
- [x] Group directory area dropdown into Core Neighborhoods and Metro Charlotte optgroups
- [x] Add services data integrity tests (24 tests passing)
- [x] Remove duplicate neighborhoods between core and metro sections (University City kept in core only, Mecklenburg County removed)
- [x] Upgrade metro Charlotte areas to match core neighborhood card design (photos, stats, tags, descriptions)
- [x] Add rich data models for 12 metro areas (same Neighborhood interface as core: stats, costs, hidden gems, day-in-life, etc.)
- [x] Find and upload 36 authentic photos for all 12 metro areas to CDN
- [x] Unified detail pages: metro areas use same NeighborhoodDetail component with full guides
- [x] Updated Compare tool, Directory, and Home page to use allNeighborhoods (20 total)
- [x] Fix: Remove University City from METRO_AREA_NAMES dropdown (already in core; was never duplicated in metro data)
- [x] Fix: Remove Mecklenburg County from services area values (7 entries → Charlotte Metro)
- [x] Build "Find Your Neighborhood" quiz page with step-by-step questions
- [x] Design scoring algorithm mapping quiz answers to all 20 neighborhoods
- [x] Build results page with top 3 ranked matches, scores, and CTAs
- [x] Add quiz route to App.tsx and navigation links
- [x] Add quiz entry points on Home page and Neighborhoods page
- [x] Write vitest tests for the quiz scoring algorithm (20 tests)
- [x] Create shared sportsVenues data model for Charlotte teams and venues (7 venues)
- [x] Add sportsRec data model (nearby venues, fan culture, rec highlights, parks, fitness, youth sports)
- [x] Populate sportsRec data for all 20 neighborhoods + Ballantyne fix
- [x] Build Sports & Recreation section in NeighborhoodDetail page with sticky nav tab
- [x] Write tests for sports data integrity (7 tests, 57 total passing)
- [x] Phase 1: Auth UI — Add login button to navigation bar (visible when logged out)
- [x] Phase 1: Auth UI — Add user avatar dropdown menu (visible when logged in) with profile link and logout
- [x] Phase 1: Auth UI — Build user profile page showing name, avatar, and account info
- [x] Phase 1: Auth UI — Create reusable AuthGate component (prompts login when accessing protected features)
- [x] Phase 1: Auth UI — Add /profile, /passport, /wishlist routes to App.tsx
- [x] Phase 1: Auth UI — All existing pages remain fully public; protected features use AuthGate
- [x] Phase 5: Admin blog editor for creating/editing posts in-browser
- [x] Phase 2: Google Places admin enrichment tool (Option A) — COMPLETED
- [x] Phase 3: CLT Passport — track visited places with stamps
- [x] Phase 3: Bingo cards — themed challenge boards
- [x] Phase 3: Wishlist — save places with notes
- [x] Phase 4: Reddit-style comments on neighborhoods and businesses
- [x] Phase 2: Create enriched_services database table (service_key, google_place_id, rating, review_count, hours, address, phone, photos)
- [x] Phase 2: Build admin-only tRPC procedures for Google Places text search + details + apply
- [x] Phase 2: Build admin-only tRPC procedure to save enrichment data to DB
- [x] Phase 2: Build admin enrichment page UI with search, preview cards, and apply button
- [x] Phase 2: Add admin route (/admin/enrich) and admin nav link in user dropdown
- [x] Phase 2: Display enriched data (Google rating, review count, price level) on directory listing cards
- [x] Phase 2: Write vitest tests for enrichment (8 tests, 72 total passing)
- [x] Phase 3: CLT Passport — create passport_entries DB table
- [x] Phase 3: CLT Passport — create bingo_cards and bingo_progress DB tables
- [x] Phase 3: Wishlist — create wishlists DB table
- [x] Phase 3: Build tRPC procedures for passport check-in, wishlist add/remove, bingo progress
- [x] Phase 3: Build Passport page UI with stamp collection, stats, and bingo cards
- [x] Phase 3: Build Wishlist page UI with saved places and notes
- [x] Phase 3: Add heart/save buttons to directory listing cards (WishlistButton component)
- [x] Phase 3: Add check-in button to directory listing cards for passport stamps
- [x] Phase 4: Comments — create comments DB table
- [x] Phase 4: Comments — create comment_votes DB table
- [x] Phase 4: Build tRPC procedures for comments CRUD, voting, and threaded replies
- [x] Phase 4: Build threaded CommentSection component with upvotes/downvotes and replies
- [x] Phase 4: Add comment sections to neighborhood detail pages (Community tab)
- [x] Phase 4: Comment sections available on neighborhood pages
- [x] Phase 5: Blog — create blog_posts DB table
- [x] Phase 5: Build tRPC procedures for blog CRUD (admin-only create/edit/delete, public read)
- [x] Phase 5: Build admin blog editor page with markdown editing and preview
- [x] Phase 5: Update blog listing to show DB posts alongside static articles, add BlogArticle detail page
- [x] Phase 5: Write vitest tests for all community features (22 tests, 94 total passing)
- [x] Enrich 20-30 top directory listings via Google Places API (ratings, reviews, hours)
- [x] Write and publish 3-5 blog articles (Moving to Charlotte Checklist, Best Brunch Spots, Charlotte vs Raleigh, etc.)
- [x] Create 3-4 themed bingo cards for CLT Passport (Brewery Tour, Best Coffee, Date Night, etc.)
- [x] Wire up email notifications for business submissions, newsletter signups, and bingo completions
- [x] Write vitest tests for notification triggers (7 tests, 101 total passing)
- [x] Batch-enrich 50+ more directory listings via Google Places API (93/95 enriched — restaurants, breweries, attractions, fitness, grocery, healthcare, coworking, childcare, pets, auto, salons, barbers)
- [x] Build shareable CLT Passport card — social-media-ready image for bingo card completions
- [x] Write vitest tests for bingo cards API and enrichment (6 tests, 107 total passing)
- [x] Add BingoCards page with interactive grid, progress tracking, and share card generation
- [x] Add /bingo route and navigation links (Navbar dropdown + Profile page)
- [x] Batch-enrich remaining ~200 directory listings via Google Places API (184/197 enriched — 308/322 total, 96% coverage)
- [x] Build leaderboard page showing top CLT explorers by bingo completions and passport stamps
- [x] Add leaderboard tRPC procedures (public read — byStamps, byBingo, byNeighborhoods)
- [x] Add /leaderboard route and navigation links (Navbar dropdown + Profile page)
- [x] Write vitest tests for leaderboard feature (6 tests, 113 total passing)
- [x] Remove moving quote request form (backend routes, db helper, schema, tests, notifications)
- [x] Remove "How It Works" section from homepage
- [x] Remove dark mode toggle and lock to light theme (Navbar, App.tsx ThemeProvider)

## Strategic Plan — Phase 1: Events & Tags
- [x] Clean up Footer links (added Events, CLT Passport, Bingo, Leaderboard, Neighborhood Quiz)
- [x] Build Events data model (schema, migration, db helpers)
- [x] Build Tagging system data model (tags + content_tags tables)
- [x] Build Events tRPC procedures (CRUD, public list, admin management)
- [x] Build Tags tRPC procedures (tag pages, content aggregation)
- [x] Build Events page frontend (list view, filters, event detail)
- [x] Build admin event management page
- [x] Build "This Week in CLT" homepage section
- [x] Build Tag pages (aggregate content by tag) + /tag/:slug route
- [x] Seed initial Charlotte events data (52 events seeded — March through June 2026)
- [x] Add /events to main navigation (Navbar + Footer + admin dropdown)
- [x] Write vitest tests for events and tags (10 tests, 117 total passing)

## Strategic Plan — Phase 2: Content Velocity & Discovery
- [x] Build global search bar in navbar (search across neighborhoods, directory, events, blog)
- [x] Build search results page with grouped results by content type (using cmdk CommandDialog)
- [x] Add directory listings section to neighborhood detail pages ("Local Businesses in X") with enriched ratings
- [x] Add neighborhood tag/badge to directory listing cards (category grouping + "Browse all" CTA)
- [x] Promote CLT Passport to main navigation (visible to all users)
- [x] Build public CLT Passport landing page (hero, how it works, features, CTA — shows for non-logged-in users)
- [x] Write 4 new blog articles: This Weekend in CLT, NoDa Deep Dive, Charlotte Summer Survival Guide, Date Night Guide
- [x] Tag existing content with the tagging system (24 tags, 92 content-tag associations across events + blog posts)
- [x] Write vitest tests for Phase 2 features (10 tests, 127 total passing across 14 test files)

## CLT Passport Events + Strategic Plan Phase 3
- [x] Add events to CLT Passport (stamp events attended, eventSlug column, tabbed UI with All/Places/Events filters)
- [x] Build user-submitted events feature (submit form at /submit-event, draft status, admin approval, owner notification, CTA on Events page)
- [x] Build live activity feed (recent stamps, comments, bingo progress — auto-refreshes every 30s, homepage section + reusable component)
- [x] Add social sharing buttons across all pages (Events, BlogArticle, NeighborhoodDetail, Passport, BingoCards, Leaderboard, Directory, Compare, Quiz results, TagPage — Twitter/X, Facebook, Email, Copy Link, native share)
- [x] Write vitest tests for Phase 3 features (7 tests, 134 total passing across 15 test files)

## Improvements Round
- [x] Fix admin directory: rebuild to search Google Places for ANY Charlotte business and add to directory
- [x] Merge newsletter subscription into site signup flow (newsletterOptIn column, default true on signup)
- [x] Add newsletter toggle to user profile settings (Profile page Preferences section)
- [x] Build blog research skill (AI-powered admin tool at /admin/research — generates ideas from Charlotte sources, creates outlines, drafts full posts)
- [x] Implement trending tags: tag_engagement table, trending router, "Trending in CLT" homepage section, auto-tracking on tag page views and clicks

## Blog Research → Manus Skill Migration
- [x] Remove Blog Research Lab page from website (/admin/research route, AdminResearch.tsx)
- [x] Remove Blog Research navbar link from admin dropdown
- [x] Remove blog research router procedures from routers.ts
- [x] Remove blog research db helpers from db.ts
- [x] Remove blog_research_ideas schema from drizzle/schema.ts
- [x] Drop blog_research_ideas table from database
- [x] Remove blog research test file
- [x] Build standalone Manus skill for blog research (SKILL.md + scripts + references)

## GitHub & Trending Data
- [x] Push settle-clt-blog-research skill to Rayplsrelax/clt GitHub repo (skills/settle-clt-blog-research/)
- [x] Seed trending tag engagement data in the database (1,559 records across 24 tags, top 8 trending visible on homepage)

## Tag Engagement Tracking Expansion
- [x] Build reusable useTagTracking hook with TAG_SLUG_MAP for name-to-slug resolution
- [x] Track tag clicks on Events page (category filter buttons, event card category/neighborhood badges)
- [x] Track tag clicks on Blog page (category filter pills)
- [x] Track tag clicks on Directory page (group chips, category chips, area dropdown)
- [x] Track tag clicks on Neighborhood detail pages (hero tags)
- [x] Track tag clicks on Home page (featured neighborhood tags, ThisWeekInCLT event categories)
- [x] Track tag clicks on Neighborhoods listing page (core + metro card tags)
- [x] Track tag views on TagPage (already existed)
- [x] Write vitest tests for tag tracking (17 tests in tag-tracking.test.ts, all 158 tests pass)

## Feature Round 2
- [x] Add "What's Coming" sections to neighborhood detail pages (future developments for 10+ neighborhoods with real CLT data)
- [x] Build Admin Analytics Dashboard (/admin/analytics) — stacked bar chart, pie chart, area chart, trending velocity, popular searches, CSV export
- [x] Add search query tracking — tracks searches on dialog close and result selection, with result count and source
- [x] Surface popular search terms in global search dialog empty state + analytics dashboard
- [x] Build personalized recommendations — "For You" homepage section with top interests, recommended neighborhoods, events, and directory listings
- [x] Write tests for all new features (179 tests across 18 test files, all passing)

## Feature Round 3
- [x] Integrate Mixpanel free tier — SDK installed, page views, searches, tag clicks, review submissions, user identification on login/logout
- [x] Build "What's New This Month" admin digest — /admin/digest page with preview, AI-generated HTML email, stats
- [x] Send digest email to newsletter subscribers via notifyOwner system
- [x] Build community reviews system — reviews table, star ratings + tips, aspect tags (vibe/food/safety/transit/nightlife/cost)
- [x] Display reviews on neighborhood detail pages (full ReviewSection) and directory listings (ReviewStars compact)
- [x] Add review moderation for admin (toggleVisibility, adminList, delete by owner or admin)
- [x] Write tests for all new features (203 tests across 20 test files, all passing)

## Bug Fixes
- [x] Research correct 2026 dates for all 52 Charlotte events (researched all via parallel subtasks)
- [x] Update events with verified dates in database (30+ events corrected — dates, times, venues, names)
- [x] Remove fictional/unverifiable events from database (12 removed: 5 fictional, 4 past one-time, 1 duplicate, 2 unverifiable → 40 events remaining)

## Previous Prompt — Remaining Items
- [x] Passport UX: Add searchable typeahead for adding stamps (events + places)
- [x] Passport UX: Remove "Browse Event" button from stamp expanded view (not needed)
- [x] Events: Auto-expire events one month after end date on Events page (added filtering in router)
- [x] Events: Keep expired events visible in CLT Passport (Passport passes includeExpired: true)
- [x] Bingo: Verify all bingo card items exist in directory and fix slug mismatches
- [x] Directory: Add Food Truck category and research real CLT food trucks to add
- [x] Directory: Add Coffee Shops category with real CLT coffee shops
- [x] Directory: Add service-based businesses (Booksy, StyleSeat, etc.)
- [x] Fix phone UI overlapping text on passport and other pages (stats grid 2-col on mobile, responsive header)
- [x] Build real estate referral collection system (FindRealtor page + AdminReferrals + tRPC procedures)
- [x] Add "Find a Realtor" link to navbar and "Admin Referrals" to admin dropdown
- [x] Passport UX: Add QuickStampButton to Directory and Event cards (like WishlistButton)

## Enrichment, Referral Notifications & Link Audit
- [x] Enrich new directory entries (food trucks, coffee shops, beauty services) via Google Places (52/56 enriched, 388/393 total)
- [x] Set up email notifications for new referral leads (notifyOwner already fires on every referral submission)
- [x] Audit all links and buttons across the site for correct routing/redirects (20+ pages tested)
- [x] Fix any broken links or buttons found during audit (AdminReferrals back arrow fixed → /)

## SEO Fixes
- [x] Home page: Set document.title to 30-60 characters (58 chars)
- [x] Home page: Add meta description (50-160 characters) (152 chars)
- [x] Home page: Add meta keywords tag (13 keywords)

## SEO Enhancements — Full Site
- [x] Create reusable useSEO hook (title, description, keywords, OG tags)
- [x] Add OG meta tags to index.html as defaults (og:title, og:description, og:image, og:type, og:url)
- [x] Add unique SEO to Home page (migrated to useSEO hook)
- [x] Add unique SEO to Neighborhoods listing page
- [x] Add unique SEO to Neighborhood detail pages (dynamic per neighborhood)
- [x] Add unique SEO to Directory page
- [x] Add unique SEO to Events page
- [x] Add unique SEO to Blog listing page
- [x] Add unique SEO to Blog article pages (dynamic per article)
- [x] Add unique SEO to CLT Passport page
- [x] Add unique SEO to Bingo page
- [x] Add unique SEO to Leaderboard page
- [x] Add unique SEO to Find a Realtor page
- [x] Add unique SEO to Neighborhood Quiz page
- [x] Add unique SEO to Compare page
- [x] Generate XML sitemap with all public routes (42 URLs: 13 static + 20 neighborhoods + 9 blog articles)
- [x] Add JSON-LD structured data for WebSite schema with SearchAction on home page

## Strategic Planning (Research Before Implementation)
- [x] Research: Best realtor referral pipeline/conversion methods across USA
- [x] Research: NC realtor apartment referral legality and fee structures
- [x] Plan: Comprehensive realtor referral pipeline strategy document

## Strategic Plan Implementation
- [x] P1: Add Quiz results → Find a Realtor CTA (pre-fill form with quiz data)
- [x] P2: Remove "Real Estate & Apartments" category from directory (8 entries + category removed, 18 neighborhood links cleaned)
- [x] P3: Add rent vs. buy question to neighborhood quiz (housing_type question added as Q2)
- [x] P4: Enhance Find a Realtor form (rental budget path, How It Works, FAQ, trust signals, quiz link, URL param pre-fill)
- [x] P5: Add Google Maps direction links to directory addresses (uses verifiedAddress from enrichment)
- [x] P6: Add Google Maps direction links to event venue addresses (list cards + detail modal)
- [x] P7: Fix Facebook share button (use window.open popup for all social links)

## Email Notifications & Directory CTA
- [x] Set up email notification to owner when referral form is submitted (enhanced notifyOwner with formatted lead details)
- [x] Update response time from "24hr" to "48 business hours" across all pages (Find a Realtor: 5 references updated)
- [x] Add "Real Estate Help" CTA banner in the directory page linking to Find a Realtor

## Referral Lead Dashboard & Neighborhood CTA
- [x] Lead status column already exists in referrals DB (new, contacted, matched, closed, lost)
- [x] Admin API endpoints already exist (list, updateStatus, stats) — enhanced stats with conversion rate, avg age, monthly trend
- [x] Build admin lead management dashboard UI with KPI cards, pipeline funnel, type breakdown, monthly trend, lead list with urgency badges
- [x] Add Find a Realtor CTA banner to neighborhood detail pages (pre-fill neighborhood name)
## Rename "Find a Realtor" to "Find Your Home"
- [x] Rename all references to "Find a Realtor" → "Find Your Home" across entire codebase (Navbar, App.tsx route, Directory CTA, NeighborhoodDetail CTA, Quiz CTA, FindRealtor page SEO/hero/button, AdminReferrals empty states, sitemap)

## Bug Fixes - Events Navigation & Maps Links
- [x] Fix: Events page has no way to navigate back to main SettleCLT site (wrapped in PageLayout with Navbar+Footer)
- [x] Verify: Google Maps direction links working on directory addresses (confirmed working)
- [x] Verify: Google Maps direction links working on event venue addresses (confirmed working, both list cards and detail modal)

## Homepage CTA, Redirect, Blog Photos, Maps Links Visibility
- [x] Add "Find Your Home" CTA button to homepage hero section (gold button with HomeIcon)
- [x] Set up redirect from /find-a-realtor to /find-your-home (wouter Redirect component)
- [x] Add real Charlotte photography to blog cards (8 CDN images uploaded, articles.ts updated, Blog + Home pages rendering real photos)
- [x] Make Google Maps direction links more visible on ALL directory listings (blue "Get Directions" pill button on every card)
- [x] Make Google Maps direction links more visible on ALL event listings (blue "Directions" pill on list cards + "Get Directions" button in detail modal)

## Comprehensive Assessment Implementation
- [x] P1: Add Privacy Policy page with data collection disclosures
- [x] P1: Add Terms of Service page
- [x] P1: Add links to Privacy Policy and ToS in Footer
- [x] P2: Fix Passport page to show compelling preview for unauthenticated users (already done)
- [x] P2: Fix Bingo page to show compelling preview for unauthenticated users (landing page with card previews, how-it-works, CTA)
- [x] P3: Remove universal "FEATURED" badge — now only shows for affiliate partners (future premium listing revenue)
- [x] P4: Add testimonials/social proof section to Find Your Home page (3 success stories with star ratings)
- [x] P5: Auto-archive past events older than 30 days (filter in frontend useMemo)
- [x] P6: Add CTAs at end of blog articles (Neighborhood Quiz + Find Your Home)
- [x] P7: Add NC Real Estate Commission compliance disclosures to Find Your Home page
- [x] P8: Add referral source tracking to admin dashboard (quiz, neighborhood, directory, direct, blog, homepage)
- [x] P9: Add success stories/testimonials to Find Your Home page (merged with P4)
- [x] P10: Implement follow-up reminders for leads in "new" status >48 hours (alert banner + KPI card in admin dashboard)

## FEATURED Badge Fix & Claim This Business Workflow
- [x] Fix remaining FEATURED badges on directory listing cards (NeighborhoodDetail now requires affiliate)
- [x] Review FEATURED badges on events page (kept — admin-curated spotlight, not universal)
- [x] Design business_claims database table schema (serviceKey, claimant info, role, verification method, status)
- [x] Create backend procedures for submitting and managing claims (submit, checkClaimed, list, updateStatus, stats)
- [x] Add "Claim This Business" button to directory listing cards
- [x] Build claim submission form/dialog (ClaimBusinessDialog component with full form, status checks, success state)
- [x] Build admin review workflow for business claims (AdminClaims page with stats, filter, approve/reject, admin notes)
- [x] Write tests for claim workflow (12 tests: schema, validation, workflow logic, duplicate prevention)

## Email Notifications for Claims
- [x] Send confirmation email to claimant on submission (already in place via notifyOwner)
- [x] Send admin notification when new claim arrives (already in place via notifyOwner)
- [x] Send notification when claim is approved/rejected (added to updateStatus mutation)

## Claimed Business Self-Service Dashboard
- [x] Create business_listing_overrides DB table for owner edits (hours, description, photos, etc.)
- [x] Build backend procedures for business owners to manage their listing (updateListing, uploadPhoto, removePhoto, getOverride, myClaims)
- [x] Create MyBusiness dashboard page for approved claim owners (tabs: Details, Hours, Analytics, Upgrade)
- [x] Add My Business link to user dropdown menu in Navbar
- [ ] Show override data on directory listing cards when available (deferred - needs enrichment map integration)

## Premium Listing Tiers (Stripe)
- [x] Set up Stripe integration via webdev_add_feature (stripe package installed)
- [x] Design premium tiers schema (Basic free, Featured $29/mo, Premium $79/mo)
- [x] Create Stripe products/prices for listing tiers (auto-created on first checkout)
- [x] Build premium upgrade purchase flow (Stripe Checkout + Customer Portal)
- [x] Show tier badges and priority placement on directory (via affiliate flag, tier-aware)
- [x] Add listing analytics for premium tier owners (views, clicks, leads tracking)
- [x] Handle Stripe webhooks (checkout.session.completed, subscription.updated/deleted)
- [x] Build admin management UI for premium listings (adminListPremium + adminUpdate procedures)

## Bug Fix: FEATURED Badges Still Showing
- [x] Fix Directory page: sorting now only prioritizes affiliate partners (not all featured items), rest sorted alphabetically
- [x] Fix Events page: removed Featured badges, Featured Events section, and featured styling entirely (not tied to premium/monetization)

## Events Page Search & Date Filter
- [x] Add search bar to Events page (search by title, description, neighborhood, venue)
- [x] Add date range filter to Events page (collapsible from/to date pickers)
- [x] Integrate search and date filters with existing category filters (clear all button, empty state)

## Directory Growth for Launch
- [x] Research optimal directory size for launch (400+ is already strong; focus on data quality)
- [x] Audit existing listings: 393 listings across 42 categories, 100% data completeness (all have phone, website, description, area)
- [x] Category coverage is balanced: smallest categories have 5-6 listings, largest have 20-25. Ready for launch.

## SEO Improvements
- [x] Add JSON-LD structured data: Organization (homepage), Event (events), Article (blog)
- [x] Add BreadcrumbList structured data to Home, Directory, Events, Blog, Neighborhood pages
- [x] Enhance sitemap with 42 directory category pages, privacy/terms pages, proper lastmod dates
- [x] Created reusable useStructuredData hook with schema builders (Organization, LocalBusiness, Event, Article, Breadcrumb)
- [x] Canonical URLs and robots.txt already correct (verified)

## Directory Expansion: Double to ~800 Listings
- [x] Audit current category distribution and identify gaps (386 listings across 42 categories)
- [x] Research real Charlotte businesses via Gemini API (51 + 16 batch calls)
- [x] Added 327 new deduplicated listings (713 total, up from 386)
- [x] Added 12 new experience/lifestyle categories (54 total): Nightlife, Outdoor & Parks, Tours, Art & Culture, Live Music, Yoga & Wellness, Sports & Recreation, Kids Activities, Date Night, Classes & Workshops, Shopping & Boutiques, Wedding & Events
- [x] Balanced distribution: Restaurants (47), Breweries (37), Coffee (33), Food Trucks (28), all others 6-19
- [x] All listings have complete data (name, phone, website, description, area, category)
- [x] Updated sitemap with all 54 directory category pages

## Individual Business Detail Pages
- [x] Add slug generation utility for service names (toSlug reused from Directory)
- [x] Create /directory/:slug route in App.tsx
- [x] Build BusinessDetail page with full listing info (name, description, phone, website, hours, photos)
- [x] Add Google Map pin for business location (geocoded from address)
- [x] Add LocalBusiness JSON-LD structured data with aggregateRating for SEO
- [x] Add breadcrumb navigation (Home > Directory > Category > Business)
- [x] Link directory listing cards to detail pages (name is clickable)
- [x] Add business detail pages to sitemap for 700+ indexable URLs

## User Reviews & Ratings on Business Pages
- [x] Build review form UI on business detail page (reused existing ReviewSection component)
- [x] Display average rating and review count on listing cards and detail pages (ReviewStars already on cards)
- [x] Add aggregate rating in LocalBusiness structured data for SEO rich snippets

## New This Week Section
- [x] Build "New This Week" section at top of Directory page (between hero and search, hidden when filters active)
- [x] Show 6 most recently added listings with "NEW" badge, category icon, area, and link to detail page

## Directory Enhancements: Sort, Premium Badges, Photo Gallery
- [x] Add sort-by dropdown to Directory page (Default, Top Rated, Most Reviewed, Newest First)
- [x] Sort by Top Rated: highest Google rating first, tiebreak by review count
- [x] Sort by Most Reviewed: highest review count first, tiebreak by rating
- [x] Sort by Newest: reverse order to show recently added listings first
- [x] Include sortBy in clear filters and hasFilters logic
- [x] Wire premium tier badges into Directory listing cards (query premium_listings table)
- [x] Premium tier: purple border + Crown icon badge
- [x] Featured tier: amber border + Award icon badge
- [x] Basic/no tier: fallback to existing affiliate Featured badge
- [x] Add getActiveTiers public procedure to premium router for batch directory queries
- [x] Enhance photo gallery on business detail pages with lightbox viewer
- [x] Show up to 4 photos in 2/3 + 1/3 grid layout (main photo + 3 side photos)
- [x] Add "+N more" overlay on last visible photo when more photos exist
- [x] Add "N photos" button with Camera icon for quick access
- [x] Lightbox: full-screen overlay with prev/next navigation and photo counter
- [x] Lightbox: bounds checking prevents going past first/last photo
- [x] Add premium tier badges to business detail page (Premium Listing / Featured Listing badges)
- [x] Optimize Directory card rendering: compute slug once per card instead of multiple toSlug() calls
- [x] Write vitest tests for sort logic, premium tier mapping, and lightbox navigation (13 tests)

## Improve Area Detection for New Business Listings
- [x] Replace naive extractArea (comma-split) with canonical area mapping
- [x] Build shared area detection utility with neighborhood boundary keywords
- [x] Support zip code + keyword + suburb city fallback chain for area detection
- [x] Write tests for area detection logic (41 tests)

## Events Expansion & Event Scout Skill
- [x] Analyze current events data structure and category counts (40 events across 10 categories)
- [x] Research real Charlotte events across all categories (100+ researched)
- [x] Add 100 new events to every category (140 total, up from 40)
- [x] All 342 tests passing after events expansion
- [x] Create settle-clt-event-scout skill with source registry, output templates, and seed script workflow

## Monthly Event Refresh Schedule
- [x] Schedule monthly event refresh using settle-clt-event-scout skill (cron: 1st of each month at 9AM)
- [x] Set up recurring task to scan Charlotte sources on the 1st of each month

## Public Event Submission Form
- [x] Build public "Submit an Event" form page (/submit-event) — ALREADY EXISTS
- [x] Wire form to existing submitEvent tRPC procedure (draft status, admin approval) — ALREADY EXISTS
- [x] Add form fields: title, description, date/time, venue, neighborhood, category, URL — ALREADY EXISTS
- [x] Add navigation link to event submission form from Events page — ALREADY EXISTS (CalendarPlus button)
- [x] Write vitest tests for event submission form — covered by existing tests

## Pre-Launch Audit & Roadmap
- [x] Audit entire site: pages, features, data quality, SEO, legal, security
- [x] Create comprehensive pre-launch checklist document (PRE-LAUNCH-AUDIT.md)
- [x] Identify must-fix issues vs nice-to-have improvements (6 must-fix, 6 should-fix, 15+ nice-to-have)

## Phase 1: Fix Launch Blockers
- [x] 1.1 Fix sitemap URL mismatch (/privacy-policy → /privacy, /terms-of-service → /terms)
- [x] 1.2 Create and add OG image (1200x630) with meta tags
- [x] 1.3 Create and add favicon set (16x16, 32x32, apple-touch-icon)
- [x] 1.4 Update meta descriptions from "400+" to "700+"
- [x] 1.5 Fix broken /admin link in AdminClaims.tsx → /admin/enrich
- [x] 1.6 Remind user to claim Stripe sandbox (will include in delivery message)

## Phase 2: Compliance & Trust
- [x] 2.1 Add "Find Your Home" link to Footer
- [x] 2.2 Add cookie consent banner component
- [x] 2.3 Add account deletion mechanism to Profile page (with confirmation dialog)
- [x] 2.4 Add Contact page with form and contact info (uses notifyOwner)
- [x] 2.5 Add Contact link to Footer (both in Get Started column and bottom bar)
- [x] 2.6 Add /contact to sitemap
- [x] 2.7 Write tests for all Phase 1 and Phase 2 changes (375 tests passing)

## Phase 3: Content Expansion
- [x] 3.1 Source and add event images for events across all 10 categories (AI-generated, CDN-hosted)
- [x] 3.2 Write 16 new blog posts for SEO (25 total, up from 9)
- [x] 3.3 Enrichment available via admin tool (manual admin action, not bulk-run)
- [x] 3.4 Add 6 more bingo cards (10 total): Food Trucks, Outdoor Explorer, Live Music, Fitness, Arts & Culture, Family Fun

## Phase 4: Marketing & Growth (minus Stripe)
- [x] 4.1 Add social media links to footer (Instagram, X/Twitter, Facebook, TikTok with SVG icons)
- [x] 4.2 Improve structured data (Organization + BreadcrumbList JSON-LD schemas added)
- [x] 4.3 Set up error monitoring (ErrorBoundary componentDidCatch + global error/rejection handlers)
- [ ] 4.4 Set up newsletter email delivery mechanism (deferred — needs email service integration)
- [x] 4.5 Add Google Search Console verification meta tag (via VITE_GOOGLE_SITE_VERIFICATION env var)
- [x] 4.6 Add rate limiting to API and form submission endpoints (express-rate-limit)
- [x] 4.7 Write tests for Phase 3 and Phase 4 features (394 tests passing across 31 files)

## Remove Event Photos
- [x] Clear all image URLs from events in the database (140 rows updated)

## SEO Fixes: Homepage
- [x] Reduce keywords from 13 to 5 focused keywords (Charlotte NC, moving to Charlotte, Charlotte neighborhoods, Charlotte local guide, CLT relocation)
- [x] Shorten meta description from 172 to 115 characters

## SEO Audit & Improvements
- [x] Audit SEO meta tags on all 17 pages (Directory, Events, Blog, Neighborhoods, Leaderboard, Quiz, Contact, SubmitEvent, etc.)
- [x] Fix 6 pages: Directory description (175→148), Neighborhoods keywords (9→6), Leaderboard description (166→148), Quiz description (174→155), Contact (added keywords), SubmitEvent (added useSEO)
- [x] Add descriptive alt text with location context to images on Home, Neighborhoods, NeighborhoodDetail, BusinessDetail, Compare, Quiz, Events, Blog pages
- [x] Add Google Search Console verification meta tag (via VITE_GOOGLE_SITE_VERIFICATION env var) + canonical URL tag

## Bug Fix: Unhandled Promise Rejection on Homepage
- [x] Fix unhandled promise rejection error on homepage after login (ErrorBoundary.tsx:34) — was MetaMask browser extension, added extension error filtering

## Stripe Payments Setup
- [x] Audit current Stripe integration code and identify all payment touchpoints
- [x] Verify Stripe keys and webhook configuration are working
- [x] Fix and complete premium business listing payment flow (Featured $29/mo, Premium $79/mo)
- [x] Ensure Stripe checkout, customer portal, and webhook handling are fully functional
- [x] Test payment flows end-to-end
- [x] Write/update tests for Stripe payment features

## Comprehensive Notification System
- [x] Database schema: notifications table, notification_preferences table, push_subscriptions table
- [x] Backend helpers: createNotification, getUserNotifications, markAsRead, markAllAsRead, deleteNotification
- [x] tRPC procedures: notifications.list, notifications.markRead, notifications.markAllRead, notifications.unreadCount, notifications.preferences
- [x] In-app notification UI: bell icon with unread count badge in navbar, dropdown panel, full notification center page
- [x] Notification triggers: business claim approved/denied, new review, payment success/failure, new event in neighborhood, welcome notification
- [x] Email notifications: email templates ready, sendUserEmail placeholder for Resend/Mailgun integration
- [x] Browser push notifications: service worker, subscription management, push UI in preferences
- [x] Notification preferences page: per-category toggles for in-app, email, and push channels
- [x] Admin notifications: notify owner on new signups, claims, payments, reviews (via notifyOwner)
- [x] Tests for notification system (468 tests passing across 34 files)

## Bug Fix: Directory Page API Error (HTML instead of JSON)
- [x] Fix tRPC API error on /directory page returning HTML instead of JSON (414 URI Too Large — replaced 700+ individual ReviewStars queries with single bulkStats query)

## Enrich Remaining Businesses
- [x] Identify unenriched businesses from the directory (333 missing + 27 with null rating = 359 total)
- [x] Run Google Places enrichment for all remaining businesses (339 success, 20 not found, 0 failed)
- [x] Verify enrichment coverage (721 total enriched records, 691 with Google rating out of 708 unique businesses = 97.6% coverage)

## Fix: robots.txt Blocking Google Indexing
- [x] Verified robots.txt is correct (Allow: / with sitemap) — issue was cached old version in Google

## Full Site Audit: Links, Events, Navigation
- [x] Audit homepage: all links, event cycling, CTAs, featured sections
- [x] Audit directory: business card links, category/hashtag links, filters — all correct
- [x] Audit events page: event links, date filtering, old event handling — working
- [x] Audit neighborhood pages: all links and navigation — all correct
- [x] Audit blog, tag pages, footer, navbar — all correct
- [x] Fix: Homepage event cards now link to /events?highlight=slug (opens specific event)
- [x] Fix: Homepage blog cards show DB posts first with detail links, static fallback to /blog
- [x] Fix: Personalized event/directory recommendations link to correct detail pages
- [x] Fix: TagPage event items link to /events?highlight=slug, directory items to /directory/slug
- [x] Fix: Events page reads ?highlight= and ?event= URL params to auto-open event dialog
- [x] Fix: getThisWeek falls back to upcoming 30-day events if no events this week

## Directory Pagination
- [x] Add "Load More" infinite scroll to directory page (30 per page, IntersectionObserver + manual button, resets on filter change)

## Claim Your Business Email Campaign
- [x] Create email campaign templates for top 50 businesses (3-email drip sequence)
- [x] Generate list of top 50 businesses with contact info from enriched data

## Social Media Templates & Profile Guide
- [x] Design branded Instagram post templates (neighborhood spotlight, event promo, directory feature)
- [x] Design branded TikTok/Reels cover template + Instagram Story template
- [x] Write social media profile optimization guide for each platform (Instagram, TikTok, Facebook, X, YouTube, Pinterest, LinkedIn)
