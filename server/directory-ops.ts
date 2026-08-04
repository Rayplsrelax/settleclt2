import { eq, and, desc, asc, sql, inArray, gte, lte, isNull, ne, count } from "drizzle-orm";
import { getDb } from "./db";
import {
  directoryListings,
  listingVerifications,
  businessClaims,
  businessMemberships,
  businessListingOverrides,
  type InsertListingVerification,
  type ListingVerification,
  type DirectoryListing,
} from "../drizzle/schema";

// ─── Item 4: Directory Gap Analysis ───

export async function getDirectoryGapAnalysis(): Promise<{
  categories: { category: string; count: number }[];
  thinCategories: { category: string; count: number }[];
  totalActive: number;
  totalCategories: number;
}> {
  const db = await getDb();
  if (!db) return { categories: [], thinCategories: [], totalActive: 0, totalCategories: 0 };
  const rows = await db
    .select({
      category: directoryListings.category,
      count: sql<number>`count(*)`,
    })
    .from(directoryListings)
    .where(eq(directoryListings.active, true))
    .groupBy(directoryListings.category)
    .orderBy(asc(sql`count(*)`));
  const categories = rows as { category: string; count: number }[];
  const thinCategories = categories.filter((r) => r.count < 5);
  const totalActive = categories.reduce((sum, r) => sum + r.count, 0);
  return {
    categories,
    thinCategories,
    totalActive,
    totalCategories: categories.length,
  };
}

// ─── Item 5-6: Business Discovery/Verification ───

export async function recordListingVerification(
  verification: InsertListingVerification,
): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(listingVerifications).values(verification);
  return result.insertId;
}

export async function getListingVerifications(opts: {
  serviceKey?: string;
  result?: string;
  limit?: number;
  offset?: number;
}): Promise<ListingVerification[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.serviceKey) conditions.push(eq(listingVerifications.serviceKey, opts.serviceKey));
  if (opts.result) conditions.push(eq(listingVerifications.result, opts.result as any));
  const query = db.select().from(listingVerifications);
  if (conditions.length > 0) query.where(and(...conditions));
  query.orderBy(desc(listingVerifications.createdAt));
  query.limit(opts.limit ?? 50).offset(opts.offset ?? 0);
  return query;
}

export async function getLastVerification(
  serviceKey: string,
): Promise<ListingVerification | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db
    .select()
    .from(listingVerifications)
    .where(eq(listingVerifications.serviceKey, serviceKey))
    .orderBy(desc(listingVerifications.createdAt))
    .limit(1);
  return row;
}

// ─── Item 7: Freshness Monitor ───

export async function getStaleListings(opts: {
  daysSinceUpdate?: number;
  limit?: number;
}): Promise<(DirectoryListing & { lastVerifiedAt: Date | null; daysSinceVerification: number | null })[]> {
  const db = await getDb();
  if (!db) return [];
  const daysThreshold = opts.daysSinceUpdate ?? 90;
  const thresholdDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);

  // Get active listings whose last verification is older than threshold or never verified
  const listings = await db
    .select({
      listing: directoryListings,
      lastVerification: listingVerifications,
    })
    .from(directoryListings)
    .leftJoin(
      listingVerifications,
      eq(directoryListings.serviceKey, listingVerifications.serviceKey),
    )
    .where(eq(directoryListings.active, true));

  // Deduplicate: keep only the latest verification per listing
  const byServiceKey = new Map<string, (typeof listings)[number]>();
  for (const row of listings) {
    const existing = byServiceKey.get(row.listing.serviceKey);
    if (!existing || (row.lastVerification && existing.lastVerification && row.lastVerification.createdAt > existing.lastVerification.createdAt)) {
      byServiceKey.set(row.listing.serviceKey, row);
    }
  }

  const stale: (DirectoryListing & { lastVerifiedAt: Date | null; daysSinceVerification: number | null })[] = [];
  for (const row of Array.from(byServiceKey.values())) {
    const lastVerifiedAt = row.lastVerification?.createdAt ?? null;
    const daysSinceVerification = lastVerifiedAt
      ? Math.floor((Date.now() - new Date(lastVerifiedAt).getTime()) / (24 * 60 * 60 * 1000))
      : null;
    const needsCheck = !lastVerifiedAt || new Date(lastVerifiedAt) < thresholdDate;
    if (needsCheck) {
      stale.push({ ...row.listing, lastVerifiedAt, daysSinceVerification });
    }
  }
  return stale.slice(0, opts.limit ?? 100);
}

