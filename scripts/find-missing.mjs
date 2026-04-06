import mysql from 'mysql2/promise';
import fs from 'fs';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.query('SELECT serviceKey FROM enriched_services');
  const enrichedKeys = new Set(rows.map(r => r.serviceKey));
  
  const allSlugs = fs.readFileSync('/tmp/all-slugs.txt', 'utf-8').trim().split('\n');
  const uniqueSlugs = [...new Set(allSlugs)];
  
  const missing = uniqueSlugs.filter(s => {
    return !enrichedKeys.has(s);
  });
  console.log('Total unique slugs:', uniqueSlugs.length);
  console.log('Already enriched:', enrichedKeys.size);
  console.log('Missing from DB:', missing.length);
  
  // Also check how many enriched have null ratings
  const [nullRating] = await conn.query('SELECT serviceKey FROM enriched_services WHERE googleRating IS NULL');
  console.log('In DB but no rating:', nullRating.length);
  
  // Write missing slugs to file
  fs.writeFileSync('/tmp/missing-slugs.txt', missing.join('\n'));
  fs.writeFileSync('/tmp/null-rating-slugs.txt', nullRating.map(r => r.serviceKey).join('\n'));
  
  console.log('\nFirst 10 missing:', missing.slice(0, 10));
  
  await conn.end();
}
main().catch(console.error);
