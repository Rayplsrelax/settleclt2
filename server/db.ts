import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, businessSubmissions, newsletterSubscribers, enrichedServices, directoryListings, passportEntries, bingoCards, bingoProgress, wishlists, comments, commentVotes, blogPosts, events, tags, contentTags, searchQueries, userTagPreferences, type InsertBusinessSubmission, type InsertNewsletterSubscriber, type InsertEnrichedService, type InsertDirectoryListing, type InsertPassportEntry, type InsertBingoCard, type InsertBingoProgress, type InsertWishlistEntry, type InsertComment, type InsertCommentVote, type InsertBlogPost, type InsertEvent, type InsertTag, type InsertContentTag, type InsertSearchQuery, type InsertUserTagPreference, reviews, type InsertReview, referrals, type InsertReferral, businessClaims, type InsertBusinessClaim, businessListingOverrides, type InsertBusinessListingOverride, premiumListings, type InsertPremiumListing, notifications, type InsertNotification, notificationPreferences, type InsertNotificationPreference, pushSubscriptions, type InsertPushSubscription } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// --- Business listing submissions ---
export async function insertBusinessSubmission(data: InsertBusinessSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(businessSubmissions).values(data);
  return { success: true };
}

// --- Enriched services (Google Places data) ---
export async function upsertEnrichedService(data: InsertEnrichedService) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(enrichedServices).where(eq(enrichedServices.serviceKey, data.serviceKey)).limit(1);
  if (existing.length > 0) {
    await db.update(enrichedServices).set({
      googlePlaceId: data.googlePlaceId,
      googleRating: data.googleRating,
      reviewCount: data.reviewCount,
      verifiedAddress: data.verifiedAddress,
      verifiedPhone: data.verifiedPhone,
      hoursJson: data.hoursJson,
      photosJson: data.photosJson,
      googleTypes: data.googleTypes,
      priceLevel: data.priceLevel,
      verified: data.verified ?? 'verified',
      enrichedBy: data.enrichedBy,
    }).where(eq(enrichedServices.serviceKey, data.serviceKey));
    return { success: true, updated: true };
  }
  await db.insert(enrichedServices).values(data);
  return { success: true, updated: false };
}

export async function getEnrichedService(serviceKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(enrichedServices).where(eq(enrichedServices.serviceKey, serviceKey)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEnrichedServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(enrichedServices);
}

// --- Passport entries ---
export async function addPassportEntry(data: InsertPassportEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(passportEntries).values(data);
  return { success: true };
}

export async function getPassportEntries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(passportEntries).where(eq(passportEntries.userId, userId)).orderBy(desc(passportEntries.visitedAt));
}

export async function deletePassportEntry(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(passportEntries).where(and(eq(passportEntries.id, id), eq(passportEntries.userId, userId)));
  return { success: true };
}

// --- Bingo cards ---
export async function getActiveBingoCards() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bingoCards).where(eq(bingoCards.active, 'yes'));
}

export async function getBingoProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bingoProgress).where(eq(bingoProgress.userId, userId));
}

export async function upsertBingoProgress(data: { userId: number; cardId: number; completedSquaresJson: string; completedAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(bingoProgress).where(and(eq(bingoProgress.userId, data.userId), eq(bingoProgress.cardId, data.cardId))).limit(1);
  if (existing.length > 0) {
    await db.update(bingoProgress).set({ completedSquaresJson: data.completedSquaresJson, completedAt: data.completedAt ?? null }).where(eq(bingoProgress.id, existing[0].id));
    return { success: true, updated: true };
  }
  await db.insert(bingoProgress).values({ userId: data.userId, cardId: data.cardId, completedSquaresJson: data.completedSquaresJson, completedAt: data.completedAt ?? null });
  return { success: true, updated: false };
}

// --- Wishlists ---
export async function addWishlistEntry(data: InsertWishlistEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check for duplicate
  const existing = await db.select().from(wishlists).where(and(eq(wishlists.userId, data.userId!), eq(wishlists.serviceKey, data.serviceKey))).limit(1);
  if (existing.length > 0) return { success: true, alreadyExists: true };
  await db.insert(wishlists).values(data);
  return { success: true, alreadyExists: false };
}

export async function removeWishlistEntry(serviceKey: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(wishlists).where(and(eq(wishlists.serviceKey, serviceKey), eq(wishlists.userId, userId)));
  return { success: true };
}

export async function getWishlistEntries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wishlists).where(eq(wishlists.userId, userId)).orderBy(desc(wishlists.createdAt));
}

export async function updateWishlistNotes(id: number, userId: number, notes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(wishlists).set({ notes }).where(and(eq(wishlists.id, id), eq(wishlists.userId, userId)));
  return { success: true };
}

// --- Comments ---
export async function addComment(data: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values(data);
  return { success: true, id: result[0].insertId };
}

export async function getComments(targetType: string, targetId: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: comments.id,
    userId: comments.userId,
    targetType: comments.targetType,
    targetId: comments.targetId,
    parentId: comments.parentId,
    content: comments.content,
    upvotes: comments.upvotes,
    downvotes: comments.downvotes,
    deleted: comments.deleted,
    createdAt: comments.createdAt,
    userName: users.name,
  }).from(comments).leftJoin(users, eq(comments.userId, users.id)).where(and(eq(comments.targetType, targetType), eq(comments.targetId, targetId))).orderBy(asc(comments.createdAt));
  return rows;
}

