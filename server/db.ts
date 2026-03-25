import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, movingQuotes, businessSubmissions, newsletterSubscribers, enrichedServices, type InsertMovingQuote, type InsertBusinessSubmission, type InsertNewsletterSubscriber, type InsertEnrichedService } from "../drizzle/schema";
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
