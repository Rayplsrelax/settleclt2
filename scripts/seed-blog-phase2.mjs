import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

const articles = [
  {
    title: "This Weekend in CLT: Spring 2026 Events You Can't Miss",
    slug: "this-weekend-in-clt-spring-2026",
    excerpt: "From food festivals to live music and outdoor markets — here's what's happening in Charlotte this spring.",
    category: "Events",
    readTime: "5 min",
    content: `# This Weekend in CLT: Spring 2026 Events You Can't Miss

Charlotte comes alive in the spring. The weather is perfect, the patios are packed, and there's something happening in every neighborhood. Whether you just moved here or you're a lifelong local, here's your guide to the best events this season.

## March Highlights

### Charlotte SHOUT! Festival
**When:** March 28 – April 6
**Where:** Uptown Charlotte

Charlotte's signature arts festival returns with 10 days of performances, installations, and pop-up events across Uptown. This year's theme celebrates the city's growing creative community with over 200 artists participating.

**Why go:** It's free, it's massive, and it's the best way to experience Charlotte's art scene in one weekend. Grab dinner at a Uptown restaurant and walk through the installations after dark — they're even better lit up at night.

### South End Wine Walk
**When:** Every third Saturday
**Where:** South End galleries and shops

Local businesses along South End open their doors with wine tastings, live music, and special deals. It's part shopping, part bar crawl, part neighborhood tour.

**Pro tip:** Start at Atherton Mill and work your way toward the light rail stations. The galleries between Bland and East/West stations have the best pours.

## April Must-Dos

### Taste of Charlotte
**When:** April 17-19
**Where:** Uptown (Tryon Street)

Over 100 restaurants set up booths along Tryon Street for Charlotte's biggest food festival. You'll find everything from BBQ to Peruvian to Korean fusion. Buy a tasting pass and pace yourself — there's a lot of ground to cover.

**Budget tip:** The Friday evening session is less crowded and some vendors offer early-bird pricing.

### NoDa Brewing Anniversary Party
**When:** April 25
**Where:** NoDa Brewing Company

NoDa Brewing celebrates another year with limited-release beers, food trucks, and live music all day. It's one of the most popular brewery events in the city and a great introduction to Charlotte's craft beer culture.

## May Events

### Charlotte FC Home Games
**When:** Multiple dates through May
**Where:** Bank of America Stadium

The energy at Charlotte FC games is unreal. Even if you're not a soccer fan, the atmosphere in the supporters' section is worth experiencing. Tailgating starts hours before kickoff in the lots around the stadium.

### Speed Street Festival
**When:** May 22-24
**Where:** Uptown Charlotte

The annual pre-race festival brings concerts, car displays, and street food to Uptown. It's Charlotte's version of a block party, and it draws huge crowds. Get there early for the best spots near the main stage.

## Recurring Weekly Events

- **Tuesday:** Trivia nights at Wooden Robot Brewery (South End) and Resident Culture (Plaza Midwood)
- **Wednesday:** Food Truck Wednesday at various locations — check @CLTFoodTrucks on Instagram
- **Thursday:** Live music at The Evening Muse (NoDa) and Petra's (Uptown)
- **Friday:** First Friday gallery walks in NoDa
- **Saturday:** Charlotte Regional Farmers Market (open year-round, 8am-noon)
- **Sunday:** Brunch crawls — see our [Best Brunch Spots by Neighborhood](/blog/best-brunch-spots-by-neighborhood) guide

## How to Stay in the Loop

Charlotte's event scene moves fast. Here's how to keep up:

- **Settle CLT Events page:** We update our [Events page](/events) weekly with the latest happenings
- **Instagram:** Follow @charlotteagenda, @caborasnc, and @exploreclt for real-time updates
- **Charlotte's Got A Lot:** The city's official tourism site has a comprehensive event calendar
- **Nextdoor:** Great for hyper-local events in your specific neighborhood

---

*New to Charlotte? Check out our [Moving to Charlotte Checklist](/blog/moving-to-charlotte-checklist) and [First 30 Days Guide](/blog/first-30-days-in-charlotte) to get settled fast.*`
  },
  {
    title: "NoDa Deep Dive: Charlotte's Arts District Neighborhood Guide",
    slug: "noda-neighborhood-deep-dive",
    excerpt: "Everything you need to know about living in NoDa — the food, the art, the breweries, and what it's really like to call Charlotte's arts district home.",
    category: "Neighborhoods",
    readTime: "10 min",
    content: `# NoDa Deep Dive: Charlotte's Arts District Neighborhood Guide

NoDa — short for North Davidson — is Charlotte's original arts district and one of the most vibrant neighborhoods in the city. If you're considering a move to Charlotte and want walkability, creativity, and a strong sense of community, NoDa should be at the top of your list.

## The Vibe

NoDa feels like a small town inside a big city. The streets are lined with murals, the coffee shops know your name, and there's always live music somewhere within walking distance. It's eclectic without being pretentious, artsy without being inaccessible.

**Who lives here:** Young professionals, artists, musicians, couples, and a growing number of families. The demographic has shifted over the past few years as new development has brought in more restaurants and condos, but the neighborhood has fought hard to keep its character.

## Food & Drink

### Must-Try Restaurants
- **Haberdish** — Southern comfort food elevated. The fried chicken is legendary. Make a reservation.
- **Cabo Fish Taco** — The original NoDa location. Casual, affordable, and the fish tacos are exactly what you want on a warm evening.
- **Crepe Cellar** — European-style crepes in a cozy upstairs space. Great for date night.
- **Fud at Salud** — Beer hall meets food hall. Multiple vendors under one roof with a massive outdoor patio.

### Breweries & Bars
NoDa is ground zero for Charlotte's craft beer scene:
- **NoDa Brewing Company** — The flagship. Hop Drop 'n Roll is a Charlotte classic.
- **Heist Brewery** — Known for creative barrel-aged beers and a full restaurant menu.
- **Free Range Brewing** — Smaller, more experimental. Great outdoor space.
- **Salud Cerveceria** — Latin-inspired brewery with incredible tacos and a community-first vibe.

### Coffee
- **Smelly Cat Coffeehouse** — The neighborhood institution. Mismatched furniture, local art on the walls, and the best people-watching in NoDa.
- **Undercurrent Coffee** — Sleek, modern, and serious about their pour-overs.

## Living in NoDa

### Housing
NoDa offers a mix of housing types:
- **Historic bungalows:** $350K-$500K. Charming but competitive — they sell fast.
- **New townhomes:** $400K-$600K. Modern builds popping up on side streets.
- **Apartments:** $1,400-$2,200/month for a 1BR. The newer complexes along North Davidson have the best amenities.
- **Condos/lofts:** $250K-$450K. Converted mill buildings and new construction.

### Walkability
NoDa scores high on walkability for Charlotte. You can walk to restaurants, breweries, coffee shops, and the 36th Street light rail station. The neighborhood is also very bikeable, with connections to the Cross Charlotte Trail.

### Parking
Street parking is free but can be tight on weekends, especially during events. Most apartment complexes include parking. If you're visiting, the lots behind NoDa Brewing and near the Neighborhood Theatre usually have space.

## Arts & Culture

NoDa's identity is built on art:
- **Gallery crawls** happen the first and third Friday of every month. Dozens of galleries open their doors with free wine and live music.
- **The Evening Muse** is one of Charlotte's best live music venues — intimate, affordable, and they book incredible indie acts.
- **Neighborhood Theatre** hosts comedy shows, concerts, and community events in a converted movie theater.
- **Street art** is everywhere. Walk down North Davidson and 36th Street to see murals by local and international artists.

## Getting Around

- **Light Rail:** The 36th Street station connects NoDa to Uptown (10 min), South End, and UNC Charlotte.
- **Driving:** Easy access to I-77 and I-85. Uptown is 5 minutes by car.
- **Biking:** The neighborhood is flat and bike-friendly. The greenway connects to the broader Charlotte trail network.

## The Bottom Line

NoDa is Charlotte's most walkable, creative, and community-oriented neighborhood. It's not the cheapest option, but the lifestyle value is hard to beat. If you want to feel like you're part of something — not just living in an apartment complex — NoDa delivers.

**Best for:** Young professionals, creatives, beer lovers, people who want walkability
**Not ideal for:** Families needing top-rated schools (CMS options are limited), people who need quiet on weekends

---

*Explore all 20 Charlotte neighborhoods on our [Neighborhoods page](/neighborhoods) or take the [Neighborhood Quiz](/quiz) to find your perfect match.*`
  },
  {
    title: "Charlotte Summer Survival Guide 2026",
    slug: "charlotte-summer-survival-guide-2026",
    excerpt: "How to beat the heat, where to find the best pools and splash pads, and the summer events that make Charlotte worth sweating for.",
    category: "Seasonal",
    readTime: "8 min",
    content: `# Charlotte Summer Survival Guide 2026

Charlotte summers are hot. We're talking 95°F with humidity that makes you question your life choices. But if you know where to go and what to do, summer in the Queen City is actually incredible. Here's your survival guide.

## Beating the Heat

### Best Pools & Splash Pads
Charlotte has a surprisingly good public pool system:
- **Ray's Splash Planet** (Uptown) — Indoor water park with slides, lazy river, and a wave pool. $5 admission. Yes, really.
- **Cordelia Pool** (Elizabeth) — Outdoor pool with a great vibe. Opens Memorial Day weekend.
- **Revolution Park Pool** — Olympic-sized outdoor pool. Lap swimming in the morning, open swim in the afternoon.
- **Latta Plantation Nature Center** — Not a pool, but Mountain Island Lake has a beach area perfect for cooling off.

### Splash Pads (Free!)
- **First Ward Park** (Uptown) — Right next to the Levine Museum. Great for kids.
- **Romare Bearden Park** (Uptown) — The splash pad here is iconic. Surrounded by the skyline.
- **Freedom Park** — Splash pad plus a lake, trails, and picnic areas.

## Summer Food & Drink

### Best Patios
When the sun goes down and the temperature drops to a manageable 85°F, Charlotte's patio scene comes alive:
- **Sycamore Brewing** (South End) — Massive outdoor area with food trucks and cornhole.
- **Unknown Brewing** (South End) — Quirky, fun, and they have a school bus you can sit in.
- **Optimist Hall** (Optimist Park) — Food hall with a huge outdoor courtyard. Something for everyone.
- **Leroy Fox** (South End) — Southern food, strong cocktails, and a rooftop with skyline views.

### Ice Cream & Frozen Treats
- **Jeni's Splendid Ice Creams** (South End, Dilworth) — The salted peanut butter with chocolate flecks is life-changing.
- **Two Scoops Creamery** (Plaza Midwood) — Local favorite with creative flavors.
- **Kilwins** (Uptown) — Classic ice cream shop on the Tryon Street strip.

## Summer Events Calendar

### June
- **Juneteenth Festival** (various locations) — Celebrations across the city with music, food, and community events.
- **Charlotte Pride** — One of the biggest Pride celebrations in the Southeast. The parade through Uptown is a must-see.
- **Lake Norman Summer Kickoff** — If you haven't been to Lake Norman yet, this is your excuse.

### July
- **Fourth of July at BB&T Ballpark** — The Charlotte Knights host the best fireworks show in the city. Get there early.
- **SouthPark Summer Movies** — Free outdoor movie screenings at Symphony Park. Bring a blanket.
- **NoDa Night Market** — Monthly evening market with local vendors, food, and live music.

### August
- **Carolina Renaissance Festival** (opens late August) — It's technically in Huntersville, but it's a Charlotte tradition. Turkey legs, jousting, and questionable accents.
- **Back-to-School Block Parties** — Various neighborhoods host community events as summer winds down.

## Outdoor Activities (That Won't Kill You)

### Early Morning (Before 10am)
- **U.S. National Whitewater Center** — Go early for kayaking, paddleboarding, or the ropes course before it gets brutal.
- **Greenway runs** — The Little Sugar Creek Greenway and Cross Charlotte Trail are shaded in sections.
- **McDowell Nature Preserve** — Hiking trails along Lake Wylie. Bring water. Lots of water.

### Evening (After 6pm)
- **Freedom Park walks** — The lake loop is beautiful at golden hour.
- **Reedy Creek Nature Center** — Easy trails through the woods. Cooler under the canopy.
- **Brewery hopping** — Most Charlotte breweries have excellent outdoor spaces with misters and fans.

## Day Trips to Escape the Heat

When Charlotte hits triple digits, escape to the mountains:
- **Chimney Rock** (2 hours) — Swimming holes and waterfalls.
- **Blowing Rock** (2.5 hours) — 10-15 degrees cooler than Charlotte. Perfect mountain town.
- **Lake Lure** (1.5 hours) — Beach, boat rentals, and the setting for Dirty Dancing.
- **South Mountains State Park** (1 hour) — Waterfalls and swimming. The closest mountain escape.

## Summer Survival Tips

1. **Hydrate aggressively.** Charlotte humidity is no joke. Carry water everywhere.
2. **Embrace the afternoon thunderstorm.** They roll in around 3-4pm most days. They cool things down and they're usually over in 30 minutes.
3. **Invest in a good sunscreen.** SPF 50+. Reapply. You're closer to the sun than you think.
4. **Use the light rail.** Walking in 95°F heat is miserable. The LYNX Blue Line is air-conditioned and connects most of the popular areas.
5. **Join a pool.** If your apartment doesn't have one, consider a gym membership just for pool access. It's worth it June through September.

---

*Planning your move? Check out our [Cost of Living Guide](/blog/cost-of-living-2026) and [Neighborhood Explorer](/neighborhoods) to find the perfect spot.*`
  },
  {
    title: "Date Night in Charlotte: 25 Ideas Beyond Dinner and a Movie",
    slug: "date-night-charlotte-guide",
    excerpt: "Creative date ideas for every budget — from free outdoor adventures to splurge-worthy experiences across Charlotte's best neighborhoods.",
    category: "Lifestyle",
    readTime: "7 min",
    content: `# Date Night in Charlotte: 25 Ideas Beyond Dinner and a Movie

Charlotte has way more to offer than the usual dinner-and-a-movie routine. Whether you're new to the city or just stuck in a date night rut, here are 25 ideas that actually make Charlotte feel exciting.

## Free & Budget-Friendly (Under $20)

### 1. NoDa Gallery Crawl
**When:** First and third Fridays
Walk through dozens of galleries with free wine and live music. It's cultured, it's free, and you'll actually have things to talk about afterward.

### 2. Sunset at the Whitewater Center
Park at the U.S. National Whitewater Center and walk the trails at golden hour. The views of the river and the sunset are stunning. Grab a beer at the on-site brewery afterward.

### 3. Romare Bearden Park Picnic
Pack a blanket and takeout from 7th Street Public Market. The park has skyline views and it's one of the most romantic spots in Uptown after dark.

### 4. Little Sugar Creek Greenway Walk
Start at Midtown and walk south through Freedom Park. Stop at one of the coffee shops along the way. It's simple but it works.

### 5. Charlotte Farmers Market
Saturday mornings at the Charlotte Regional Farmers Market. Buy ingredients together and cook dinner at home. It's wholesome and surprisingly fun.

## Mid-Range ($20-$75)

### 6. Optimist Hall Food Crawl
Share dishes from 3-4 different vendors at this beautiful food hall in a converted textile mill. The architecture alone is worth the visit.

### 7. Axe Throwing at Axes and Ales
Nothing says romance like throwing sharp objects at a wooden target. They serve beer too. It's more fun than it sounds.

### 8. Comedy Show at The Comedy Zone
Charlotte's comedy scene is underrated. Check the lineup — they get solid touring acts and the local open mic nights are entertaining.

### 9. Brewery Tour
Hit 3-4 breweries in South End or NoDa on foot. Make it a progressive dinner by grabbing food truck bites at each stop.

### 10. Escape Room
Charlotte has several escape room venues. Breakout Games and Escape Tactic are the best-reviewed. It's a great way to see how you work together under pressure.

### 11. Kayaking on Mountain Island Lake
Rent kayaks and paddle around the lake. It's peaceful, it's active, and the scenery is beautiful. Best on weekday evenings when it's less crowded.

### 12. Discovery Place Science Museum
Not just for kids. The adults-only evening events include cocktails and hands-on exhibits. Check their calendar for themed nights.

### 13. Camp North End
This adaptive reuse campus has rotating pop-ups, food vendors, and events. Walk around, grab coffee at Leah & Louise's outdoor bar, and explore the art installations.

## Splurge-Worthy ($75+)

### 14. The Asbury
Farm-to-table fine dining in the historic Dunhill Hotel. The tasting menu is worth the splurge. Make a reservation weeks in advance.

### 15. Whitewater Center Adventure Package
Go all-in with the day pass: whitewater rafting, zip lining, rock climbing, and paddleboarding. End with dinner at the River's Edge Bar & Grill.

### 16. Cooking Class at Sur La Table
Learn to make pasta, sushi, or French pastries together. They provide the wine. It's hands-on, social, and you leave with new skills.

### 17. Charlotte FC Game + Dinner
Grab dinner at a Uptown restaurant before the match. The atmosphere at Bank of America Stadium is electric, even if you're not a soccer fan.

### 18. Spa Day at The Ballantyne
Full spa experience in south Charlotte. Couples massages, steam rooms, and a pool. It's a full reset.

## Seasonal Specials

### 19. Carowinds (Spring/Summer)
The roller coasters are legitimately world-class. Fury 325 is one of the best coasters in the country. Go on a weekday to avoid lines.

### 20. Ice Skating at the Holidays on Ice Rink (Winter)
Uptown's outdoor ice rink opens in November. It's touristy but charming, especially at night with the skyline lit up.

### 21. Pumpkin Picking at Patterson Farm (Fall)
A 30-minute drive to the best pumpkin patch in the area. Corn mazes, hayrides, and apple cider donuts.

### 22. Charlotte Motor Speedway Events (Various)
Even if you're not into NASCAR, the speedway hosts concerts, monster truck rallies, and a massive Christmas light show.

## Unique & Unexpected

### 23. Stargazing at Latta Plantation
Drive 20 minutes north and escape the city lights. The Charlotte Astronomy Club hosts public viewing nights with telescopes.

### 24. Vinyl Night at Manifest Records
Browse records together in Plaza Midwood, then grab dinner at Soul Gastrolounge next door. It's the perfect chill evening.

### 25. Take the Neighborhood Quiz Together
Seriously — take our [Neighborhood Quiz](/quiz) together and debate the results. It's a great conversation starter, especially if you're new to Charlotte and exploring where to live.

---

*Looking for more Charlotte lifestyle content? Check out our [Best Brunch Spots by Neighborhood](/blog/best-brunch-spots-by-neighborhood) and [Hidden Gems Guide](/blog/charlotte-hidden-gems).*`
  }
];

let inserted = 0;
for (const article of articles) {
  try {
    await conn.execute(
      `INSERT INTO blog_posts (title, slug, excerpt, content, category, authorId, status, readTime, publishedAt)
       VALUES (?, ?, ?, ?, ?, 1, 'published', ?, NOW())`,
      [article.title, article.slug, article.excerpt, article.content, article.category, article.readTime]
    );
    inserted++;
    console.log(`✅ Inserted: ${article.title}`);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log(`⏭️  Skipped (already exists): ${article.title}`);
    } else {
      console.error(`❌ Error inserting ${article.title}:`, err.message);
    }
  }
}

console.log(`\nDone! Inserted ${inserted} new blog articles.`);
await conn.end();