export async function deleteComment(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete — mark as deleted
  await db.update(comments).set({ deleted: 'yes', content: '[deleted]' }).where(and(eq(comments.id, id), eq(comments.userId, userId)));
  return { success: true };
}

export async function voteComment(userId: number, commentId: number, voteType: 'up' | 'down') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check existing vote
  const existing = await db.select().from(commentVotes).where(and(eq(commentVotes.userId, userId), eq(commentVotes.commentId, commentId))).limit(1);
  if (existing.length > 0) {
    if (existing[0].voteType === voteType) {
      // Remove vote (toggle off)
      await db.delete(commentVotes).where(eq(commentVotes.id, existing[0].id));
      const field = voteType === 'up' ? comments.upvotes : comments.downvotes;
      await db.update(comments).set({ [voteType === 'up' ? 'upvotes' : 'downvotes']: sql`${field} - 1` }).where(eq(comments.id, commentId));
      return { success: true, action: 'removed' as const };
    } else {
      // Switch vote
      await db.update(commentVotes).set({ voteType }).where(eq(commentVotes.id, existing[0].id));
      const oldField = existing[0].voteType === 'up' ? 'upvotes' : 'downvotes';
      const newField = voteType === 'up' ? 'upvotes' : 'downvotes';
      await db.update(comments).set({ [oldField]: sql`${oldField === 'upvotes' ? comments.upvotes : comments.downvotes} - 1`, [newField]: sql`${newField === 'upvotes' ? comments.upvotes : comments.downvotes} + 1` }).where(eq(comments.id, commentId));
      return { success: true, action: 'switched' as const };
    }
  }
  // New vote
  await db.insert(commentVotes).values({ userId, commentId, voteType });
  const field = voteType === 'up' ? 'upvotes' : 'downvotes';
  await db.update(comments).set({ [voteType === 'up' ? 'upvotes' : 'downvotes']: sql`${field} + 1` }).where(eq(comments.id, commentId));
  return { success: true, action: 'added' as const };
}

export async function getUserVotes(userId: number, commentIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (commentIds.length === 0) return [];
  return db.select().from(commentVotes).where(and(eq(commentVotes.userId, userId), sql`${commentVotes.commentId} IN (${sql.join(commentIds.map(id => sql`${id}`), sql`, `)})` ));
}

// --- Blog posts ---
export async function createBlogPost(data: InsertBlogPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(blogPosts).values(data);
  return { success: true };
}

export async function updateBlogPost(id: number, data: Partial<InsertBlogPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(blogPosts).set(data).where(eq(blogPosts.id, id));
  return { success: true };
}

export async function deleteBlogPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  return { success: true };
}

export async function getPublishedBlogPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts).where(eq(blogPosts.status, 'published')).orderBy(desc(blogPosts.publishedAt));
}

export async function getAllBlogPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt));
}

export async function getBlogPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// --- Newsletter subscribers ---
export async function insertNewsletterSubscriber(data: InsertNewsletterSubscriber) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.insert(newsletterSubscribers).values(data);
    return { success: true, alreadySubscribed: false };
  } catch (error: any) {
    // Handle duplicate email gracefully
    if (error?.code === "ER_DUP_ENTRY" || error?.message?.includes("Duplicate")) {
      return { success: true, alreadySubscribed: true };
    }
    throw error;
  }
}

// --- Leaderboard queries ---

/**
 * Get top explorers by passport stamps count.
 * Returns user id, name, and stamp count, ordered by most stamps.
 */
export async function getLeaderboardByStamps(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      userId: passportEntries.userId,
      userName: users.name,
      stampCount: sql<number>`COUNT(*)`.as("stampCount"),
    })
    .from(passportEntries)
    .innerJoin(users, eq(passportEntries.userId, users.id))
    .groupBy(passportEntries.userId, users.name)
    .orderBy(sql`stampCount DESC`)
    .limit(limit);
  return rows;
}

/**
 * Get top explorers by completed bingo cards.
 * Returns user id, name, completed card count, and total squares checked.
 */
export async function getLeaderboardByBingo(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      userId: bingoProgress.userId,
      userName: users.name,
      completedCards: sql<number>`SUM(CASE WHEN ${bingoProgress.completedAt} IS NOT NULL THEN 1 ELSE 0 END)`.as("completedCards"),
      totalSquaresChecked: sql<number>`COUNT(*)`.as("totalEntries"),
    })
    .from(bingoProgress)
    .innerJoin(users, eq(bingoProgress.userId, users.id))
    .groupBy(bingoProgress.userId, users.name)
    .orderBy(sql`completedCards DESC`)
    .limit(limit);
  return rows;
}

/**
 * Get unique neighborhoods visited per user for the leaderboard.
 */
export async function getLeaderboardByNeighborhoods(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      userId: passportEntries.userId,
      userName: users.name,
      neighborhoodCount: sql<number>`COUNT(DISTINCT ${passportEntries.neighborhoodId})`.as("neighborhoodCount"),
    })
    .from(passportEntries)
    .innerJoin(users, eq(passportEntries.userId, users.id))
    .where(sql`${passportEntries.neighborhoodId} IS NOT NULL AND ${passportEntries.neighborhoodId} != ''`)
    .groupBy(passportEntries.userId, users.name)
    .orderBy(sql`neighborhoodCount DESC`)
    .limit(limit);
  return rows;
}

