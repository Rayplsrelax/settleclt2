/**
 * Batch enrichment script for new directory entries.
 * Uses the same Google Places API proxy as the app.
 * Run: cd /home/ubuntu/settle-clt && node enrich-new-services.mjs
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';

// Read env from .env file or environment
const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DATABASE_URL || !FORGE_API_URL || !FORGE_API_KEY) {
  console.error('Missing env vars. Make sure DATABASE_URL, BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY are set.');
  process.exit(1);
}

// Parse services.ts to get service names and keys
function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const servicesContent = fs.readFileSync('shared/services.ts', 'utf8');
const allServices = [];
const nameRe = /\{ name: '([^']+)',\s*category: '([^']+)',/g;
let m;
while ((m = nameRe.exec(servicesContent))) {
  allServices.push({ name: m[1], category: m[2], key: toSlug(m[1]) });
}

async function makeGoogleRequest(endpoint, params) {
  const baseUrl = FORGE_API_URL.replace(/\/+$/, '');
  const url = new URL(`${baseUrl}/v1/maps/proxy${endpoint}`);
  url.searchParams.append('key', FORGE_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
  }
  const resp = await fetch(url.toString(), { headers: { 'Content-Type': 'application/json' } });
  if (!resp.ok) throw new Error(`API error: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

async function searchPlace(name) {
  const result = await makeGoogleRequest('/maps/api/place/textsearch/json', {
    query: `${name} Charlotte NC`,
    location: '35.2271,-80.8431',
    radius: 50000,
  });
  if (result.status === 'OK' && result.results.length > 0) {
    return result.results[0];
  }
  return null;
}

async function getPlaceDetails(placeId) {
  const result = await makeGoogleRequest('/maps/api/place/details/json', {
    place_id: placeId,
    fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,price_level,types',
  });
  if (result.status === 'OK') {
    return result.result;
  }
  return null;
}

async function main() {
  // Connect to DB
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // Get already enriched keys
  const [rows] = await conn.execute('SELECT serviceKey FROM enriched_services');
  const enrichedKeys = new Set(rows.map(r => r.serviceKey));
  
  // Find unenriched services
  const unenriched = allServices.filter(s => !enrichedKeys.has(s.key));
  console.log(`Found ${unenriched.length} unenriched services out of ${allServices.length} total`);
  
  let enriched = 0;
  let failed = 0;
  
  for (const svc of unenriched) {
    try {
      console.log(`[${enriched + failed + 1}/${unenriched.length}] Enriching: ${svc.name}`);
      
      // Search for the place
      const searchResult = await searchPlace(svc.name);
      if (!searchResult) {
        console.log(`  ⚠ No Google Places result for "${svc.name}"`);
        // Insert a minimal record so we don't retry
        await conn.execute(
          `INSERT INTO enriched_services (serviceKey, verified) VALUES (?, 'pending') ON DUPLICATE KEY UPDATE serviceKey=serviceKey`,
          [svc.key]
        );
        failed++;
        continue;
      }
      
      // Get details
      const details = await getPlaceDetails(searchResult.place_id);
      
      const data = {
        serviceKey: svc.key,
        googlePlaceId: searchResult.place_id,
        googleRating: details?.rating ? String(details.rating) : (searchResult.rating ? String(searchResult.rating) : null),
        reviewCount: details?.user_ratings_total ?? searchResult.user_ratings_total ?? null,
        verifiedAddress: details?.formatted_address ?? searchResult.formatted_address ?? null,
        verifiedPhone: details?.formatted_phone_number ?? null,
        hoursJson: details?.opening_hours?.weekday_text ? JSON.stringify(details.opening_hours.weekday_text) : null,
        priceLevel: details?.price_level ?? null,
        googleTypes: details?.types ? JSON.stringify(details.types) : null,
        verified: 'verified',
      };
      
      await conn.execute(
        `INSERT INTO enriched_services (serviceKey, googlePlaceId, googleRating, reviewCount, verifiedAddress, verifiedPhone, hoursJson, priceLevel, googleTypes, verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           googlePlaceId = VALUES(googlePlaceId),
           googleRating = VALUES(googleRating),
           reviewCount = VALUES(reviewCount),
           verifiedAddress = VALUES(verifiedAddress),
           verifiedPhone = VALUES(verifiedPhone),
           hoursJson = VALUES(hoursJson),
           priceLevel = VALUES(priceLevel),
           googleTypes = VALUES(googleTypes),
           verified = VALUES(verified)`,
        [data.serviceKey, data.googlePlaceId, data.googleRating, data.reviewCount, data.verifiedAddress, data.verifiedPhone, data.hoursJson, data.priceLevel, data.googleTypes, data.verified]
      );
      
      console.log(`  ✓ ${svc.name} — rating: ${data.googleRating}, reviews: ${data.reviewCount}`);
      enriched++;
      
      // Rate limit: 200ms between requests
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`  ✗ Error enriching ${svc.name}:`, err.message);
      failed++;
    }
  }
  
  console.log(`\nDone! Enriched: ${enriched}, Failed: ${failed}, Total: ${unenriched.length}`);
  
  // Final count
  const [finalRows] = await conn.execute('SELECT COUNT(*) as total FROM enriched_services');
  console.log(`Total enriched services in DB: ${finalRows[0].total}`);
  
  await conn.end();
}

main().catch(console.error);
