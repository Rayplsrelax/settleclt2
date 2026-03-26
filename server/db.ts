import { eq, and, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, businessSubmissions, newsletterSubscribers, enrichedServices, passportEntries, bingoCards, bingoProgress, wishlists, comments, commentVotes, blogPosts, events, tags, contentTags, type InsertBusinessSubmission, type InsertNewsletterSubscriber, type InsertEnrichedService, type InsertPassportEntry, type InsertBingoCard, type InsertBingoProgress, type InsertWishlistEntry, type InsertComment, type InsertCommentVote, type InsertBlogPost, type InsertEvent, type InsertTag, type InsertContentTag } from "../drizzle/schema";
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