// =============================================
// Events helpers
// =============================================

export async function createEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(events).values(data);
  return { success: true };
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(events).set(data).where(eq(events.id, id));
  return { success: true };
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Also remove associated content tags
  await db.delete(contentTags).where(
    and(eq(contentTags.contentType, "event"), eq(contentTags.contentId, String(id)))
  );
  await db.delete(events).where(eq(events.id, id));
  return { success: true };
}

export async function getPublishedEvents(opts?: { category?: string; neighborhood?: string; fromDate?: Date; toDate?: Date; limit?: number; featured?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(events.status, "published")];
  if (opts?.category) conditions.push(eq(events.category, opts.category as any));
  if (opts?.neighborhood) conditions.push(eq(events.neighborhood, opts.neighborhood));
  if (opts?.featured) conditions.push(eq(events.isFeatured, "yes"));
  if (opts?.fromDate) conditions.push(sql`${events.startDate} >= ${opts.fromDate}`);
  if (opts?.toDate) conditions.push(sql`${events.startDate} <= ${opts.toDate}`);

  const query = db.select().from(events).where(and(...conditions)).orderBy(asc(events.startDate));
  if (opts?.limit) {
    return await query.limit(opts.limit);
  }
  return await query;
}

export async function getAllEvents() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(events).orderBy(desc(events.startDate));
}

export async function getEventBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// =============================================
// Tags helpers
// =============================================

export async function createTag(data: InsertTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(tags).values(data);
  return { success: true };
}

export async function getAllTags(category?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (category) {
    return await db.select().from(tags).where(eq(tags.category, category as any)).orderBy(asc(tags.name));
  }
  return await db.select().from(tags).orderBy(asc(tags.name));
}

export async function getTagBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function addContentTag(data: InsertContentTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Avoid duplicates
  const existing = await db.select().from(contentTags).where(
    and(
      eq(contentTags.tagId, data.tagId),
      eq(contentTags.contentType, data.contentType),
      eq(contentTags.contentId, data.contentId),
    )
  ).limit(1);
  if (existing.length > 0) return { success: true, duplicate: true };
  await db.insert(contentTags).values(data);
  return { success: true, duplicate: false };
}

export async function removeContentTag(tagId: number, contentType: string, contentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contentTags).where(
    and(
      eq(contentTags.tagId, tagId),
      eq(contentTags.contentType, contentType as any),
      eq(contentTags.contentId, contentId),
    )
  );
  return { success: true };
}

export async function getContentTags(contentType: string, contentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select({ tagId: contentTags.tagId, tagName: tags.name, tagSlug: tags.slug, tagCategory: tags.category })
    .from(contentTags)
    .innerJoin(tags, eq(contentTags.tagId, tags.id))
    .where(
      and(
        eq(contentTags.contentType, contentType as any),
        eq(contentTags.contentId, contentId),
      )
    );
  return result;
}

export async function getContentByTag(tagId: number, contentType?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(contentTags.tagId, tagId)];
  if (contentType) conditions.push(eq(contentTags.contentType, contentType as any));
  return await db
    .select({ contentType: contentTags.contentType, contentId: contentTags.contentId })
    .from(contentTags)
    .where(and(...conditions));
}

export async function bulkAddContentTags(items: InsertContentTag[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (items.length === 0) return { success: true };
  await db.insert(contentTags).values(items);
  return { success: true };
}

// --- Activity Feed ---
export async function getRecentActivity(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  // Fetch recent passport stamps with user info
  const recentStamps = await db
    .select({
      id: passportEntries.id,
      userId: passportEntries.userId,
      userName: users.name,
      serviceKey: passportEntries.serviceKey,
      customPlaceName: passportEntries.customPlaceName,
      eventSlug: passportEntries.eventSlug,
      neighborhoodId: passportEntries.neighborhoodId,
      createdAt: passportEntries.createdAt,
    })
    .from(passportEntries)
    .leftJoin(users, eq(passportEntries.userId, users.id))
    .orderBy(desc(passportEntries.createdAt))
    .limit(limit);

  // Fetch recent comments with user info
  const recentComments = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      userName: users.name,
      targetType: comments.targetType,
      targetId: comments.targetId,
      content: comments.content,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.deleted, "no"))
    .orderBy(desc(comments.createdAt))
    .limit(limit);

  // Fetch recent bingo completions
  const recentBingo = await db
    .select({
      id: bingoProgress.id,
      userId: bingoProgress.userId,
      userName: users.name,
      cardId: bingoProgress.cardId,
      cardTitle: bingoCards.title,
      completedAt: bingoProgress.completedAt,
      updatedAt: bingoProgress.updatedAt,
    })
    .from(bingoProgress)
    .leftJoin(users, eq(bingoProgress.userId, users.id))
    .leftJoin(bingoCards, eq(bingoProgress.cardId, bingoCards.id))
    .orderBy(desc(bingoProgress.updatedAt))
    .limit(limit);

  // Merge and sort all activities
  type ActivityItem = {
    type: 'stamp' | 'comment' | 'bingo';
    id: number;
    userId: number;
    userName: string | null;
    description: string;
    detail: string | null;
    timestamp: Date;
  };

  const activities: ActivityItem[] = [];

  for (const s of recentStamps) {
    const placeName = s.customPlaceName || s.serviceKey || s.eventSlug || 'a place';
    activities.push({
      type: 'stamp',
      id: s.id,
      userId: s.userId,
      userName: s.userName,
      description: s.eventSlug ? `attended ${placeName}` : `stamped ${placeName}`,
      detail: s.neighborhoodId || null,
      timestamp: s.createdAt,
    });
  }

  for (const c of recentComments) {
    const preview = (c.content ?? '').slice(0, 80) + ((c.content ?? '').length > 80 ? '...' : '');
    activities.push({
      type: 'comment',
      id: c.id,
      userId: c.userId,
      userName: c.userName,
      description: `commented on ${c.targetType} ${c.targetId}`,
      detail: preview,
      timestamp: c.createdAt,
    });
  }

  for (const b of recentBingo) {
    activities.push({
      type: 'bingo',
      id: b.id,
      userId: b.userId,
      userName: b.userName,
      description: b.cardTitle ? `made progress on "${b.cardTitle}"` : 'made bingo progress',
      detail: b.completedAt ? 'Completed!' : null,
      timestamp: b.updatedAt,
    });
  }

  // Sort by timestamp descending and return top N
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return activities.slice(0, limit);
}

