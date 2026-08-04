import { eq, and, desc, asc, sql, inArray, gte, lte, isNull, ne, lt } from "drizzle-orm";
import { getDb } from "./db";
import {
  events,
  type Event,
  type InsertEvent,
} from "../drizzle/schema";

// ─── Item 11-12: Event Discovery & Lifecycle ───

export async function getExpiredEvents(opts: {
  gracePeriodDays?: number;
  limit?: number;
}): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  const gracePeriod = opts.gracePeriodDays ?? 3;
  const cutoff = new Date(Date.now() - gracePeriod * 24 * 60 * 60 * 1000);
  // Active, published, one-time events whose start date has passed beyond the grace period
  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.active, true),
        eq(events.status, "published"),
        eq(events.isRecurring, "no"),
        lt(events.startDate, cutoff),
      ),
    )
    .orderBy(asc(events.startDate))
    .limit(opts.limit ?? 100);
}

export async function getUpcomingEventsForCheck(opts: {
  daysAhead?: number;
  limit?: number;
}): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  const daysAhead = opts.daysAhead ?? 7;
  const now = new Date();
  const future = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.active, true),
        eq(events.status, "published"),
        gte(events.startDate, now),
        lte(events.startDate, future),
      ),
    )
    .orderBy(asc(events.startDate))
    .limit(opts.limit ?? 50);
}

export async function getCancelledEvents(opts: {
  limit?: number;
}): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  // Events that are active but have status=archived (could indicate cancellation)
  // or events with past dates that haven't been archived yet
  const now = new Date();
  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.active, true),
        eq(events.status, "archived"),
      ),
    )
    .orderBy(desc(events.updatedAt))
    .limit(opts.limit ?? 50);
}

export async function archiveEvent(eventId: number, reason: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(events)
    .set({ status: "archived", active: false })
    .where(eq(events.id, eventId));
}

export async function updateEventStatus(eventId: number, status: "draft" | "published" | "archived"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const active = status === "published";
  await db
    .update(events)
    .set({ status, active })
    .where(eq(events.id, eventId));
}

// ─── Item 13: Recurring Event Management ───

export async function getRecurringEvents(): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.isRecurring, "yes"),
        eq(events.active, true),
      ),
    )
    .orderBy(asc(events.startDate));
}

export async function getRecurringEventsNeedingRefresh(opts: {
  daysSinceUpdate?: number;
  limit?: number;
}): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  const daysThreshold = opts.daysSinceUpdate ?? 30;
  const thresholdDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.isRecurring, "yes"),
        eq(events.active, true),
        lt(events.updatedAt, thresholdDate),
      ),
    )
    .orderBy(asc(events.updatedAt))
    .limit(opts.limit ?? 50);
}

export async function getRecurringEventsWithStaleDates(): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.isRecurring, "yes"),
        eq(events.active, true),
        // Recurring event with a past end date or past start date without ongoing pattern
        lt(events.startDate, now),
      ),
    )
    .orderBy(asc(events.startDate));
}

// ─── Event Verification ───

export async function getUnverifiedEvents(opts: {
  limit?: number;
}): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.sourceVerified, false),
        eq(events.active, true),
      ),
    )
    .orderBy(desc(events.createdAt))
    .limit(opts.limit ?? 50);
}

export async function getEventsWithBrokenSources(opts: {
  limit?: number;
}): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  // Events with source URLs that need checking — those not updated recently
  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.active, true),
        sql`${events.sourceUrl} IS NOT NULL`,
      ),
    )
    .orderBy(asc(events.updatedAt))
    .limit(opts.limit ?? 100);
}

// ─── Event Summary for Cockpit ───

export async function getEventOpsSummary(): Promise<{
  totalActive: number;
  published: number;
  draft: number;
  archived: number;
  recurring: number;
  expiredNeedingArchive: number;
  upcoming7Days: number;
  unverified: number;
  recurringStale: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalActive: 0, published: 0, draft: 0, archived: 0,
      recurring: 0, expiredNeedingArchive: 0, upcoming7Days: 0,
      unverified: 0, recurringStale: 0,
    };
  }
  const [totalActive] = await db.select({ count: sql<number>`count(*)` }).from(events).where(eq(events.active, true));
  const [published] = await db.select({ count: sql<number>`count(*)` }).from(events).where(and(eq(events.active, true), eq(events.status, "published")));
  const [draft] = await db.select({ count: sql<number>`count(*)` }).from(events).where(and(eq(events.active, true), eq(events.status, "draft")));
  const [archived] = await db.select({ count: sql<number>`count(*)` }).from(events).where(eq(events.status, "archived"));
  const [recurring] = await db.select({ count: sql<number>`count(*)` }).from(events).where(and(eq(events.isRecurring, "yes"), eq(events.active, true)));

  // Expired needing archive
  const graceCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const [expired] = await db.select({ count: sql<number>`count(*)` }).from(events).where(
    and(eq(events.active, true), eq(events.status, "published"), eq(events.isRecurring, "no"), lt(events.startDate, graceCutoff)),
  );

  // Upcoming 7 days
  const now = new Date();
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [upcoming] = await db.select({ count: sql<number>`count(*)` }).from(events).where(
    and(eq(events.active, true), eq(events.status, "published"), gte(events.startDate, now), lte(events.startDate, future)),
  );

  // Unverified
  const [unverified] = await db.select({ count: sql<number>`count(*)` }).from(events).where(
    and(eq(events.active, true), eq(events.sourceVerified, false)),
  );

  // Recurring stale (not updated in 30+ days)
  const staleCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [recurringStale] = await db.select({ count: sql<number>`count(*)` }).from(events).where(
    and(eq(events.isRecurring, "yes"), eq(events.active, true), lt(events.updatedAt, staleCutoff)),
  );

  return {
    totalActive: totalActive?.count ?? 0,
    published: published?.count ?? 0,
    draft: draft?.count ?? 0,
    archived: archived?.count ?? 0,
    recurring: recurring?.count ?? 0,
    expiredNeedingArchive: expired?.count ?? 0,
    upcoming7Days: upcoming?.count ?? 0,
    unverified: unverified?.count ?? 0,
    recurringStale: recurringStale?.count ?? 0,
  };
}
