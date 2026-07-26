/**
 * Remove "Test Post" from the blog_posts database table.
 * Run with: node --experimental-strip-types scripts/remove-test-post.mjs
 */
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set. Usage: DATABASE_URL=... node scripts/remove-test-post.mjs');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

// Find and delete any blog posts with "test" in the title or slug
const [rows] = await conn.execute(
  "SELECT id, title, slug, status FROM blog_posts WHERE title LIKE '%test%' OR slug LIKE '%test%' OR title = 'Test Post' OR slug = 'test-post'"
);

if (rows.length === 0) {
  console.log('No test posts found in the database.');
  await conn.end();
  process.exit(0);
}

console.log(`Found ${rows.length} test post(s):`);
for (const row of rows) {
  console.log(`  [${row.id}] "${row.title}" (slug: ${row.slug}, status: ${row.status})`);
}

// Delete them
const [result] = await conn.execute(
  "DELETE FROM blog_posts WHERE title LIKE '%test%' OR slug LIKE '%test%' OR title = 'Test Post' OR slug = 'test-post'"
);
console.log(`Deleted ${result.affectedRows} test post(s).`);

await conn.end();