// ── Directory Listings (dynamic, admin-added) ──────────────────────────

export async function addDirectoryListing(data: InsertDirectoryListing) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(directoryListings).values(data);
  return result;
}

export async function getDirectoryListings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(directoryListings).where(eq(directoryListings.active, true)).orderBy(desc(directoryListings.createdAt));
}

export async function getAllDirectoryListings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(directoryListings).orderBy(desc(directoryListings.createdAt));
}

export async function updateDirectoryListing(id: number, data: Partial<InsertDirectoryListing>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(directoryListings).set(data).where(eq(directoryListings.id, id));
  return { success: true };
}

export async function deleteDirectoryListing(id: number) {
  const db = await getDb();
  if (!db) return null;
  await db.delete(directoryListings).where(eq(directoryListings.id, id));
  return { success: true };
}

// Update user newsletter opt-in preference
export async function updateUserNewsletter(userId: number, optIn: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ newsletterOptIn: optIn }).where(eq(users.id, userId));
}

// --- Tag Engagement ---
import { tagEngagement, type InsertTagEngagement } from "../drizzle/schema";
export async function trackTagEngagement(data: InsertTagEngagement) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(tagEngagement).values(data);
  return result;
}

export async function getTrendingTags(limit: number = 10, days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  // Get tag engagement counts grouped by tag, joined with tag info
  const results = await db.select({
    tagId: tagEngagement.tagId,
    tagName: tags.name,
    tagSlug: tags.slug,
    tagCategory: tags.category,
    engagementCount: sql<number>`COUNT(*)`,
  })
    .from(tagEngagement)
    .innerJoin(tags, eq(tagEngagement.tagId, tags.id))
    .where(gte(tagEngagement.createdAt, cutoff))
    .groupBy(tagEngagement.tagId, tags.name, tags.slug, tags.category)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(limit);
  
  return results;
}

export async function bulkTrackTagEngagement(entries: InsertTagEngagement[]) {
  const db = await getDb();
  if (!db) return null;
  if (entries.length === 0) return null;
  await db.insert(tagEngagement).values(entries);
  return { success: true };
}


// ========== SEARCH QUERY TRACKING ==========

export async function trackSearchQuery(data: { query: string; resultCount: number; userId?: number; source?: string }) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(searchQueries).values({
    query: data.query,
    queryNormalized: data.query.toLowerCase().trim(),
    resultCount: data.resultCount,
    userId: data.userId ?? null,
    source: data.source ?? "global-search",
  });
  return result;
}

export async function getPopularSearches(limit: number = 10, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const results = await db.select({
    query: searchQueries.queryNormalized,
    searchCount: sql<number>`COUNT(*)`,
    avgResults: sql<number>`ROUND(AVG(resultCount))`,
  })
    .from(searchQueries)
    .where(gte(searchQueries.createdAt, cutoff))
    .groupBy(searchQueries.queryNormalized)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(limit);
  return results;
}

export async function getSearchAnalytics(days: number = 30) {
  const db = await getDb();
  if (!db) return { totalSearches: 0, uniqueQueries: 0, zeroResultQueries: 0, dailySearches: [] };
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const [totals] = await db.select({
    totalSearches: sql<number>`COUNT(*)`,
    uniqueQueries: sql<number>`COUNT(DISTINCT queryNormalized)`,
    zeroResultQueries: sql<number>`SUM(CASE WHEN resultCount = 0 THEN 1 ELSE 0 END)`,
  }).from(searchQueries).where(gte(searchQueries.createdAt, cutoff));

  const dailySearches = await db.select({
    date: sql<string>`DATE(createdAt)`,
    count: sql<number>`COUNT(*)`,
  })
    .from(searchQueries)
    .where(gte(searchQueries.createdAt, cutoff))
    .groupBy(sql`DATE(createdAt)`)
    .orderBy(sql`DATE(createdAt)`);

  return { ...totals, dailySearches };
}

// ========== TAG ANALYTICS ==========

