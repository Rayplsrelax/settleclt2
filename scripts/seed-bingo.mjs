/**
 * Seed themed bingo cards for CLT Passport
 * Each card has 25 squares (5x5 grid, center is free space)
 */
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { bingoCards } from '../drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }

const pool = mysql.createPool(DATABASE_URL);
const db = drizzle(pool);

const cards = [
  {
    title: "Charlotte Brewery Tour",
    description: "Visit 24 of Charlotte's best breweries and taprooms. Charlotte has 50+ breweries — can you hit them all?",
    theme: "food-drink",
    squares: [
      { id: 1, label: "Wooden Robot Brewery", serviceKey: "wooden-robot-brewery" },
      { id: 2, label: "NoDa Brewing Company", serviceKey: "noda-brewing-company" },
      { id: 3, label: "Birdsong Brewing", serviceKey: "birdsong-brewing" },
      { id: 4, label: "Triple C Brewing", serviceKey: "triple-c-brewing" },
      { id: 5, label: "Sycamore Brewing", serviceKey: "sycamore-brewing" },
      { id: 6, label: "Olde Mecklenburg Brewery", serviceKey: "olde-mecklenburg-brewery" },
      { id: 7, label: "Legion Brewing", serviceKey: "legion-brewing" },
      { id: 8, label: "Resident Culture", serviceKey: "resident-culture" },
      { id: 9, label: "Free Range Brewing", serviceKey: "free-range-brewing" },
      { id: 10, label: "Heist Brewery", serviceKey: "heist-brewery" },
      { id: 11, label: "Protagonist Brewing", serviceKey: "protagonist-brewing" },
      { id: 12, label: "Suffolk Punch", serviceKey: "suffolk-punch" },
      { id: 13, label: "⭐ FREE SPACE ⭐", serviceKey: null, free: true },
      { id: 14, label: "Lenny Boy Brewing", serviceKey: "lenny-boy-brewing" },
      { id: 15, label: "Town Brewing", serviceKey: "town-brewing" },
      { id: 16, label: "Salud Cerveceria", serviceKey: "salud-cerveceria" },
      { id: 17, label: "Pilot Brewing", serviceKey: "pilot-brewing" },
      { id: 18, label: "Bold Missy Brewery", serviceKey: "bold-missy-brewery" },
      { id: 19, label: "Catawba Brewing CLT", serviceKey: "catawba-brewing-clt" },
      { id: 20, label: "Divine Barrel Brewing", serviceKey: "divine-barrel-brewing" },
      { id: 21, label: "Armored Cow Brewing", serviceKey: "armored-cow-brewing" },
      { id: 22, label: "Sugar Creek Brewing", serviceKey: "sugar-creek-brewing" },
      { id: 23, label: "Brewers at 4001 Yancey", serviceKey: "brewers-at-4001-yancey" },
      { id: 24, label: "Unknown Brewing", serviceKey: "unknown-brewing" },
      { id: 25, label: "Ass Clown Brewing", serviceKey: "ass-clown-brewing" },
    ],
  },
  {
    title: "Best Coffee in CLT",
    description: "Charlotte's coffee scene is booming. Hit 24 of the best local roasters and cafes to earn your caffeine crown.",
    theme: "food-drink",
    squares: [
      { id: 1, label: "Undercurrent Coffee", serviceKey: "undercurrent-coffee" },
      { id: 2, label: "Not Just Coffee", serviceKey: "not-just-coffee" },
      { id: 3, label: "Smelly Cat Coffeehouse", serviceKey: "smelly-cat-coffeehouse" },
      { id: 4, label: "Central Coffee Co.", serviceKey: "central-coffee-co" },
      { id: 5, label: "Magnolia Coffee", serviceKey: "magnolia-coffee" },
      { id: 6, label: "Brakeman's Coffee", serviceKey: "brakemans-coffee" },
      { id: 7, label: "Coco and the Director", serviceKey: "coco-and-the-director" },
      { id: 8, label: "Hex Coffee", serviceKey: "hex-coffee" },
      { id: 9, label: "Pure Intentions Coffee", serviceKey: "pure-intentions-coffee" },
      { id: 10, label: "Mugs Coffee", serviceKey: "mugs-coffee" },
      { id: 11, label: "The Hobbyist", serviceKey: "the-hobbyist" },
      { id: 12, label: "Enderly Coffee", serviceKey: "enderly-coffee" },
      { id: 13, label: "⭐ FREE SPACE ⭐", serviceKey: null, free: true },
      { id: 14, label: "Nightflyer Roastworks", serviceKey: "nightflyer-roastworks" },
      { id: 15, label: "Summit Coffee", serviceKey: "summit-coffee" },
      { id: 16, label: "Waterbean Coffee", serviceKey: "waterbean-coffee" },
      { id: 17, label: "Camp North End Coffee", serviceKey: "camp-north-end-coffee" },
      { id: 18, label: "Stumptown (South End)", serviceKey: "stumptown-south-end" },
      { id: 19, label: "Bean Vegan Cuisine", serviceKey: "bean-vegan-cuisine" },
      { id: 20, label: "The Daily Press", serviceKey: "the-daily-press" },
      { id: 21, label: "Common Market", serviceKey: "common-market" },
      { id: 22, label: "Amelie's French Bakery", serviceKey: "amelies-french-bakery" },
      { id: 23, label: "Crispy Donuts & Coffee", serviceKey: "crispy-donuts-coffee" },
      { id: 24, label: "Dilworth Coffee", serviceKey: "dilworth-coffee" },
      { id: 25, label: "Jovie Coffee", serviceKey: "jovie-coffee" },
    ],
  },
  {
    title: "Date Night in Charlotte",
    description: "24 unforgettable date spots across the Queen City. From rooftop cocktails to moonlit walks — romance your way through CLT.",
    theme: "experiences",
    squares: [
      { id: 1, label: "Dinner at Leah & Louise", serviceKey: "leah-and-louise" },
      { id: 2, label: "Cocktails at The Cellar", serviceKey: "the-cellar-duckworths" },
      { id: 3, label: "Walk the Rail Trail at sunset", serviceKey: null, category: "outdoors" },
      { id: 4, label: "Rooftop drinks at Aura", serviceKey: "aura-rooftop" },
      { id: 5, label: "Comedy show at Comedy Zone", serviceKey: "comedy-zone-charlotte" },
      { id: 6, label: "Cooking class at Chef Alyssa's", serviceKey: "chef-alyssas-kitchen" },
      { id: 7, label: "Picnic at Freedom Park", serviceKey: null, category: "outdoors" },
      { id: 8, label: "Live music in NoDa", serviceKey: null, category: "entertainment" },
      { id: 9, label: "Dessert at Amelie's", serviceKey: "amelies-french-bakery" },
      { id: 10, label: "Kayak on Lake Norman", serviceKey: null, category: "outdoors" },
      { id: 11, label: "Art walk at Camp North End", serviceKey: null, category: "culture" },
      { id: 12, label: "Wine tasting at Vintner Wine", serviceKey: "vintner-wine-market" },
      { id: 13, label: "⭐ FREE SPACE ⭐", serviceKey: null, free: true },
      { id: 14, label: "Brunch at Tupelo Honey", serviceKey: "tupelo-honey" },
      { id: 15, label: "Escape room challenge", serviceKey: null, category: "entertainment" },
      { id: 16, label: "Charlotte FC match", serviceKey: null, category: "sports" },
      { id: 17, label: "Sunset at Romare Bearden Park", serviceKey: null, category: "outdoors" },
      { id: 18, label: "Bowling at Ten Park Lanes", serviceKey: "ten-park-lanes" },
      { id: 19, label: "Speakeasy at Dot Dot Dot", serviceKey: "dot-dot-dot" },
      { id: 20, label: "Farmers market Saturday", serviceKey: null, category: "shopping" },
      { id: 21, label: "Mint Museum date", serviceKey: null, category: "culture" },
      { id: 22, label: "Whitewater Center adventure", serviceKey: null, category: "outdoors" },
      { id: 23, label: "Food truck Friday", serviceKey: null, category: "food" },
      { id: 24, label: "Stargazing at McDowell Preserve", serviceKey: null, category: "outdoors" },
      { id: 25, label: "Hornets or Panthers game", serviceKey: null, category: "sports" },
    ],
  },
  {
    title: "Charlotte Newcomer Challenge",
    description: "The essential Charlotte experience for new residents. Complete this card and you'll know the city better than people who've lived here for years.",
    theme: "newcomer",
    squares: [
      { id: 1, label: "Get your NC driver's license", serviceKey: null, category: "official" },
      { id: 2, label: "Ride the LYNX Blue Line end to end", serviceKey: null, category: "transit" },
      { id: 3, label: "Eat at Optimist Hall", serviceKey: null, category: "food" },
      { id: 4, label: "Visit the Whitewater Center", serviceKey: null, category: "outdoors" },
      { id: 5, label: "Attend a Panthers/Hornets/FC game", serviceKey: null, category: "sports" },
      { id: 6, label: "Walk through Camp North End", serviceKey: null, category: "culture" },
      { id: 7, label: "Try NC BBQ (both styles)", serviceKey: null, category: "food" },
      { id: 8, label: "Visit the Mint Museum", serviceKey: null, category: "culture" },
      { id: 9, label: "Hike Crowders Mountain", serviceKey: null, category: "outdoors" },
      { id: 10, label: "Find your regular coffee shop", serviceKey: null, category: "food" },
      { id: 11, label: "Join a Charlotte sports league", serviceKey: null, category: "social" },
      { id: 12, label: "Explore NoDa on First Friday", serviceKey: null, category: "culture" },
      { id: 13, label: "⭐ FREE SPACE ⭐", serviceKey: null, free: true },
      { id: 14, label: "Visit Lake Norman", serviceKey: null, category: "outdoors" },
      { id: 15, label: "Eat pho on Central Avenue", serviceKey: null, category: "food" },
      { id: 16, label: "Walk the Little Sugar Creek Greenway", serviceKey: null, category: "outdoors" },
      { id: 17, label: "Attend a Charlotte FC match", serviceKey: null, category: "sports" },
      { id: 18, label: "Visit Sleepy Poet Antique Mall", serviceKey: null, category: "shopping" },
      { id: 19, label: "Try Bojangles (it's a rite of passage)", serviceKey: null, category: "food" },
      { id: 20, label: "Visit the NASCAR Hall of Fame", serviceKey: null, category: "culture" },
      { id: 21, label: "Brunch in South End", serviceKey: null, category: "food" },
      { id: 22, label: "Explore Dilworth's tree-lined streets", serviceKey: null, category: "neighborhood" },
      { id: 23, label: "Visit the Charlotte Farmers Market", serviceKey: null, category: "shopping" },
      { id: 24, label: "Say 'y'all' unironically", serviceKey: null, category: "milestone" },
      { id: 25, label: "Tell someone 'I live in Charlotte now'", serviceKey: null, category: "milestone" },
    ],
  },
];

console.log(`\n🎯 Seeding ${cards.length} bingo cards...\n`);

for (const card of cards) {
  try {
    await db.insert(bingoCards).values({
      title: card.title,
      description: card.description,
      theme: card.theme,
      squaresJson: JSON.stringify(card.squares),
      active: 'yes',
    });
    console.log(`✅ ${card.title} (${card.squares.length} squares)`);
  } catch (err) {
    if (err.message?.includes('Duplicate')) {
      console.log(`⏭️  ${card.title} — already exists`);
    } else {
      console.log(`❌ ${card.title} — ${err.message}`);
    }
  }
}

console.log(`\n📊 Bingo card seeding complete!\n`);
await pool.end();
process.exit(0);
