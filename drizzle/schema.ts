import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  /** Event start as UTC ms timestamp */
  startDate: timestamp("startDate").notNull(),
  /** Event end (nullable for single-time events) */
  endDate: timestamp("endDate"),
  venueName: varchar("venueName", { length: 255 }),
  venueAddress: varchar("venueAddress", { length: 500 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  externalUrl: varchar("externalUrl", { length: 500 }),
  imageUrl: varchar("imageUrl", { length: 1024 }),
  category: mysqlEnum("category", [
    "concerts",
    "food-drink",
    "sports",
    "arts-culture",
    "festivals",
    "family",
    "nightlife",
    "free",
    "markets",
    "community",
  ]).notNull(),
  isFeatured: mysqlEnum("isFeatured", ["yes", "no"]).default("no").notNull(),
  isRecurring: mysqlEnum("isRecurring", ["yes", "no"]).default("no").notNull(),
  submittedBy: int("submittedBy"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
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