export async function getTagAnalytics(days: number = 30) {
  const db = await getDb();
  if (!db) return { topTags: [], engagementByType: [], dailyEngagement: [], velocityData: [] };
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // Top tags by engagement
  const topTags = await db.select({
    tagId: tagEngagement.tagId,
    tagName: tags.name,
    tagSlug: tags.slug,
    tagCategory: tags.category,
    total: sql<number>`COUNT(*)`,
    views: sql<number>`SUM(CASE WHEN ${tagEngagement.engagementType} = 'view' THEN 1 ELSE 0 END)`,
    clicks: sql<number>`SUM(CASE WHEN ${tagEngagement.engagementType} = 'click' THEN 1 ELSE 0 END)`,
    stamps: sql<number>`SUM(CASE WHEN ${tagEngagement.engagementType} = 'stamp' THEN 1 ELSE 0 END)`,
    shares: sql<number>`SUM(CASE WHEN ${tagEngagement.engagementType} = 'share' THEN 1 ELSE 0 END)`,
  })
    .from(tagEngagement)
    .innerJoin(tags, eq(tagEngagement.tagId, tags.id))
    .where(gte(tagEngagement.createdAt, cutoff))
    .groupBy(tagEngagement.tagId, tags.name, tags.slug, tags.category)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(20);

  // Engagement by content type
  const engagementByType = await db.select({
    contentType: tagEngagement.contentType,
    count: sql<number>`COUNT(*)`,
  })
    .from(tagEngagement)
    .where(gte(tagEngagement.createdAt, cutoff))
    .groupBy(tagEngagement.contentType)
    .orderBy(sql`COUNT(*) DESC`);

  // Daily engagement trend
  const dailyEngagement = await db.select({
    date: sql<string>`DATE(createdAt)`,
    count: sql<number>`COUNT(*)`,
  })
    .from(tagEngagement)
    .where(gte(tagEngagement.createdAt, cutoff))
    .groupBy(sql`DATE(createdAt)`)
    .orderBy(sql`DATE(createdAt)`);

  // Velocity: compare this week vs last week for top tags
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const velocityData = await db.select({
    tagId: tagEngagement.tagId,
    tagName: tags.name,
    thisWeek: sql<number>`SUM(CASE WHEN ${tagEngagement.createdAt} >= ${oneWeekAgo} THEN 1 ELSE 0 END)`,
    lastWeek: sql<number>`SUM(CASE WHEN ${tagEngagement.createdAt} >= ${twoWeeksAgo} AND ${tagEngagement.createdAt} < ${oneWeekAgo} THEN 1 ELSE 0 END)`,
  })
    .from(tagEngagement)
    .innerJoin(tags, eq(tagEngagement.tagId, tags.id))
    .where(gte(tagEngagement.createdAt, twoWeeksAgo))
    .groupBy(tagEngagement.tagId, tags.name)
    .orderBy(sql`SUM(CASE WHEN ${tagEngagement.createdAt} >= ${oneWeekAgo} THEN 1 ELSE 0 END) DESC`)
    .limit(15);

  return { topTags, engagementByType, dailyEngagement, velocityData };
}

// ========== USER TAG PREFERENCES (for recommendations) ==========

const ENGAGEMENT_WEIGHTS: Record<string, number> = {
  view: 1,
  click: 3,
  stamp: 5,
  share: 2,
};

export async function updateUserTagPreference(userId: number, tagId: number, engagementType: string) {
  const db = await getDb();
  if (!db) return null;
  const weight = ENGAGEMENT_WEIGHTS[engagementType] ?? 1;

  // Upsert: insert or update score
  await db.insert(userTagPreferences).values({
    userId,
    tagId,
    score: weight,
  }).onDuplicateKeyUpdate({
    set: {
      score: sql`score + ${weight}`,
      lastEngagedAt: sql`NOW()`,
    },
  });
  return { success: true };
}

export async function getUserTagPreferences(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({
    tagId: userTagPreferences.tagId,
    tagName: tags.name,
    tagSlug: tags.slug,
    tagCategory: tags.category,
    score: userTagPreferences.score,
  })
    .from(userTagPreferences)
    .innerJoin(tags, eq(userTagPreferences.tagId, tags.id))
    .where(eq(userTagPreferences.userId, userId))
    .orderBy(desc(userTagPreferences.score))
    .limit(limit);
  return results;
}

export async function getRecommendedContent(userId: number) {
  const db = await getDb();
  if (!db) return { neighborhoods: [], events: [], directory: [] };

  // Get user's top tag preferences
  const prefs = await getUserTagPreferences(userId, 5);
  if (prefs.length === 0) return { neighborhoods: [], events: [], directory: [] };

  const topTagIds = prefs.map(p => p.tagId);

  // Find content tagged with user's preferred tags
  const taggedContent = await db.select({
    contentType: contentTags.contentType,
    contentId: contentTags.contentId,
    tagId: contentTags.tagId,
    tagName: tags.name,
  })
    .from(contentTags)
    .innerJoin(tags, eq(contentTags.tagId, tags.id))
    .where(sql`${contentTags.tagId} IN (${sql.join(topTagIds.map(id => sql`${id}`), sql`, `)})`)
    .limit(50);

  const neighborhoods = taggedContent.filter(c => c.contentType === "neighborhood").map(c => ({
    id: c.contentId,
    matchedTag: c.tagName,
  }));
  const eventContent = taggedContent.filter(c => c.contentType === "event").map(c => ({
    id: c.contentId,
    matchedTag: c.tagName,
  }));
  const directory = taggedContent.filter(c => c.contentType === "directory").map(c => ({
    id: c.contentId,
    matchedTag: c.tagName,
  }));

  return { neighborhoods, events: eventContent, directory };
}


