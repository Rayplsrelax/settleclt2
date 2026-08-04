import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  sourceRegistry,
  type SourceRegistryEntry,
  type InsertSourceRegistryEntry,
} from "../drizzle/schema";

// ─── Source Management ───

export async function addSource(source: InsertSourceRegistryEntry): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(sourceRegistry).values(source);
  return result.insertId;
}

export async function getSources(opts: {
  sourceType?: string;
  active?: boolean;
  priority?: string;
  trustLevel?: string;
  limit?: number;
  offset?: number;
}): Promise<SourceRegistryEntry[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.sourceType) conditions.push(eq(sourceRegistry.sourceType, opts.sourceType as any));
  if (opts.active !== undefined) conditions.push(eq(sourceRegistry.active, opts.active));
  if (opts.priority) conditions.push(eq(sourceRegistry.priority, opts.priority as any));
  if (opts.trustLevel) conditions.push(eq(sourceRegistry.trustLevel, opts.trustLevel as any));
  const query = db.select().from(sourceRegistry);
  if (conditions.length > 0) query.where(and(...conditions));
  query.orderBy(desc(sourceRegistry.priority), desc(sourceRegistry.createdAt));
  query.limit(opts.limit ?? 100).offset(opts.offset ?? 0);
  return query;
}

export async function getSourceById(id: number): Promise<SourceRegistryEntry | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [source] = await db.select().from(sourceRegistry).where(eq(sourceRegistry.id, id));
  return source;
}

export async function updateSourceCheckResult(
  id: number,
  result: "ok" | "changed" | "broken" | "blocked" | "inconclusive",
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(sourceRegistry).set({
    lastCheckedAt: new Date(),
    lastCheckResult: result,
  }).where(eq(sourceRegistry.id, id));
}

export async function deactivateSource(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(sourceRegistry).set({ active: false }).where(eq(sourceRegistry.id, id));
}

export async function getSourcesNeedingCheck(opts: {
  sourceType?: string;
  limit?: number;
}): Promise<SourceRegistryEntry[]> {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const conditions = [eq(sourceRegistry.active, true)];

  // Filter by source type if specified
  if (opts.sourceType) {
    conditions.push(eq(sourceRegistry.sourceType, opts.sourceType as any));
  }

  // Get all active sources, then filter by check frequency in JS
  // (SQL comparison of timestamps with frequency strings is complex)
  const sources = await db.select().from(sourceRegistry).where(and(...conditions)).orderBy(asc(sourceRegistry.lastCheckedAt));

  const needsCheck = (source: SourceRegistryEntry): boolean => {
    if (!source.lastCheckedAt) return true; // Never checked
    const lastChecked = new Date(source.lastCheckedAt);
    const daysSinceCheck = Math.floor((now.getTime() - lastChecked.getTime()) / (24 * 60 * 60 * 1000));
    switch (source.checkFrequency) {
      case "daily": return daysSinceCheck >= 1;
      case "weekly": return daysSinceCheck >= 7;
      case "biweekly": return daysSinceCheck >= 14;
      case "monthly": return daysSinceCheck >= 30;
      case "quarterly": return daysSinceCheck >= 90;
      default: return daysSinceCheck >= 7;
    }
  };

  return sources.filter(needsCheck).slice(0, opts.limit ?? 100);
}

export async function getSourceStats(): Promise<{
  total: number;
  active: number;
  byType: Record<string, number>;
  byTrust: Record<string, number>;
  needingCheck: number;
}> {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, byType: {}, byTrust: {}, needingCheck: 0 };
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(sourceRegistry);
  const [active] = await db.select({ count: sql<number>`count(*)` }).from(sourceRegistry).where(eq(sourceRegistry.active, true));

  const typeCounts = await db.select({ type: sourceRegistry.sourceType, count: sql<number>`count(*)` }).from(sourceRegistry).groupBy(sourceRegistry.sourceType);
  const byType: Record<string, number> = {};
  for (const row of typeCounts as { type: string; count: number }[]) {
    byType[row.type] = row.count;
  }

  const trustCounts = await db.select({ trust: sourceRegistry.trustLevel, count: sql<number>`count(*)` }).from(sourceRegistry).groupBy(sourceRegistry.trustLevel);
  const byTrust: Record<string, number> = {};
  for (const row of trustCounts as { trust: string; count: number }[]) {
    byTrust[row.trust] = row.count;
  }

  const needingCheck = (await getSourcesNeedingCheck({})).length;

  return {
    total: total?.count ?? 0,
    active: active?.count ?? 0,
    byType,
    byTrust,
    needingCheck,
  };
}
