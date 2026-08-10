import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar, date } from "drizzle-orm/mysql-core";

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
  /** Legacy identity identifier; local auth uses a stable `local:` prefix. */
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: text("passwordHash"),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  googleSubject: varchar("googleSubject", { length: 255 }).unique(),
  authVersion: int("authVersion").default(1).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  newsletterOptIn: boolean("newsletterOptIn").default(true).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const authTokens = mysqlTable("auth_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  purpose: mysqlEnum("purpose", ["verify_email", "reset_password", "google_oauth"]).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuthToken = typeof authTokens.$inferSelect;
export type InsertAuthToken = typeof authTokens.$inferInsert;

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

/** Verification log for directory listing freshness and accuracy checks. */
export const listingVerifications = mysqlTable("listing_verifications", {
  id: int("id").autoincrement().primaryKey(),
  /** Service key of the listing checked. */
  serviceKey: varchar("serviceKey", { length: 255 }).notNull(),
  /** What was checked: website, phone, address, hours, closure, category, general. */
  checkType: mysqlEnum("checkType", [
    "website",
    "phone",
    "address",
    "hours",
    "closure",
    "category",
    "general",
  ]).notNull(),
  /** Result of the check. */
  result: mysqlEnum("result", [
    "ok",
    "changed",
    "broken_link",
    "parked_domain",
    "redirect_changed",
    "closed",
    "moved",
    "rebranded",
    "conflicting",
    "inconclusive",
  ]).notNull(),
  /** Evidence level at time of check. */
  evidenceLevel: mysqlEnum("evidenceLevel", [
    "official_verified",
    "owner_confirmed",
    "government_verified",
    "source_identified",
    "third_party_clue",
    "conflicting",
    "stale",
    "removed_confirmed",
  ]).notNull(),
  /** Source URL that was checked. */
  sourceUrl: text("sourceUrl"),
  /** Before value (if changed). */
  beforeValue: text("beforeValue"),
  /** After value (if changed). */
  afterValue: text("afterValue"),
  /** Agent role that performed the check. */
  checkedBy: mysqlEnum("checkedBy", [
    "manager",
    "directory_curator",
    "events_editor",
    "content_editor",
    "community_moderator",
    "business_success",
    "analyst",
    "reliability_watchdog",
  ]).notNull(),
  /** Free-text notes. */
  notes: text("notes"),
  /** Link to agent task if one was created. */
  taskId: int("taskId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ListingVerification = typeof listingVerifications.$inferSelect;
export type InsertListingVerification = typeof listingVerifications.$inferInsert;

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
  /** 0-25 lead score for realtor triage */
  leadScore: int("leadScore").default(0).notNull(),
  /** Operational priority derived from the score */
  leadPriority: mysqlEnum("leadPriority", ["hot", "qualified", "nurture", "early", "low"]).default("low").notNull(),
  /** Recommended next action for follow-up */
  nextAction: varchar("nextAction", { length: 512 }),
  /** Due date for the recommended next action */
  nextActionDueAt: timestamp("nextActionDueAt"),
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

export const businessMemberships = mysqlTable(
  "business_memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    serviceKey: varchar("serviceKey", { length: 255 }).notNull(),
    userId: int("userId").notNull(),
    ownerClaimId: int("ownerClaimId"),
    /** Equals serviceKey only for an active owner; NULL for every other membership. */
    activeOwnerKey: varchar("activeOwnerKey", { length: 255 }),
    role: mysqlEnum("role", ["owner", "manager", "editor", "viewer"]).notNull(),
    status: mysqlEnum("status", ["active", "revoked"]).default("active").notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    revokedAt: timestamp("revokedAt"),
  },
  table => [
    uniqueIndex("business_memberships_service_user_unique").on(table.serviceKey, table.userId),
    uniqueIndex("business_memberships_active_owner_unique").on(table.activeOwnerKey),
  ],
);

export type BusinessMembership = typeof businessMemberships.$inferSelect;
export type InsertBusinessMembership = typeof businessMemberships.$inferInsert;

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
  /** Owner-managed services as JSON array. */
  serviceMenu: text("serviceMenu"),
  /** External booking provider label, e.g. Booksy or Calendly. */
  bookingProvider: varchar("bookingProvider", { length: 64 }),
  /** External booking or quote URL. */
  bookingUrl: varchar("bookingUrl", { length: 512 }),
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
  tier: mysqlEnum("tier", ["basic", "featured", "premium", "pro"]).default("basic").notNull(),
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
}, (table) => [
  uniqueIndex("premium_listings_service_key_unique").on(table.serviceKey),
  uniqueIndex("premium_listings_stripe_customer_unique").on(table.stripeCustomerId),
  uniqueIndex("premium_listings_stripe_subscription_unique").on(table.stripeSubscriptionId),
]);

export type PremiumListing = typeof premiumListings.$inferSelect;
export type InsertPremiumListing = typeof premiumListings.$inferInsert;

export const stripeCheckoutReconciliations = mysqlTable("stripe_checkout_reconciliations", {
  id: int("id").autoincrement().primaryKey(),
  stripeEventId: varchar("stripeEventId", { length: 255 }).notNull(),
  checkoutSessionId: varchar("checkoutSessionId", { length: 255 }).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  serviceKey: varchar("serviceKey", { length: 255 }),
  claimId: int("claimId"),
  reason: varchar("reason", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed"]).default("pending").notNull(),
  attemptCount: int("attemptCount").default(1).notNull(),
  leaseToken: varchar("leaseToken", { length: 64 }),
  leaseExpiresAt: timestamp("leaseExpiresAt"),
  lastError: text("lastError"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("stripe_checkout_reconciliations_event_unique").on(table.stripeEventId),
  uniqueIndex("stripe_checkout_reconciliations_session_unique").on(table.checkoutSessionId),
]);

export type StripeCheckoutReconciliation = typeof stripeCheckoutReconciliations.$inferSelect;
export type InsertStripeCheckoutReconciliation = typeof stripeCheckoutReconciliations.$inferInsert;

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

// ─── Operations System (Agent Tasks, Approvals, Audit) ───

/** Agent task types for the operations cockpit. */
export const agentTasks = mysqlTable("agent_tasks", {
  id: int("id").autoincrement().primaryKey(),
  /** Which agent role created this task. */
  agentRole: mysqlEnum("agentRole", [
    "manager",
    "directory_curator",
    "events_editor",
    "content_editor",
    "community_moderator",
    "business_success",
    "analyst",
    "reliability_watchdog",
  ]).notNull(),
  /** Task type within the role. */
  taskType: varchar("taskType", { length: 128 }).notNull(),
  /** Risk level R0-R4. */
  riskLevel: mysqlEnum("riskLevel", ["R0", "R1", "R2", "R3", "R4"]).notNull(),
  /** Canonical entity this task targets (e.g. business serviceKey, event slug, blog slug). */
  targetEntity: varchar("targetEntity", { length: 255 }),
  /** Target entity type for scoping. */
  targetType: mysqlEnum("targetType", [
    "business",
    "event",
    "blog",
    "claim",
    "review",
    "comment",
    "submission",
    "infrastructure",
    "seo",
    "other",
  ]).notNull(),
  /** Human-readable title for the cockpit. */
  title: varchar("title", { length: 500 }).notNull(),
  /** Structured payload: drafts, diffs, sources, evidence, recommendations. */
  payload: json("payload"),
  /** Evidence sources backing this task. */
  evidence: json("evidence"),
  /** Task lifecycle status. */
  status: mysqlEnum("status", [
    "discovered",
    "source_identified",
    "verified",
    "draft_ready",
    "pending_approval",
    "approved",
    "rejected",
    "executed",
    "failed",
    "archived",
  ]).default("discovered").notNull(),
  /** Confidence score 0-100 for the agent's assessment. */
  confidence: int("confidence").default(0),
  /** Priority for queue ordering. */
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  /** Assigned approver user ID (null = any admin). */
  approverUserId: int("approverUserId"),
  /** When the task was created. */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** When the task was last updated. */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  /** When the task was resolved (approved/rejected/executed/failed/archived). */
  resolvedAt: timestamp("resolvedAt"),
  /** Free-text resolution notes. */
  resolutionNotes: text("resolutionNotes"),
});
export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = typeof agentTasks.$inferInsert;

/** Durable, single-use approval records for R2-R4 agent actions. */
export const approvalRecords = mysqlTable("approval_records", {
  id: int("id").autoincrement().primaryKey(),
  /** Link to the agent task that requested this approval. */
  taskId: int("taskId").notNull(),
  /** The canonical target entity this approval covers. */
  targetEntity: varchar("targetEntity", { length: 255 }).notNull(),
  targetType: mysqlEnum("targetType", [
    "business", "event", "blog", "claim", "review", "comment",
    "submission", "infrastructure", "seo", "other",
  ]).notNull(),
  /** Action type being approved (e.g. "publish", "remove", "approve_claim"). */
  actionType: varchar("actionType", { length: 128 }).notNull(),
  /** Risk level. */
  riskLevel: mysqlEnum("riskLevel", ["R0", "R1", "R2", "R3", "R4"]).notNull(),
  /** SHA-256 hash of the exact payload that was approved. */
  payloadHash: varchar("payloadHash", { length: 64 }).notNull(),
  /** The exact payload that was reviewed (for reconstruction). */
  payloadSnapshot: json("payloadSnapshot"),
  /** Evidence supporting the approval decision. */
  evidence: json("evidence"),
  /** Who approved it. Null until decided. */
  approverUserId: int("approverUserId"),
  /** Decision: approved or rejected. */
  decision: mysqlEnum("decision", ["approved", "rejected", "expired"]).notNull(),
  /** When the approval was requested. */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** When the approval was decided. */
  decidedAt: timestamp("decidedAt"),
  /** Expiry timestamp — approval is void after this. */
  expiresAt: timestamp("expiresAt").notNull(),
  /** Execution ID if the approved action was executed. */
  executionId: varchar("executionId", { length: 64 }),
  /** Execution outcome. */
  executionOutcome: mysqlEnum("executionOutcome", ["pending", "success", "failed", "rolled_back"]),
  /** Execution result notes. */
  executionNotes: text("executionNotes"),
  /** Rollback reference if execution was reversed. */
  rollbackRef: varchar("rollbackRef", { length: 255 }),
});
export type ApprovalRecord = typeof approvalRecords.$inferSelect;
export type InsertApprovalRecord = typeof approvalRecords.$inferInsert;

/** Immutable audit log for every agent action. */
export const auditEvents = mysqlTable("audit_events", {
  id: int("id").autoincrement().primaryKey(),
  /** Agent role that performed the action. */
  agentRole: mysqlEnum("agentRole", [
    "manager", "directory_curator", "events_editor", "content_editor",
    "community_moderator", "business_success", "analyst", "reliability_watchdog",
  ]).notNull(),
  /** Action type. */
  actionType: varchar("actionType", { length: 128 }).notNull(),
  /** Risk level. */
  riskLevel: mysqlEnum("riskLevel", ["R0", "R1", "R2", "R3", "R4"]).notNull(),
  /** Target entity. */
  targetEntity: varchar("targetEntity", { length: 255 }),
  targetType: mysqlEnum("targetType", [
    "business", "event", "blog", "claim", "review", "comment",
    "submission", "infrastructure", "seo", "other",
  ]).notNull(),
  /** Outcome of the action. */
  outcome: mysqlEnum("outcome", ["success", "failed", "blocked", "skipped"]).notNull(),
  /** Redacted summary (no secrets, no PII beyond what's necessary). */
  summary: text("summary").notNull(),
  /** Structured details (redacted). */
  details: json("details"),
  /** Link to approval record if one was required. */
  approvalId: int("approvalId"),
  /** Link to agent task. */
  taskId: int("taskId"),
  /** When the event occurred. */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = typeof auditEvents.$inferInsert;

// ─── Source Registry ───

/** Managed list of sources for business discovery, event discovery, blog research, and Charlotte news. */
export const sourceRegistry = mysqlTable("source_registry", {
  id: int("id").autoincrement().primaryKey(),
  /** What this source is used for. */
  sourceType: mysqlEnum("sourceType", [
    "business_discovery",
    "event_discovery",
    "blog_research",
    "charlotte_news",
    "government",
    "license_verification",
  ]).notNull(),
  /** Human-readable name of the source. */
  name: varchar("name", { length: 255 }).notNull(),
  /** The source URL. */
  url: text("url").notNull(),
  /** Category or domain this source covers (e.g. "movers", "music_events", "relocation_guides"). */
  sourceCategory: varchar("sourceCategory", { length: 128 }),
  /** Priority: high-value sources are checked first. */
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  /** Trust level: official > aggregator > third_party. */
  trustLevel: mysqlEnum("trustLevel", ["official", "aggregator", "third_party"]).default("third_party").notNull(),
  /** Whether this source is currently being used. */
  active: boolean("active").default(true).notNull(),
  /** How often to check this source. */
  checkFrequency: mysqlEnum("checkFrequency", ["daily", "weekly", "biweekly", "monthly", "quarterly"]).default("weekly").notNull(),
  /** Last time this source was checked. */
  lastCheckedAt: timestamp("lastCheckedAt"),
  /** Last check result. */
  lastCheckResult: mysqlEnum("lastCheckResult", ["ok", "changed", "broken", "blocked", "inconclusive"]),
  /** Notes about this source (e.g. requires JS, rate-limited, needs auth). */
  notes: text("notes"),
  /** Who added this source. */
  addedBy: varchar("addedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SourceRegistryEntry = typeof sourceRegistry.$inferSelect;
export type InsertSourceRegistryEntry = typeof sourceRegistry.$inferInsert;

// ─── Business Leads (Premium tier lead capture) ───

/** Lead captured from a premium-tier business detail page. */
export const businessLeads = mysqlTable("business_leads", {
  id: int("id").autoincrement().primaryKey(),
  /** Service key of the business. */
  serviceKey: varchar("serviceKey", { length: 255 }).notNull(),
  /** Lead submitter name. */
  name: varchar("name", { length: 255 }).notNull(),
  /** Lead submitter email. */
  email: varchar("email", { length: 320 }).notNull(),
  /** Lead submitter phone (optional). */
  phone: varchar("phone", { length: 32 }),
  /** Lead message. */
  message: text("message").notNull(),
  /** Authenticated user ID if the lead submitter was logged in. */
  userId: int("userId"),
  /** Lead status lifecycle. */
  status: mysqlEnum("status", ["new", "contacted", "qualified", "closed", "archived"]).default("new").notNull(),
  /** Owner-scheduled follow-up time. */
  followUpAt: timestamp("followUpAt"),
  /** Private owner notes. */
  notes: text("notes"),
  /** Lead source such as listing inquiry, booking request, or AI assistant. */
  source: varchar("source", { length: 128 }),
  /** Estimated opportunity value stored in cents. */
  estimatedValueCents: int("estimatedValueCents"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BusinessLead = typeof businessLeads.$inferSelect;
export type InsertBusinessLead = typeof businessLeads.$inferInsert;

// ─── Daily Analytics Snapshots ───

/** Daily view/click/lead counts for premium listing charts. */
export const listingAnalyticsDaily = mysqlTable("listing_analytics_daily", {
  id: int("id").autoincrement().primaryKey(),
  serviceKey: varchar("serviceKey", { length: 255 }).notNull(),
  date: date("date").notNull(),
  views: int("views").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  leads: int("leads").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ListingAnalyticsDaily = typeof listingAnalyticsDaily.$inferSelect;
export type InsertListingAnalyticsDaily = typeof listingAnalyticsDaily.$inferInsert;

// ─── Business FAQs (AI Assistant grounding) ───

/** Owner-managed FAQs that ground the AI Business Assistant's responses. */
export const businessFaqs = mysqlTable("business_faqs", {
  id: int("id").autoincrement().primaryKey(),
  serviceKey: varchar("serviceKey", { length: 255 }).notNull(),
  question: varchar("question", { length: 500 }).notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BusinessFaq = typeof businessFaqs.$inferSelect;
export type InsertBusinessFaq = typeof businessFaqs.$inferInsert;
