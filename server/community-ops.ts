import { eq, and, desc, sql, gte, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  businessSubmissions,
  reviews,
  comments,
  type BusinessSubmission,
  type Review,
  type Comment,
} from "../drizzle/schema";

// ─── Item 17: Submission Moderation ───

export async function getSubmissionQueue(opts: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<BusinessSubmission[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.status) conditions.push(eq(businessSubmissions.status, opts.status as any));
  const query = db.select().from(businessSubmissions);
  if (conditions.length > 0) query.where(and(...conditions));
  query.orderBy(desc(businessSubmissions.createdAt));
  query.limit(opts.limit ?? 50).offset(opts.offset ?? 0);
  return query;
}

export async function getSubmissionStats(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}> {
  const db = await getDb();
  if (!db) return { pending: 0, approved: 0, rejected: 0, total: 0 };
  const [pending] = await db.select({ count: sql<number>`count(*)` }).from(businessSubmissions).where(eq(businessSubmissions.status, "pending"));
  const [approved] = await db.select({ count: sql<number>`count(*)` }).from(businessSubmissions).where(eq(businessSubmissions.status, "approved"));
  const [rejected] = await db.select({ count: sql<number>`count(*)` }).from(businessSubmissions).where(eq(businessSubmissions.status, "rejected"));
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(businessSubmissions);
  return {
    pending: pending?.count ?? 0,
    approved: approved?.count ?? 0,
    rejected: rejected?.count ?? 0,
    total: total?.count ?? 0,
  };
}

// ─── Item 18: Review & Comment Moderation ───

export async function getReviewQueue(opts: {
  visibleOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Review[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.visibleOnly !== undefined) {
    conditions.push(eq(reviews.visible, opts.visibleOnly ? "yes" : "no"));
  }
  const query = db.select().from(reviews);
  if (conditions.length > 0) query.where(and(...conditions));
  query.orderBy(desc(reviews.createdAt));
  query.limit(opts.limit ?? 50).offset(opts.offset ?? 0);
  return query;
}

export async function getHiddenReviews(opts: {
  limit?: number;
}): Promise<Review[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.visible, "no")).orderBy(desc(reviews.createdAt)).limit(opts.limit ?? 50);
}

export async function getCommentQueue(opts: {
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Comment[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (!opts.includeDeleted) {
    conditions.push(eq(comments.deleted, "no"));
  }
  const query = db.select().from(comments);
  if (conditions.length > 0) query.where(and(...conditions));
  query.orderBy(desc(comments.createdAt));
  query.limit(opts.limit ?? 50).offset(opts.offset ?? 0);
  return query;
}

export async function getDeletedComments(opts: {
  limit?: number;
}): Promise<Comment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(comments).where(eq(comments.deleted, "yes")).orderBy(desc(comments.createdAt)).limit(opts.limit ?? 50);
}

// ─── Moderation Summary ───

export async function getModerationSummary(): Promise<{
  pendingSubmissions: number;
  hiddenReviews: number;
  deletedComments: number;
  totalReviews: number;
  totalComments: number;
}> {
  const db = await getDb();
  if (!db) {
    return { pendingSubmissions: 0, hiddenReviews: 0, deletedComments: 0, totalReviews: 0, totalComments: 0 };
  }
  const [pendingSubs] = await db.select({ count: sql<number>`count(*)` }).from(businessSubmissions).where(eq(businessSubmissions.status, "pending"));
  const [hiddenReviews] = await db.select({ count: sql<number>`count(*)` }).from(reviews).where(eq(reviews.visible, "no"));
  const [deletedComments] = await db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.deleted, "yes"));
  const [totalReviews] = await db.select({ count: sql<number>`count(*)` }).from(reviews);
  const [totalComments] = await db.select({ count: sql<number>`count(*)` }).from(comments);
  return {
    pendingSubmissions: pendingSubs?.count ?? 0,
    hiddenReviews: hiddenReviews?.count ?? 0,
    deletedComments: deletedComments?.count ?? 0,
    totalReviews: totalReviews?.count ?? 0,
    totalComments: totalComments?.count ?? 0,
  };
}
