/**
 * Batch Google Places Enrichment Script
 * 
 * Searches Google Places API for each business, gets details, and inserts into the DB.
 * Uses the same Manus forge proxy as the admin enrichment tool.
 * 
 * Usage: DATABASE_URL=... BUILT_IN_FORGE_API_URL=... BUILT_IN_FORGE_API_KEY=... node scripts/batch-enrich.mjs
 */

const FORGE_API_URL = (process.env.BUILT_IN_FORGE_API_URL || '').replace(/\/+$/, '');
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY || '';
const DATABASE_URL = process.env.DATABASE_URL || '';

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error('Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

// --- Google Places API helpers ---

async function searchPlaces(query) {
  const url = new URL(`${FORGE_API_URL}/v1/maps/proxy/maps/api/place/textsearch/json`);
  url.searchParams.append('key', FORGE_API_KEY);
  url.searchParams.append('query', `${query} Charlotte NC`);
  url.searchParams.append('location', '35.2271,-80.8431');
  url.searchParams.append('radius', '50000');

  const res = await fetch(url.toString(), { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`Search failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getPlaceDetails(placeId) {
  const url = new URL(`${FORGE_API_URL}/v1/maps/proxy/maps/api/place/details/json`);
  url.searchParams.append('key', FORGE_API_KEY);
  url.searchParams.append('place_id', placeId);
  url.searchParams.append('fields', 'name,formatted_address,formatted_phone_number,rating,user_ratings_total,opening_hours,price_level,types');

  const res = await fetch(url.toString(), { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`Details failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// --- MySQL helper ---

import mysql from 'mysql2/promise';

let dbConn = null;

async function getDb() {
  if (!dbConn) {
    dbConn = await mysql.createConnection({
      uri: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return dbConn;
}

async function upsertEnrichment(data) {
  const db = await getDb();
  const [existing] = await db.execute(
    'SELECT id FROM enriched_services WHERE serviceKey = ?',
    [data.serviceKey]
  );

  if (existing.length > 0) {
    await db.execute(
      `UPDATE enriched_services SET 
        googlePlaceId = ?, googleRating = ?, reviewCount = ?, 
        verifiedAddress = ?, verifiedPhone = ?, hoursJson = ?, 
        googleTypes = ?, priceLevel = ?, verified = 'verified'
      WHERE serviceKey = ?`,
      [
        data.googlePlaceId, data.googleRating, data.reviewCount,
        data.verifiedAddress, data.verifiedPhone, data.hoursJson,
        data.googleTypes, data.priceLevel, data.serviceKey
      ]
    );
    return { updated: true };
  }

  await db.execute(
    `INSERT INTO enriched_services 
      (serviceKey, googlePlaceId, googleRating, reviewCount, verifiedAddress, verifiedPhone, hoursJson, googleTypes, priceLevel, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified')`,
    [
      data.serviceKey, data.googlePlaceId, data.googleRating, data.reviewCount,
      data.verifiedAddress, data.verifiedPhone, data.hoursJson,
      data.googleTypes, data.priceLevel
    ]
  );
  return { inserted: true };
}

// --- Batch processing ---

const BUSINESSES = JSON.parse(
  (await import('fs')).readFileSync('/tmp/enrichment_batch.json', 'utf-8')
);

const BATCH_SIZE = 5; // Process 5 at a time to avoid rate limits
const DELAY_MS = 1000; // 1 second between batches

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let successCount = 0;
let failCount = 0;
let skipCount = 0;

console.log(`Starting batch enrichment of ${BUSINESSES.length} businesses...`);
console.log('');

for (let i = 0; i < BUSINESSES.length; i += BATCH_SIZE) {
  const batch = BUSINESSES.slice(i, i + BATCH_SIZE);
  
  const promises = batch.map(async (biz) => {
    try {
      // Step 1: Search for the business
      const searchResult = await searchPlaces(biz.name);
      
      if (!searchResult.results || searchResult.results.length === 0) {
        console.log(`  ⚠️  No results for: ${biz.name}`);
        skipCount++;
        return;
      }

      // Pick the best match (first result)
      const place = searchResult.results[0];
      
      // Step 2: Get detailed info
      const detailResult = await getPlaceDetails(place.place_id);
      const detail = detailResult.result;

      if (!detail) {
        console.log(`  ⚠️  No details for: ${biz.name}`);
        skipCount++;
        return;
      }

      // Step 3: Save to DB
      const enrichData = {
        serviceKey: biz.key,
        googlePlaceId: place.place_id,
        googleRating: detail.rating ? String(detail.rating) : null,
        reviewCount: detail.user_ratings_total ?? null,
        verifiedAddress: detail.formatted_address ?? null,
        verifiedPhone: detail.formatted_phone_number ?? null,
        hoursJson: detail.opening_hours?.weekday_text ? JSON.stringify(detail.opening_hours.weekday_text) : null,
        googleTypes: detail.types ? JSON.stringify(detail.types) : null,
        priceLevel: detail.price_level ?? null,
      };

      await upsertEnrichment(enrichData);
      
      const rating = enrichData.googleRating || 'N/A';
      const reviews = enrichData.reviewCount || 0;
      console.log(`  ✅ ${biz.name} → ⭐${rating} (${reviews} reviews)`);
      successCount++;
    } catch (err) {
      console.log(`  ❌ ${biz.name}: ${err.message}`);
      failCount++;
    }
  });

  await Promise.all(promises);
  
  // Progress update
  const processed = Math.min(i + BATCH_SIZE, BUSINESSES.length);
  console.log(`\n  [${processed}/${BUSINESSES.length}] processed | ✅ ${successCount} | ⚠️ ${skipCount} | ❌ ${failCount}\n`);
  
  // Rate limit delay between batches
  if (i + BATCH_SIZE < BUSINESSES.length) {
    await sleep(DELAY_MS);
  }
}

console.log('');
console.log('=== ENRICHMENT COMPLETE ===');
console.log(`  Total: ${BUSINESSES.length}`);
console.log(`  ✅ Success: ${successCount}`);
console.log(`  ⚠️  Skipped: ${skipCount}`);
console.log(`  ❌ Failed: ${failCount}`);

// Close DB connection
if (dbConn) await dbConn.end();
process.exit(0);
