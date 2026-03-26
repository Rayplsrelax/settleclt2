import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

// Step 1: Create tags
const tags = [
  // Neighborhood tags
  { name: 'Uptown', slug: 'uptown', category: 'neighborhood' },
  { name: 'South End', slug: 'south-end', category: 'neighborhood' },
  { name: 'NoDa', slug: 'noda', category: 'neighborhood' },
  { name: 'Plaza Midwood', slug: 'plaza-midwood', category: 'neighborhood' },
  { name: 'Dilworth', slug: 'dilworth', category: 'neighborhood' },
  { name: 'Myers Park', slug: 'myers-park', category: 'neighborhood' },
  { name: 'Elizabeth', slug: 'elizabeth', category: 'neighborhood' },
  { name: 'Ballantyne', slug: 'ballantyne', category: 'neighborhood' },
  
  // Activity tags
  { name: 'Food & Drink', slug: 'food-drink', category: 'activity' },
  { name: 'Breweries', slug: 'breweries', category: 'activity' },
  { name: 'Live Music', slug: 'live-music', category: 'activity' },
  { name: 'Outdoor Activities', slug: 'outdoor-activities', category: 'activity' },
  { name: 'Arts & Culture', slug: 'arts-culture', category: 'activity' },
  { name: 'Sports', slug: 'sports', category: 'activity' },
  { name: 'Fitness & Wellness', slug: 'fitness-wellness', category: 'activity' },
  { name: 'Nightlife', slug: 'nightlife', category: 'activity' },
  
  // Audience tags
  { name: 'Family Friendly', slug: 'family-friendly', category: 'audience' },
  { name: 'Date Night', slug: 'date-night', category: 'audience' },
  { name: 'New to Charlotte', slug: 'new-to-charlotte', category: 'audience' },
  { name: 'Pet Friendly', slug: 'pet-friendly', category: 'audience' },
  
  // Season tags
  { name: 'Seasonal', slug: 'seasonal', category: 'season' },
  
  // Content-type tags
  { name: 'Free Events', slug: 'free-events', category: 'content-type' },
  { name: 'Festivals', slug: 'festivals', category: 'content-type' },
  { name: 'Markets', slug: 'markets', category: 'content-type' },
];

console.log('Creating tags...');
const tagIdMap = {};
for (const tag of tags) {
  try {
    const [result] = await conn.execute(
      `INSERT INTO tags (name, slug, category) VALUES (?, ?, ?)`,
      [tag.name, tag.slug, tag.category]
    );
    tagIdMap[tag.slug] = result.insertId;
    console.log(`  ✅ Tag: ${tag.name} (id: ${result.insertId})`);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const [rows] = await conn.execute(`SELECT id FROM tags WHERE slug = ?`, [tag.slug]);
      tagIdMap[tag.slug] = rows[0].id;
      console.log(`  ⏭️  Tag exists: ${tag.name} (id: ${rows[0].id})`);
    } else {
      console.error(`  ❌ Error: ${tag.name}:`, err.message);
    }
  }
}

// Step 2: Tag events
console.log('\nTagging events...');
const [events] = await conn.execute(`SELECT id, title, slug, category, venueName, neighborhood FROM events`);

const eventTagMappings = {
  // Category-based auto-tagging
  'music': ['live-music'],
  'food': ['food-drink'],
  'festival': ['festivals'],
  'sports': ['sports'],
  'arts': ['arts-culture'],
  'community': ['free-events'],
  'market': ['markets'],
  'outdoor': ['outdoor-activities'],
  'family': ['family-friendly'],
};

// Specific event tags
const specificEventTags = {
  'charlotte-shout-festival': ['uptown', 'arts-culture', 'festivals', 'free-events'],
  'taste-of-charlotte': ['uptown', 'food-drink', 'festivals'],
  'south-end-wine-walk': ['south-end', 'food-drink', 'date-night'],
  'noda-night-market': ['noda', 'markets', 'food-drink'],
  'charlotte-fc-vs-inter-miami': ['uptown', 'sports'],
  'charlotte-fc-vs-atlanta-united': ['uptown', 'sports'],
  'charlotte-fc-vs-nashville-sc': ['uptown', 'sports'],
  'charlotte-knights-opening-day': ['uptown', 'sports', 'family-friendly'],
  'charlotte-pride-festival': ['uptown', 'festivals', 'free-events'],
  'speed-street-festival': ['uptown', 'festivals', 'free-events'],
  'tuck-fest': ['outdoor-activities', 'festivals', 'family-friendly'],
  'whitewater-center-summer-concert': ['outdoor-activities', 'live-music'],
  'plaza-midwood-crawl': ['plaza-midwood', 'food-drink', 'nightlife'],
  'camp-north-end-makers-market': ['markets', 'arts-culture'],
  'charlotte-symphony-in-the-park': ['arts-culture', 'free-events', 'date-night'],
  'noda-gallery-crawl': ['noda', 'arts-culture', 'free-events'],
  'charlotte-comedy-festival': ['arts-culture', 'nightlife'],
  'dilworth-jubilee': ['dilworth', 'festivals', 'family-friendly'],
  'charlotte-wine-and-food-weekend': ['food-drink', 'date-night'],
  'juneteenth-celebration-charlotte': ['festivals', 'free-events', 'arts-culture'],
  'charlotte-reggae-festival': ['live-music', 'festivals'],
  'lake-norman-boat-show': ['outdoor-activities', 'family-friendly'],
  'charlotte-marathon-spring': ['outdoor-activities', 'fitness-wellness'],
  'queens-feast-charlotte-restaurant-week': ['food-drink', 'date-night'],
};

