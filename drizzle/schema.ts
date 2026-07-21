import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  newsletterOptIn: boolean("newsletterOptIn").default(true).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Business listing submissions
export const businessSubmissions = mysqlTable("business_submissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  website: varchar("website", { length: 512 }),
  area: varchar("area", { length: 255 }),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BusinessSubmission = typeof businessSubmissions.$inferSelect;
export type InsertBusinessSubmission = typeof businessSubmissions.$inferInsert;
// Newsletter subscribers
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  source: varchar("source", { length: 64 }).default("homepage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

// Google Places enrichment data for directory listings
export const enrichedServices = mysqlTable("enriched_services", {
  id: int("id").autoincrement().primaryKey(),
  /** Key matching the service in shared/services.ts (e.g. 'amelies-french-bakery') */
  serviceKey: varchar("serviceKey", { length: 255 }).notNull().unique(),
  /** Google Place ID for linking back to Google Maps */
  googlePlaceId: varchar("googlePlaceId", { length: 512 }),
  /** Google rating (1.0 - 5.0) */
  googleRating: varchar("googleRating", { length: 8 }),
  /** Number of Google reviews */
  reviewCount: int("reviewCount"),
  /** Verified street address from Google */
  verifiedAddress: text("verifiedAddress"),
  /** Verified phone number from Google */
  verifiedPhone: varchar("verifiedPhone", { length: 32 }),
  /** Business hours as JSON string */
  hoursJson: text("hoursJson"),
  /** Google photo references as JSON array of URLs */
  photosJson: text("photosJson"),
  /** Google business types/categories */
  googleTypes: text("googleTypes"),
  /** Price level from Google (0-4) */
  priceLevel: int("priceLevel"),
  /** Whether this enrichment has been verified by admin */
  verified: mysqlEnum("verified", ["pending", "verified", "rejected"]).default("pending").notNull(),
  /** Admin who applied this enrichment */
  enrichedBy: int("enrichedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EnrichedService = typeof enrichedServices.$inferSelect;
export type InsertEnrichedService = typeof enrichedServices.$inferInsert;

// Dynamic directory listings (admin-added via Google Places search)
export const directoryListings = mysqlTable("directory_listings", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique slug key for this listing */
  serviceKey: varchar("serviceKey", { length: 255 }).notNull().unique(),
  /** Business name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Category ID matching SERVICE_CATEGORIES */
  category: varchar("category", { length: 128 }).notNull(),
  /** Short description */
  description: text("description"),
  /** Area / neighborhood */
  area: varchar("area", { length: 128 }).notNull().default("Charlotte Metro"),
  /** Phone number */
  phone: varchar("phone", { length: 32 }),
  /** Website URL */
  website: text("website"),
  /** Google Place ID */
  googlePlaceId: varchar("googlePlaceId", { length: 512 }),
  /** Google rating */
  googleRating: varchar("googleRating", { length: 8 }),
  /** Google review count */
  reviewCount: int("reviewCount"),
  /** Verified address from Google */
  verifiedAddress: text("verifiedAddress"),
  /** Business hours JSON */
  hoursJson: text("hoursJson"),
  /** Google types JSON */
  googleTypes: text("googleTypes"),
  /** Price level 0-4 */
  priceLevel: int("priceLevel"),
  /** Featured listing flag */
  featured: boolean("featured").default(false).notNull(),
  /** Active flag */
  active: boolean("active").default(true).notNull(),
  /** Admin who added this listing */
  addedBy: int("addedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DirectoryListing = typeof directoryListings.$inferSelect;
export type InsertDirectoryListing = typeof directoryListings.$inferInsert;

// --- CLT Passport: visited places stamps ---
export const passportEntries = mysqlTable("passport_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Service key from shared/services.ts or custom place name */
  serviceKey: varchar("serviceKey", { length: 255 }),
  customPlaceName: varchar("customPlaceName", { length: 255 }),
  /** Event slug for event stamps */
  eventSlug: varchar("eventSlug", { length: 255 }),
  neighborhoodId: varchar("neighborhoodId", { length: 128 }),
  visitedAt: timestamp("visitedAt").defaultNow().notNull(),
  notes: text("notes"),
  photoUrl: varchar("photoUrl", { length: 1024 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PassportEntry = typeof passportEntries.$inferSelect;
export type InsertPassportEntry = typeof passportEntries.$inferInsert;

// --- Bingo cards: themed challenge boards ---
export const bingoCards = mysqlTable("bingo_cards", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  theme: varchar("theme", { length: 128 }).notNull(),
  /** JSON array of 25 square objects: { id, label, serviceKey?, category? } */
  squaresJson: text("squaresJson").notNull(),
  coverImage: varchar("coverImage", { length: 1024 }),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BingoCard = typeof bingoCards.$inferSelect;
export type InsertBingoCard = typeof bingoCards.$inferInsert;

// --- Bingo progress: user completion tracking ---
export const bingoProgress = mysqlTable("bingo_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cardId: int("cardId").notNull(),
  /** JSON array of completed square IDs */
  completedSquaresJson: text("completedSquaresJson"),
  completedAt: timestamp("completedAt"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BingoProgressRow = typeof bingoProgress.$inferSelect;
export type InsertBingoProgress = typeof bingoProgress.$inferInsert;

// --- Wishlists: saved places ---
export const wishlists = mysqlTable("wishlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  serviceKey: varchar("serviceKey", { length: 255 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WishlistEntry = typeof wishlists.$inferSelect;
export type InsertWishlistEntry = typeof wishlists.$inferInsert;

// --- Comments: threaded discussions ---
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** 'neighborhood' or 'service' */
  targetType: varchar("targetType", { length: 32 }).notNull(),
  /** neighborhood id or service key */
  targetId: varchar("targetId", { length: 255 }).notNull(),
  /** null for top-level comments, parent comment id for replies */
  parentId: int("parentId"),
  content: text("content").notNull(),
  upvotes: int("upvotes").default(0).notNull(),
  downvotes: int("downvotes").default(0).notNull(),
  deleted: mysqlEnum("deleted", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// --- Comment votes: track who voted ---
export const commentVotes = mysqlTable("comment_votes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  commentId: int("commentId").notNull(),
  /** 'up' or 'down' */
  voteType: mysqlEnum("voteType", ["up", "down"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommentVote = typeof commentVotes.$inferSelect;
export type InsertCommentVote = typeof commentVotes.$inferInsert;

// --- Blog posts: admin-managed articles ---
export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  slug: varchar("slug", { length: 512 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  category: varchar("category", { length: 128 }),
  coverImage: varchar("coverImage", { length: 1024 }),
  authorId: int("authorId").notNull(),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  readTime: varchar("readTime", { length: 32 }),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// --- Events: Charlotte happenings ---
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  /** New: display name (preferred over title for new events system) */
  name: varchar("name", { length: 255 }),
  /** Legacy title field — kept for backward compat */
  title: varchar("title", { length: 255 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  /** New: recurring vs one_time */
  type: mysqlEnum("type", ["recurring", "one_time"]).default("one_time"),
  description: text("description"),
  /** Event start as UTC ms timestamp (legacy) */
  startDate: timestamp("startDate"),
  /** Event end (nullable for single-time events) */
  endDate: timestamp("endDate"),
  /** New: string-based date for flexible event dates */
  startDateStr: varchar("startDateStr", { length: 32 }),
  endDateStr: varchar("endDateStr", { length: 32 }),
  venueName: varchar("venueName", { length: 255 }),
  venueAddress: varchar("venueAddress", { length: 500 }),
  /** New: simplified venue + area */
  venue: varchar("venue", { length: 255 }),
  venueArea: varchar("venueArea", { length: 128 }),
  neighborhood: varchar("neighborhood", { length: 128 }),
  externalUrl: varchar("externalUrl", { length: 500 }),
  imageUrl: varchar("imageUrl", { length: 1024 }),
  /** New: organizer info */
  organizer: varchar("organizer", { length: 255 }),
  organizerWebsite: text("organizerWebsite"),
  /** New: recurring pattern description */
  recurringPattern: varchar("recurringPattern", { length: 255 }),
  /** New: source verification */
  sourceUrl: text("sourceUrl"),
  sourceVerified: boolean("sourceVerified").default(false).notNull(),
  newcomerFriendly: boolean("newcomerFriendly").default(false).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  /** New: cost enum */
  cost: mysqlEnum("cost", ["free", "paid", "mixed"]).default("free"),
  rsvpUrl: text("rsvpUrl"),
  /** Legacy featured flag */
  isFeatured: mysqlEnum("isFeatured", ["yes", "no"]).default("no").notNull(),
  /** New: boolean featured */
  featured: boolean("featured").default(false).notNull(),
  isRecurring: mysqlEnum("isRecurring", ["yes", "no"]).default("no").notNull(),
  submittedBy: int("submittedBy"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  /** New: active flag (replaces status for new system) */
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// --- Tags: unified tagging system ---
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  /** Tag category: neighborhood, activity, audience, season, content-type */
  category: mysqlEnum("category", [
    "neighborhood",
    "activity",
    "audience",
    "season",
    "content-type",
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

// --- Content tags: many-to-many join ---
export const contentTags = mysqlTable("content_tags", {
  id: int("id").autoincrement().primaryKey(),
  tagId: int("tagId").notNull(),
  /** Content type: event, directory, blog, neighborhood */
  contentType: mysqlEnum("contentType", [
    "event",
    "directory",
    "blog",
    "neighborhood",
  ]).notNull(),
  /** Content identifier (event id, service key, blog slug, neighborhood id) */
  contentId: varchar("contentId", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentTag = typeof contentTags.$inferSelect;
export type InsertContentTag = typeof contentTags.$inferInsert;


// --- Tag engagement: track views/clicks for trending ---
export const tagEngagement = mysqlTable("tag_engagement", {
  id: int("id").autoincrement().primaryKey(),
  tagId: int("tagId").notNull(),
  /** Type of engagement: view, click, stamp, share */
  engagementType: mysqlEnum("engagementType", ["view", "click", "stamp", "share"]).notNull(),
  /** Optional user ID (null for anonymous) */
  userId: int("userId"),
  /** Optional content context */
  contentType: varchar("contentType", { length: 64 }),
  contentId: varchar("contentId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TagEngagement = typeof tagEngagement.$inferSelect;
export type InsertTagEngagement = typeof tagEngagement.$inferInsert;


// --- Search queries: track what users search for ---
export const searchQueries = mysqlTable("search_queries", {
  id: int("id").autoincrement().primaryKey(),
  /** The search query text */
  query: varchar("query", { length: 512 }).notNull(),
  /** Normalized lowercase version for aggregation */
  queryNormalized: varchar("queryNormalized", { length: 512 }).notNull(),
  /** Number of results returned */
  resultCount: int("resultCount").default(0).notNull(),
  /** Optional user ID (null for anonymous) */
  userId: int("userId"),
  /** Source: global-search, directory, events, blog */
  source: varchar("source", { length: 64 }).default("global-search").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SearchQuery = typeof searchQueries.$inferSelect;
export type InsertSearchQuery = typeof searchQueries.$inferInsert;

// --- User tag preferences: aggregated engagement for recommendations ---
export const userTagPreferences = mysqlTable("user_tag_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tagId: int("tagId").notNull(),
  /** Aggregated engagement score (views=1, clicks=3, stamps=5, shares=2) */
  score: int("score").default(0).notNull(),
  /** Last engagement timestamp */
  lastEngagedAt: timestamp("lastEngagedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserTagPreference = typeof userTagPreferences.$inferSelect;
export type InsertUserTagPreference = typeof userTagPreferences.$inferInsert;


// --- Community Reviews: star ratings + tips for neighborhoods and directory ---
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  /** What is being reviewed: neighborhood or directory */
  targetType: mysqlEnum("targetType", ["neighborhood", "directory"]).notNull(),
  /** Identifier: neighborhood slug or directory listing id */
  targetId: varchar("targetId", { length: 255 }).notNull(),
  /** User who wrote the review */
  userId: int("userId").notNull(),
  /** Star rating 1-5 */
  rating: int("rating").notNull(),
  /** Short tip or review text (max 500 chars) */
  tip: varchar("tip", { length: 500 }).notNull(),
  /** Optional: what aspect (vibe, food, safety, transit, nightlife, cost) */
  aspect: mysqlEnum("aspect", ["vibe", "food", "safety", "transit", "nightlife", "cost", "general"]).default("general").notNull(),
  /** Admin can hide inappropriate reviews */
  visible: mysqlEnum("visible", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// --- Real Estate Referrals: capture leads for agent partners ---
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  /** Contact info */
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  /** What they need */
  referralType: mysqlEnum("referralType", ["buying", "selling", "renting", "relocating", "investing"]).notNull(),
  /** Budget range */
  budget: varchar("budget", { length: 128 }),
  /** Preferred neighborhoods */
  neighborhoods: text("neighborhoods"),
  /** Timeline */
  timeline: varchar("timeline", { length: 128 }),
  /** Additional notes */
  notes: text("notes"),
  /** Current city (for relocators) */
  currentCity: varchar("currentCity", { length: 255 }),
  /** Referral source tracking (quiz, neighborhood, directory, direct, etc.) */
  referralSource: varchar("referralSource", { length: 128 }),
  /** Status tracking */
  status: mysqlEnum("status", ["new", "contacted", "matched", "closed", "lost"]).default("new").notNull(),
  /** Admin notes */
  adminNotes: text("adminNotes"),
  /** Logged-in user who submitted (optional) */
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// --- Business Claims: let business owners claim and manage their directory listing ---
export const businessClaims = mysqlTable("business_claims", {
  id: int("id").autoincrement().primaryKey(),
  /** The service key from shared/services.ts or directory_listings.serviceKey */
  serviceKey: varchar("serviceKey", { length: 255 }).notNull(),
  /** Business name (denormalized for admin convenience) */
  businessName: varchar("businessName", { length: 255 }).notNull(),
  /** Claimant contact info */
  claimantName: varchar("claimantName", { length: 255 }).notNull(),
  claimantEmail: varchar("claimantEmail", { length: 320 }).notNull(),
  claimantPhone: varchar("claimantPhone", { length: 32 }),
  /** Role at the business */
  claimantRole: varchar("claimantRole", { length: 128 }).notNull(),
  /** How they can prove ownership (e.g. "I'm the owner", "I'm the manager", etc.) */
  verificationMethod: mysqlEnum("verificationMethod", ["owner", "manager", "employee", "authorized_rep"]).notNull(),
  /** Optional message / proof details */
  message: text("message"),
  /** Optional: logged-in user who submitted */
  userId: int("userId"),
  /** Claim status */
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  /** Admin notes */
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessClaim = typeof businessClaims.$inferSelect;
export type InsertBusinessClaim = typeof businessClaims.$inferInsert;

// Business listing overrides - owner-managed data for claimed businesses
export const businessListingOverrides = mysqlTable("business_listing_overrides", {
  id: int("id").autoincrement().primaryKey(),
  /** Links to the service key in shared/services or directory_listings */
  serviceKey: varchar("serviceKey", { length: 255 }).notNull().unique(),
  /** The claim ID that authorized this override */
  claimId: int("claimId").notNull(),
  /** Owner-provided overrides (null = use original data) */
  displayName: varchar("displayName", { length: 255 }),
  description: text("description"),
  phone: varchar("phone", { length: 32 }),
  website: varchar("website", { length: 512 }),
  email: varchar("email", { length: 320 }),
  /** Business hours as JSON string, e.g. {"mon":"9am-5pm","tue":"9am-5pm",...} */
  hours: text("hours"),
  /** Comma-separated photo URLs (stored in S3) */
  photoUrls: text("photoUrls"),
  /** Social media links as JSON string */
  socialLinks: text("socialLinks"),
  /** Short tagline */
  tagline: varchar("tagline", { length: 255 }),
  /** Whether the override is active (admin can disable) */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessListingOverride = typeof businessListingOverrides.$inferSelect;
export type InsertBusinessListingOverride = typeof businessListingOverrides.$inferInsert;

// Premium listing tiers for monetization
export const premiumListings = mysqlTable("premium_listings", {
  id: int("id").autoincrement().primaryKey(),
  serviceKey: varchar("serviceKey", { length: 255 }).notNull(),
  /** Tier: basic (free), featured, premium */
  tier: mysqlEnum("tier", ["basic", "featured", "premium"]).default("basic").notNull(),
  /** Stripe customer ID */
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  /** Stripe subscription ID */
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  /** Stripe price ID for the current tier */
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  /** Payment status */
  paymentStatus: mysqlEnum("paymentStatus", ["active", "past_due", "canceled", "trialing"]).default("active").notNull(),
  /** Subscription period */
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  /** The claim ID that owns this premium listing */
  claimId: int("claimId"),
  /** Owner email for billing */
  billingEmail: varchar("billingEmail", { length: 320 }),
  /** Analytics: total views this period */
  viewsThisPeriod: int("viewsThisPeriod").default(0).notNull(),
  /** Analytics: total clicks this period */
  clicksThisPeriod: int("clicksThisPeriod").default(0).notNull(),
  /** Analytics: total leads this period */
  leadsThisPeriod: int("leadsThisPeriod").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PremiumListing = typeof premiumListings.$inferSelect;
export type InsertPremiumListing = typeof premiumListings.$inferInsert;

// ─── Notification System ───────────────────────────────────────

/** In-app notifications for users */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  /** User who receives the notification */
  userId: int("userId").notNull(),
  /** Notification category for filtering and preferences */
  category: mysqlEnum("category", [
    "claim",       // Business claim approved/denied
    "review",      // New review on claimed business
    "payment",     // Payment success/failure/renewal
    "event",       // New event in neighborhood or subscribed category
    "community",   // Bingo completion, leaderboard, referrals
    "system",      // Welcome, announcements, maintenance
  ]).notNull(),
  /** Short title */
  title: varchar("title", { length: 255 }).notNull(),
  /** Notification body text */
  body: text("body").notNull(),
  /** Optional link to navigate to when clicked */
  actionUrl: varchar("actionUrl", { length: 500 }),
  /** Optional icon name (lucide icon) */
  icon: varchar("icon", { length: 64 }),
  /** Read status */
  isRead: boolean("isRead").default(false).notNull(),
  /** Optional metadata JSON (e.g., serviceKey, claimId, reviewId) */
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/** User notification preferences per category and channel */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Which category this preference controls */
  category: mysqlEnum("category", [
    "claim", "review", "payment", "event", "community", "system",
  ]).notNull(),
  /** In-app notification enabled */
  inApp: boolean("inApp").default(true).notNull(),
  /** Email notification enabled */
  email: boolean("email").default(true).notNull(),
  /** Browser push notification enabled */
  push: boolean("push").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/** Browser push notification subscriptions */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Push subscription endpoint URL */
  endpoint: text("endpoint").notNull(),
  /** P256DH key for encryption */
  p256dh: text("p256dh").notNull(),
  /** Auth key for encryption */
  auth: text("auth").notNull(),
  /** User agent for identifying the device */
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
