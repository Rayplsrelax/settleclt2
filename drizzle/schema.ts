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

// Lead capture — moving quote requests
export const movingQuotes = mysqlTable("moving_quotes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  fromCity: varchar("fromCity", { length: 255 }),
  moveDate: varchar("moveDate", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MovingQuote = typeof movingQuotes.$inferSelect;
export type InsertMovingQuote = typeof movingQuotes.$inferInsert;

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