for (const event of events) {
  const tagSlugs = new Set();
  
  // Apply specific tags
  if (specificEventTags[event.slug]) {
    specificEventTags[event.slug].forEach(t => tagSlugs.add(t));
  }
  
  // Apply category-based tags
  if (event.category) {
    for (const [keyword, tags] of Object.entries(eventTagMappings)) {
      if (event.category.toLowerCase().includes(keyword)) {
        tags.forEach(t => tagSlugs.add(t));
      }
    }
  }
  
  // Apply neighborhood tags based on venue/neighborhood
  const venueNeighborhood = (event.neighborhood || event.venueName || '').toLowerCase();
  if (venueNeighborhood.includes('uptown') || venueNeighborhood.includes('bank of america')) tagSlugs.add('uptown');
  if (venueNeighborhood.includes('south end')) tagSlugs.add('south-end');
  if (venueNeighborhood.includes('noda')) tagSlugs.add('noda');
  if (venueNeighborhood.includes('plaza midwood')) tagSlugs.add('plaza-midwood');
  
  for (const slug of tagSlugs) {
    const tagId = tagIdMap[slug];
    if (!tagId) continue;
    try {
      await conn.execute(
        `INSERT INTO content_tags (tagId, contentType, contentId) VALUES (?, 'event', ?)`,
        [tagId, String(event.id)]
      );
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') console.error(`  ❌ Error tagging event ${event.slug}:`, err.message);
    }
  }
  console.log(`  ✅ Event: ${event.title} → [${[...tagSlugs].join(', ')}]`);
}

// Step 3: Tag blog posts
console.log('\nTagging blog posts...');
const [posts] = await conn.execute(`SELECT id, slug, title, category FROM blog_posts`);

const blogTagMappings = {
  'moving-to-charlotte-checklist': ['new-to-charlotte'],
  'best-brunch-spots-by-neighborhood': ['food-drink', 'date-night'],
  'charlotte-vs-raleigh': ['new-to-charlotte'],
  'first-30-days-in-charlotte': ['new-to-charlotte'],
  'charlotte-hidden-gems': ['food-drink', 'arts-culture', 'outdoor-activities'],
  'this-weekend-in-clt-spring-2026': ['festivals', 'food-drink', 'live-music', 'seasonal'],
  'noda-neighborhood-deep-dive': ['noda', 'food-drink', 'breweries', 'arts-culture', 'live-music'],
  'charlotte-summer-survival-guide-2026': ['seasonal', 'outdoor-activities', 'family-friendly', 'food-drink'],
  'date-night-charlotte-guide': ['date-night', 'food-drink', 'arts-culture', 'outdoor-activities'],
};

for (const post of posts) {
  const tagSlugs = blogTagMappings[post.slug] || [];
  for (const slug of tagSlugs) {
    const tagId = tagIdMap[slug];
    if (!tagId) continue;
    try {
      await conn.execute(
        `INSERT INTO content_tags (tagId, contentType, contentId) VALUES (?, 'blog', ?)`,
        [tagId, String(post.id)]
      );
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') console.error(`  ❌ Error tagging blog ${post.slug}:`, err.message);
    }
  }
  console.log(`  ✅ Blog: ${post.title} → [${tagSlugs.join(', ')}]`);
}

// Summary
const [tagCount] = await conn.execute(`SELECT COUNT(*) as c FROM tags`);
const [contentTagCount] = await conn.execute(`SELECT COUNT(*) as c FROM content_tags`);
console.log(`\n✅ Done! ${tagCount[0].c} tags, ${contentTagCount[0].c} content-tag associations.`);

await conn.end();