// ─── Monthly Digest Helpers ────────────────────────────────────

/** Get new directory listings added in the past N days */
export async function getNewListings(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date(Date.now() - days * 86400000);
  return db.select().from(directoryListings)
    .where(and(eq(directoryListings.active, true), gte(directoryListings.createdAt, cutoff)))
    .orderBy(desc(directoryListings.createdAt));
}

/** Get published events starting in the next N days */
export async function getUpcomingEvents(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const future = new Date(Date.now() + days * 86400000);
  return db.select().from(events)
    .where(and(
      eq(events.status, "published"),
      gte(events.startDate, now),
      lte(events.startDate, future),
    ))
    .orderBy(events.startDate);
}

/** Get recently published blog posts */
export async function getRecentBlogPosts(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date(Date.now() - days * 86400000);
  return db.select().from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), gte(blogPosts.createdAt, cutoff)))
    .orderBy(desc(blogPosts.createdAt));
}

/** Get newsletter subscribers (users who opted in + standalone subscribers) */
export async function getNewsletterRecipients() {
  const db = await getDb();
  if (!db) return { users: [] as { email: string; name: string | null }[], subscribers: [] as { email: string }[] };
  
  const optedInUsers = await db.select({ email: users.email, name: users.name })
    .from(users)
    .where(and(eq(users.newsletterOptIn, true), sql`${users.email} IS NOT NULL`));
  
  const standaloneSubscribers = await db.select({ email: newsletterSubscribers.email })
    .from(newsletterSubscribers);
  
  return { users: optedInUsers as { email: string; name: string | null }[], subscribers: standaloneSubscribers };
}


// ─── Community Reviews Helpers ─────────────────────────────────

/** Create a new review */
export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(reviews).values(data);
}

/** Get visible reviews for a target (neighborhood or directory listing) */
export async function getReviews(targetType: "neighborhood" | "directory", targetId: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: reviews.id,
    targetType: reviews.targetType,
    targetId: reviews.targetId,
    userId: reviews.userId,
    rating: reviews.rating,
    tip: reviews.tip,
    aspect: reviews.aspect,
    visible: reviews.visible,
    createdAt: reviews.createdAt,
    userName: users.name,
  })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(and(
      eq(reviews.targetType, targetType),
      eq(reviews.targetId, targetId),
      eq(reviews.visible, "yes"),
    ))
    .orderBy(desc(reviews.createdAt));
  return rows;
}

/** Get average rating and count for a target */
export async function getReviewStats(targetType: "neighborhood" | "directory", targetId: string) {
  const db = await getDb();
  if (!db) return { avgRating: 0, count: 0 };
  const result = await db.select({
    avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
    count: sql<number>`COUNT(*)`,
  })
    .from(reviews)
    .where(and(
      eq(reviews.targetType, targetType),
      eq(reviews.targetId, targetId),
      eq(reviews.visible, "yes"),
    ));
  return { avgRating: Number(result[0]?.avgRating ?? 0), count: Number(result[0]?.count ?? 0) };
}

/** Delete a review (by owner or admin) */
export async function deleteReview(reviewId: number, userId: number, isAdmin: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (isAdmin) {
    await db.delete(reviews).where(eq(reviews.id, reviewId));
  } else {
    await db.delete(reviews).where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)));
  }
}

/** Toggle review visibility (admin only) */
export async function toggleReviewVisibility(reviewId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select({ visible: reviews.visible }).from(reviews).where(eq(reviews.id, reviewId));
  if (!existing[0]) throw new Error("Review not found");
  const newVisible = existing[0].visible === "yes" ? "no" : "yes";
  await db.update(reviews).set({ visible: newVisible as "yes" | "no" }).where(eq(reviews.id, reviewId));
}

/** Get all reviews for admin moderation */
export async function getAllReviews(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: reviews.id,
    targetType: reviews.targetType,
    targetId: reviews.targetId,
    userId: reviews.userId,
    rating: reviews.rating,
    tip: reviews.tip,
    aspect: reviews.aspect,
    visible: reviews.visible,
    createdAt: reviews.createdAt,
    userName: users.name,
  })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

// --- Referrals ---
export async function submitReferral(data: Omit<InsertReferral, "id" | "createdAt" | "updatedAt" | "status">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(referrals).values(data);
  return { id: result[0].insertId };
}

