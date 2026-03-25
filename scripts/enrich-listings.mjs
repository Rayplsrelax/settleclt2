/**
 * Script to enrich directory listings via Google Places API
 * Runs server-side using the same makeRequest helper as the admin tool
 */

import { SERVICES } from '../shared/services.ts';

// Get the forge API config from environment
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, '');
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error('Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

// Database connection
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { enrichedServices } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const pool = mysql.createPool(DATABASE_URL);
const db = drizzle(pool);

// Helper to slugify service name for serviceKey
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Google Places API helpers
async function searchPlaces(query) {
  const url = new URL(`${FORGE_API_URL}/v1/maps/proxy/maps/api/place/textsearch/json`);
  url.searchParams.append('key', FORGE_API_KEY);
  url.searchParams.append('query', `${query} Charlotte NC`);
  url.searchParams.append('location', '35.2271,-80.8431');
  url.searchParams.append('radius', '50000');
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

async function getPlaceDetails(placeId) {
  const url = new URL(`${FORGE_API_URL}/v1/maps/proxy/maps/api/place/details/json`);
  url.searchParams.append('key', FORGE_API_KEY);
  url.searchParams.append('place_id', placeId);
  url.searchParams.append('fields', 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,price_level,types');
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Details failed: ${res.status}`);
  return res.json();
}

// Select 30 businesses to enrich - prioritize those with websites/phones (real businesses)
const allServices = SERVICES.filter(s => s.website || s.phone);

// Pick a diverse set across categories
const categories = [...new Set(allServices.map(s => s.category))];
const selected = [];
const perCategory = Math.ceil(30 / categories.length);

for (const cat of categories) {
  const catServices = allServices.filter(s => s.category === cat);
  selected.push(...catServices.slice(0, perCategory));
  if (selected.length >= 30) break;
}

const toEnrich = selected.slice(0, 30);

console.log(`\n🔍 Enriching ${toEnrich.length} directory listings via Google Places...\n`);

let enriched = 0;
let failed = 0;
let skipped = 0;

for (const service of toEnrich) {
  const serviceKey = slugify(service.name);
  
  // Check if already enriched
  const existing = await db.select().from(enrichedServices).where(eq(enrichedServices.serviceKey, serviceKey));
  if (existing.length > 0) {
    console.log(`⏭️  ${service.name} — already enriched`);
    skipped++;
    continue;
  }
  
  try {
    // Step 1: Search for the business
    const searchResult = await searchPlaces(service.name);
    
    if (!searchResult.results || searchResult.results.length === 0) {
      console.log(`❌ ${service.name} — no Google Places results`);
      failed++;
      continue;
    }
    
    // Take the first result
    const place = searchResult.results[0];
    
    // Step 2: Get detailed info
    const details = await getPlaceDetails(place.place_id);
    const d = details.result;
    
    if (!d) {
      console.log(`❌ ${service.name} — no details returned`);
      failed++;
      continue;
    }
    
    // Step 3: Save to database
    await db.insert(enrichedServices).values({
      serviceKey,
      googlePlaceId: place.place_id,
      googleRating: d.rating ? String(d.rating) : null,
      reviewCount: d.user_ratings_total ?? null,
      verifiedAddress: d.formatted_address ?? null,
      verifiedPhone: d.formatted_phone_number ?? null,
      hoursJson: d.opening_hours?.weekday_text ? JSON.stringify(d.opening_hours.weekday_text) : null,
      photosJson: null,
      googleTypes: d.types ? JSON.stringify(d.types) : null,
      priceLevel: d.price_level ?? null,
      verified: 'verified',
      enrichedBy: 1, // admin user
    });
    
    const ratingStr = d.rating ? `⭐ ${d.rating}` : 'no rating';
    const reviewStr = d.user_ratings_total ? `(${d.user_ratings_total} reviews)` : '';
    console.log(`✅ ${service.name} — ${ratingStr} ${reviewStr}`);
    enriched++;
    
    // Rate limit: 200ms between requests
    await new Promise(r => setTimeout(r, 200));
    
  } catch (err) {
    console.log(`❌ ${service.name} — error: ${err.message}`);
    failed++;
  }
}

console.log(`\n📊 Enrichment complete:`);
console.log(`   ✅ Enriched: ${enriched}`);
console.log(`   ⏭️  Skipped: ${skipped}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   Total: ${toEnrich.length}\n`);

await pool.end();
process.exit(0);