// ─── Item 8: Closure/Archive/Removal ───

export async function getClosureCandidates(opts: {
  limit?: number;
}): Promise<(DirectoryListing & { closureSignals: string[]; lastVerification: ListingVerification | null })[]> {
  const db = await getDb();
  if (!db) return [];
  // Find listings with recent verification results indicating closure
  const recentClosureChecks = await db
    .select()
    .from(listingVerifications)
    .where(
      and(
        inArray(listingVerifications.result, [
          "broken_link",
          "parked_domain",
          "closed",
          "moved",
          "rebranded",
        ]),
      ),
    )
    .orderBy(desc(listingVerifications.createdAt))
    .limit(opts.limit ?? 50);

  // Deduplicate by serviceKey — keep most recent per listing
  const byServiceKey = new Map<string, ListingVerification>();
  for (const v of recentClosureChecks) {
    if (!byServiceKey.has(v.serviceKey)) {
      byServiceKey.set(v.serviceKey, v);
    }
  }

  // Fetch the actual listing data
  const results: (DirectoryListing & { closureSignals: string[]; lastVerification: ListingVerification | null })[] = [];
  for (const [serviceKey, verification] of Array.from(byServiceKey.entries())) {
    const [listing] = await db
      .select()
      .from(directoryListings)
      .where(eq(directoryListings.serviceKey, serviceKey));
    if (listing && listing.active) {
      results.push({
        ...listing,
        closureSignals: [verification.result],
        lastVerification: verification,
      });
    }
  }
  return results;
}

export async function archiveListing(serviceKey: string, reason: string, approverUserId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(directoryListings)
    .set({ active: false })
    .where(eq(directoryListings.serviceKey, serviceKey));
  await recordListingVerification({
    serviceKey,
    checkType: "closure",
    result: "closed",
    evidenceLevel: "removed_confirmed",
    notes: `Archived by user ${approverUserId}: ${reason}`,
    checkedBy: "manager",
  });
}

// ─── Item 19: Broken Link Integrity ───

export async function getBrokenLinkCandidates(opts: {
  limit?: number;
}): Promise<ListingVerification[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(listingVerifications)
    .where(
      inArray(listingVerifications.result, [
        "broken_link",
        "parked_domain",
        "redirect_changed",
      ]),
    )
    .orderBy(desc(listingVerifications.createdAt))
    .limit(opts.limit ?? 100);
}

// ─── Item 10: Profile Completeness ───

export async function getProfileCompleteness(serviceKey: string): Promise<{
  completeness: number;
  missingFields: string[];
  hasClaim: boolean;
  hasOverrides: boolean;
  hasPremium: boolean;
}> {
  const db = await getDb();
  if (!db) return { completeness: 0, missingFields: [], hasClaim: false, hasOverrides: false, hasPremium: false };
  const [listing] = await db
    .select()
    .from(directoryListings)
    .where(eq(directoryListings.serviceKey, serviceKey));
  if (!listing) return { completeness: 0, missingFields: ["listing_not_found"], hasClaim: false, hasOverrides: false, hasPremium: false };

  const requiredFields: { key: keyof typeof listing; label: string }[] = [
    { key: "name", label: "Business Name" },
    { key: "description", label: "Description" },
    { key: "category", label: "Category" },
    { key: "area", label: "Service Area" },
    { key: "phone", label: "Phone" },
    { key: "website", label: "Website" },
  ];
  const missingFields: string[] = [];
  for (const field of requiredFields) {
    if (!listing[field.key] || (typeof listing[field.key] === "string" && (listing[field.key] as string).trim() === "")) {
      missingFields.push(field.label);
    }
  }
  const completeness = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100);

  // Check for claim
  const [claim] = await db
    .select()
    .from(businessClaims)
    .where(and(eq(businessClaims.serviceKey, serviceKey), eq(businessClaims.status, "approved")));
  const hasClaim = !!claim;

  // Check for overrides
  const [override] = await db
    .select()
    .from(businessListingOverrides)
    .where(eq(businessListingOverrides.serviceKey, serviceKey));
  const hasOverrides = !!override;

  return { completeness, missingFields, hasClaim, hasOverrides, hasPremium: false };
}