export async function getReferrals(opts?: { status?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  let q = db.select().from(referrals).orderBy(desc(referrals.createdAt)).$dynamic();
  if (opts?.status) {
    q = q.where(eq(referrals.status, opts.status as any));
  }
  if (opts?.limit) {
    q = q.limit(opts.limit);
  }
  return q;
}

export async function updateReferralStatus(id: number, status: string, adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(referrals)
    .set({ status: status as any, ...(adminNotes !== undefined ? { adminNotes } : {}) })
    .where(eq(referrals.id, id));
  return { success: true };
}

export async function getReferralStats() {
  const db = await getDb();
  if (!db) return { total: 0, byStatus: {}, byType: {}, bySource: {}, conversionRate: 0, avgAgeDays: 0, monthlyTrend: [] as { month: string; count: number }[], recentLeads: [] as any[], needsFollowUp: 0 };
  const all = await db.select().from(referrals).orderBy(desc(referrals.createdAt));
  const total = all.length;
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  all.forEach(r => {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byType[r.referralType] = (byType[r.referralType] || 0) + 1;
    const src = (r as any).referralSource || 'direct';
    bySource[src] = (bySource[src] || 0) + 1;
  });
  // Conversion rate: closed / (total - new)
  const closed = byStatus['closed'] || 0;
  const processed = total - (byStatus['new'] || 0);
  const conversionRate = processed > 0 ? Math.round((closed / processed) * 100) : 0;
  // Average age in days for open leads (new + contacted + matched)
  const now = Date.now();
  const openLeads = all.filter(r => ['new', 'contacted', 'matched'].includes(r.status));
  const avgAgeDays = openLeads.length > 0
    ? Math.round(openLeads.reduce((sum, r) => sum + (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24), 0) / openLeads.length)
    : 0;
  // Monthly trend (last 6 months)
  const monthlyMap: Record<string, number> = {};
  all.forEach(r => {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + 1;
  });
  const monthlyTrend = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));
  // Recent 5 leads for quick view
  const recentLeads = all.slice(0, 5).map(r => ({
    id: r.id, name: r.name, referralType: r.referralType, status: r.status,
    createdAt: r.createdAt, neighborhoods: r.neighborhoods,
  }));
  // Leads in "new" status for > 48 hours that need follow-up
  const fortyEightHours = 48 * 60 * 60 * 1000;
  const needsFollowUp = all.filter(r => r.status === 'new' && (now - new Date(r.createdAt).getTime()) > fortyEightHours).length;
  return { total, byStatus, byType, bySource, conversionRate, avgAgeDays, monthlyTrend, recentLeads, needsFollowUp };
}

// --- Business Claims ---

export async function submitBusinessClaim(data: InsertBusinessClaim) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(businessClaims).values(data);
  return { id: result[0].insertId };
}

export async function getBusinessClaims(opts?: { status?: string; serviceKey?: string }) {
  const db = await getDb();
  if (!db) return [];
  let q = db.select().from(businessClaims).orderBy(desc(businessClaims.createdAt)).$dynamic();
  if (opts?.status) {
    q = q.where(eq(businessClaims.status, opts.status as any));
  }
  if (opts?.serviceKey) {
    q = q.where(eq(businessClaims.serviceKey, opts.serviceKey));
  }
  return q;
}

export async function updateBusinessClaimStatus(id: number, status: string, adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(businessClaims)
    .set({ status: status as any, ...(adminNotes !== undefined ? { adminNotes } : {}) })
    .where(eq(businessClaims.id, id));
  return { success: true };
}

export async function getBusinessClaimStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, approved: 0, rejected: 0 };
  const all = await db.select().from(businessClaims);
  const total = all.length;
  const pending = all.filter(c => c.status === 'pending').length;
  const approved = all.filter(c => c.status === 'approved').length;
  const rejected = all.filter(c => c.status === 'rejected').length;
  return { total, pending, approved, rejected };
}

export async function hasExistingClaim(serviceKey: string, email: string) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(businessClaims)
    .where(and(
      eq(businessClaims.serviceKey, serviceKey),
      eq(businessClaims.claimantEmail, email)
    ));
  return existing.length > 0;
}

// ============ Business Listing Overrides ============

export async function getListingOverride(serviceKey: string) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(businessListingOverrides)
    .where(and(eq(businessListingOverrides.serviceKey, serviceKey), eq(businessListingOverrides.isActive, true)));
  return results[0] || null;
}

export async function upsertListingOverride(serviceKey: string, claimId: number, data: Partial<InsertBusinessListingOverride>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(businessListingOverrides)
    .where(eq(businessListingOverrides.serviceKey, serviceKey));
  if (existing.length > 0) {
    await db.update(businessListingOverrides)
      .set({ ...data })
      .where(eq(businessListingOverrides.serviceKey, serviceKey));
    return { id: existing[0].id, updated: true };
  } else {
    const result = await db.insert(businessListingOverrides).values({
      serviceKey,
      claimId,
      ...data,
    });
    return { id: result[0].insertId, updated: false };
  }
}

export async function getApprovedClaimForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessClaims)
    .where(and(eq(businessClaims.userId, userId), eq(businessClaims.status, 'approved' as any)));
}

export async function getAllListingOverrides() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessListingOverrides).orderBy(desc(businessListingOverrides.updatedAt));
}

// ============ Premium Listings ============

export async function getPremiumListing(serviceKey: string) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(premiumListings)
    .where(and(eq(premiumListings.serviceKey, serviceKey), eq(premiumListings.paymentStatus, 'active' as any)));
  return results[0] || null;
}

export async function upsertPremiumListing(serviceKey: string, data: Partial<InsertPremiumListing>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(premiumListings)
    .where(eq(premiumListings.serviceKey, serviceKey));
  if (existing.length > 0) {
    await db.update(premiumListings).set({ ...data }).where(eq(premiumListings.serviceKey, serviceKey));
    return { id: existing[0].id, updated: true };
  } else {
    const result = await db.insert(premiumListings).values({ serviceKey, ...data });
    return { id: result[0].insertId, updated: false };
  }
}

