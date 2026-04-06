import mysql from 'mysql2/promise';
import fs from 'fs';

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, '');
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error('Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

async function mapsRequest(endpoint, params = {}) {
  const url = new URL(`${FORGE_API_URL}/v1/maps/proxy${endpoint}`);
  url.searchParams.append('key', FORGE_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`Maps API error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function searchPlace(name, area) {
  const query = `${name} ${area} Charlotte NC`;
  const result = await mapsRequest('/maps/api/place/textsearch/json', {
    query,
    location: '35.2271,-80.8431',
    radius: 50000,
  });
  if (result.status === 'OK' && result.results?.length > 0) {
    return result.results[0];
  }
  return null;
}

async function getPlaceDetails(placeId) {
  const result = await mapsRequest('/maps/api/place/details/json', {
    place_id: placeId,
    fields: 'name,formatted_address,formatted_phone_number,rating,user_ratings_total,opening_hours,price_level,types',
  });
  if (result.status === 'OK' && result.result) {
    return result.result;
  }
  return null;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const toEnrich = JSON.parse(fs.readFileSync('/tmp/to-enrich.json', 'utf-8'));
  
  // Check which ones we've already processed (in case of restart)
  const [existing] = await conn.query('SELECT serviceKey FROM enriched_services WHERE googleRating IS NOT NULL');
  const alreadyDone = new Set(existing.map(r => r.serviceKey));
  
  const remaining = toEnrich.filter(item => !alreadyDone.has(item.slug));
  console.log(`Total to enrich: ${toEnrich.length}, Already done: ${toEnrich.length - remaining.length}, Remaining: ${remaining.length}`);
  
  let success = 0;
  let failed = 0;
  let notFound = 0;
  
  const BATCH_SIZE = 5;
  const DELAY_MS = 500; // delay between batches
  
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (item) => {
      try {
        // Step 1: Search for the place
        const searchResult = await searchPlace(item.name, item.area);
        if (!searchResult) {
          notFound++;
          // Insert a record with null rating so we don't retry
          await conn.query(
            `INSERT INTO enriched_services (serviceKey, verified, createdAt, updatedAt) 
             VALUES (?, 'verified', NOW(), NOW())
             ON DUPLICATE KEY UPDATE updatedAt = NOW()`,
            [item.slug]
          );
          return;
        }
        
        // Step 2: Get detailed info
        const details = await getPlaceDetails(searchResult.place_id);
        
        const rating = details?.rating ?? searchResult.rating ?? null;
        const reviewCount = details?.user_ratings_total ?? searchResult.user_ratings_total ?? null;
        const address = details?.formatted_address ?? searchResult.formatted_address ?? null;
        const phone = details?.formatted_phone_number ?? null;
        const hours = details?.opening_hours?.weekday_text ? JSON.stringify(details.opening_hours.weekday_text) : null;
        const priceLevel = details?.price_level ?? null;
        const types = details?.types ? JSON.stringify(details.types) : (searchResult.types ? JSON.stringify(searchResult.types) : null);
        
        await conn.query(
          `INSERT INTO enriched_services (serviceKey, googlePlaceId, googleRating, reviewCount, verifiedAddress, verifiedPhone, hoursJson, priceLevel, googleTypes, verified, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', NOW(), NOW())
           ON DUPLICATE KEY UPDATE googlePlaceId=VALUES(googlePlaceId), googleRating=VALUES(googleRating), reviewCount=VALUES(reviewCount), verifiedAddress=VALUES(verifiedAddress), verifiedPhone=VALUES(verifiedPhone), hoursJson=VALUES(hoursJson), priceLevel=VALUES(priceLevel), googleTypes=VALUES(googleTypes), updatedAt=NOW()`,
          [item.slug, searchResult.place_id, rating?.toString() ?? null, reviewCount, address, phone, hours, priceLevel, types]
        );
        
        success++;
      } catch (err) {
        console.error(`  Error enriching ${item.name} (${item.slug}):`, err.message);
        failed++;
      }
    });
    
    await Promise.all(promises);
    
    const processed = Math.min(i + BATCH_SIZE, remaining.length);
    if (processed % 25 === 0 || processed === remaining.length) {
      console.log(`Progress: ${processed}/${remaining.length} | Success: ${success} | Not found: ${notFound} | Failed: ${failed}`);
    }
    
    // Small delay between batches
    if (i + BATCH_SIZE < remaining.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  
  console.log(`\nDone! Success: ${success}, Not found: ${notFound}, Failed: ${failed}`);
  
  // Final count
  const [total] = await conn.query('SELECT COUNT(*) as cnt FROM enriched_services');
  const [withRating] = await conn.query('SELECT COUNT(*) as cnt FROM enriched_services WHERE googleRating IS NOT NULL');
  console.log(`Total enriched records: ${total[0].cnt}, With rating: ${withRating[0].cnt}`);
  
  await conn.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
