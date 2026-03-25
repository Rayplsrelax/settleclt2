import { eq, and, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, movingQuotes, businessSubmissions, newsletterSubscribers, enrichedServices, passportEntries, bingoCards, bingoProgress, wishlists, comments, commentVotes, blogPosts, type InsertMovingQuote, type InsertBusinessSubmission, type InsertNewsletterSubscriber, type InsertEnrichedService, type InsertPassportEntry, type InsertBingoCard, type InsertBingoProgress, type InsertWishlistEntry, type InsertComment, type InsertCommentVote, type InsertBlogPost } from "../drizzle/schema";
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

// --- Lead capture: moving quotes ---
export async function insertMovingQuote(data: InsertMovingQuote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(movingQuotes).values(data);
  return { success: true };
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