export async function getAllPremiumListings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(premiumListings).orderBy(desc(premiumListings.updatedAt));
}

export async function incrementListingAnalytics(serviceKey: string, field: 'viewsThisPeriod' | 'clicksThisPeriod' | 'leadsThisPeriod') {
  const db = await getDb();
  if (!db) return;
  await db.update(premiumListings)
    .set({ [field]: sql`${premiumListings[field]} + 1` })
    .where(eq(premiumListings.serviceKey, serviceKey));
}

// --- Account Deletion: GDPR/CCPA compliant user data removal ---
export async function deleteUserAccount(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Delete all user-related data across tables (order matters for foreign keys)
  await db.delete(commentVotes).where(eq(commentVotes.userId, userId));
  await db.delete(comments).where(eq(comments.userId, userId));
  await db.delete(passportEntries).where(eq(passportEntries.userId, userId));
  await db.delete(bingoProgress).where(eq(bingoProgress.userId, userId));
  await db.delete(wishlists).where(eq(wishlists.userId, userId));
  await db.delete(reviews).where(eq(reviews.userId, userId));
  await db.delete(userTagPreferences).where(eq(userTagPreferences.userId, userId));
  await db.delete(searchQueries).where(eq(searchQueries.userId, userId));
  // Anonymize events submitted by user (don't delete the events themselves)
  await db.update(events).set({ submittedBy: null } as any).where(eq(events.submittedBy, userId));
  // Anonymize business claims (keep for business continuity)
  await db.update(businessClaims).set({ userId: null } as any).where(eq(businessClaims.userId, userId));
  // Finally delete the user record
  await db.delete(users).where(eq(users.id, userId));

  return true;
}


// ─── Notification System Helpers ──────────────────────────────────

export type NotificationCategory = "claim" | "review" | "payment" | "event" | "community" | "system";

/** Create a new in-app notification for a user */
export async function createNotification(data: {
  userId: number;
  category: NotificationCategory;
  title: string;
  body: string;
  actionUrl?: string;
  icon?: string;
  metadata?: Record<string, any>;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values({
    userId: data.userId,
    category: data.category,
    title: data.title,
    body: data.body,
    actionUrl: data.actionUrl || null,
    icon: data.icon || null,
    metadata: data.metadata || null,
  });
  return (result as any)[0]?.insertId ?? null;
}

/** Get notifications for a user, newest first, with optional limit and offset */
export async function getUserNotifications(userId: number, opts?: { limit?: number; offset?: number; unreadOnly?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  const conditions = [eq(notifications.userId, userId)];
  if (opts?.unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }
  return db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

/** Get unread notification count for a user */
export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

/** Mark a single notification as read */
export async function markNotificationRead(notificationId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  return true;
}

/** Mark all notifications as read for a user */
export async function markAllNotificationsRead(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return true;
}

/** Delete a notification */
export async function deleteNotification(notificationId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  return true;
}

/** Get notification preferences for a user */
export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
}

/** Upsert a notification preference for a user + category */
export async function upsertNotificationPreference(data: {
  userId: number;
  category: NotificationCategory;
  inApp?: boolean;
  email?: boolean;
  push?: boolean;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Check if preference exists
  const existing = await db.select().from(notificationPreferences)
    .where(and(
      eq(notificationPreferences.userId, data.userId),
      eq(notificationPreferences.category, data.category)
    ))
    .limit(1);
  if (existing.length > 0) {
    const updates: Record<string, any> = {};
    if (data.inApp !== undefined) updates.inApp = data.inApp;
    if (data.email !== undefined) updates.email = data.email;
    if (data.push !== undefined) updates.push = data.push;
    await db.update(notificationPreferences).set(updates)
      .where(eq(notificationPreferences.id, existing[0].id));
  } else {
    await db.insert(notificationPreferences).values({
      userId: data.userId,
      category: data.category,
      inApp: data.inApp ?? true,
      email: data.email ?? true,
      push: data.push ?? false,
    });
  }
  return true;
}

/** Check if a user has a specific channel enabled for a category (defaults to true for inApp/email) */
export async function isNotificationEnabled(userId: number, category: NotificationCategory, channel: "inApp" | "email" | "push"): Promise<boolean> {
  const db = await getDb();
  if (!db) return channel !== "push"; // Default: inApp and email on, push off
  const prefs = await db.select().from(notificationPreferences)
    .where(and(
      eq(notificationPreferences.userId, userId),
      eq(notificationPreferences.category, category)
    ))
    .limit(1);
  if (prefs.length === 0) return channel !== "push"; // Default
  return !!prefs[0][channel];
}

// ─── Push Subscription Helpers ──────────────────────────────────

/** Save a push subscription for a user */
export async function savePushSubscription(data: {
  userId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Remove existing subscription with same endpoint (re-subscribe)
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, data.endpoint));
  await db.insert(pushSubscriptions).values({
    userId: data.userId,
    endpoint: data.endpoint,
    p256dh: data.p256dh,
    auth: data.auth,
    userAgent: data.userAgent || null,
  });
  return true;
}

/** Get all push subscriptions for a user */
export async function getUserPushSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}

/** Remove a push subscription by endpoint */
export async function removePushSubscription(endpoint: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  return true;
}
