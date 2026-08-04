import { eq, and, desc, asc, sql, gte, lte, isNull, lt } from "drizzle-orm";
import { getDb } from "./db";
import { blogPosts, type BlogPost } from "../drizzle/schema";

// ─── Item 14: Blog Editorial Calendar ───

export async function getBlogOpsSummary(): Promise<{
  total: number;
  published: number;
  drafts: number;
  stale: number;
  avgAgeDays: number;
}> {
  const db = await getDb();
  if (!db) return { total: 0, published: 0, drafts: 0, stale: 0, avgAgeDays: 0 };
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts);
  const [published] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(eq(blogPosts.status, "published"));
  const [drafts] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(eq(blogPosts.status, "draft"));

  // Stale = published posts not updated in 90+ days
  const staleCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const [stale] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(
    and(eq(blogPosts.status, "published"), lt(blogPosts.updatedAt, staleCutoff)),
  );

  // Average age of published posts
  const publishedPosts = await db.select({ createdAt: blogPosts.createdAt }).from(blogPosts).where(eq(blogPosts.status, "published"));
  let avgAgeDays = 0;
  if (publishedPosts.length > 0) {
    const totalDays = publishedPosts.reduce((sum, p) => {
      return sum + Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (24 * 60 * 60 * 1000));
    }, 0);
    avgAgeDays = Math.round(totalDays / publishedPosts.length);
  }

  return {
    total: total?.count ?? 0,
    published: published?.count ?? 0,
    drafts: drafts?.count ?? 0,
    stale: stale?.count ?? 0,
    avgAgeDays,
  };
}

// ─── Item 15-16: Blog Draft Management ───

export async function getStalePosts(opts: {
  daysSinceUpdate?: number;
  limit?: number;
}): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];
  const days = opts.daysSinceUpdate ?? 90;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db.select().from(blogPosts).where(
    and(eq(blogPosts.status, "published"), lt(blogPosts.updatedAt, cutoff)),
  ).orderBy(asc(blogPosts.updatedAt)).limit(opts.limit ?? 50);
}

export async function getDraftPosts(opts: {
  limit?: number;
}): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts).where(eq(blogPosts.status, "draft")).orderBy(desc(blogPosts.createdAt)).limit(opts.limit ?? 50);
}

export async function getPostsByCategory(opts: {
  category?: string;
  limit?: number;
}): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.category) conditions.push(eq(blogPosts.category, opts.category));
  const query = db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
  if (conditions.length > 0) query.where(and(...conditions));
  return query.limit(opts.limit ?? 50);
}
