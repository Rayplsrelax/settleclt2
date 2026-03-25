/**
 * Seed 5 blog articles into the database
 */
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { blogPosts } from '../drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }

const pool = mysql.createPool(DATABASE_URL);
const db = drizzle(pool);

const articles = [
  {
    title: "The Ultimate Moving to Charlotte Checklist",
    slug: "moving-to-charlotte-checklist",
    category: "Moving Guide",
    readTime: "8 min read",
    excerpt: "Everything you need to do before, during, and after your move to the Queen City — from transferring your license to finding the best neighborhoods.",
    content: `# The Ultimate Moving to Charlotte Checklist

Moving to Charlotte is one of the best decisions you'll make. The Queen City has been one of America's fastest-growing cities for over a decade, and for good reason — affordable cost of living, booming job market, mild winters, and a food scene that punches way above its weight.

But moving anywhere new can feel overwhelming. This checklist breaks it down into manageable phases so nothing falls through the cracks.

---

## 6-8 Weeks Before Your Move

### Research & Planning
- **Pick your neighborhood.** Charlotte's neighborhoods are wildly different. South End is walkable and trendy, NoDa is artsy and eclectic, Ballantyne is suburban and family-friendly. Take our [Find Your Neighborhood quiz](/quiz) to narrow it down.
- **Set your budget.** Average rent for a 1BR in Charlotte ranges from $1,100 (East Charlotte) to $1,800+ (South End/SouthPark). Factor in utilities (~$150/mo), car insurance, and groceries.
- **Secure housing.** Charlotte's rental market moves fast. Start browsing on Zillow, Apartments.com, and local Facebook groups. If buying, connect with a local realtor who knows the micro-markets.
- **Research schools** (if applicable). CMS (Charlotte-Mecklenburg Schools) is the district, but charter and private options are plentiful. Check GreatSchools ratings for your target neighborhoods.

### Employment & Finances
- **Line up your job** or research the market. Charlotte is a banking hub (Bank of America, Wells Fargo, Truist) but also strong in tech, healthcare, and logistics.
- **Open a local bank account.** Many Charlotte employers use local credit unions. Park Sterling and Allegacy are popular choices.
- **Update your budget** for Charlotte's cost of living. No state income tax on groceries, lower property taxes than the Northeast, but you will need a car.

---

## 2-4 Weeks Before Your Move

### Logistics
- **Book your movers.** Get at least 3 quotes. Local favorites include Hornet Moving and Two Men and a Truck Charlotte.
- **Forward your mail** via USPS.
- **Transfer or set up utilities.** Duke Energy (electric), Piedmont Natural Gas (gas), Charlotte Water (water/sewer), and Spectrum or AT&T (internet).
- **Update your address** with banks, subscriptions, insurance, and employer.

### Documentation
- **NC Driver's License.** You have 60 days after establishing residency. Visit the NC DMV — bring your current license, SSN card, and two proofs of residency.
- **Vehicle Registration.** Must be done within 30 days. You'll need a NC vehicle inspection first.
- **Voter Registration.** Register online at ncsbe.gov or at the DMV when you get your license.

---

## Moving Week

- **Confirm everything** with movers, utilities start dates, and key pickup times.
- **Pack a "first night" box** — sheets, towels, toiletries, phone charger, coffee maker, and a change of clothes.
- **Download the Settle CLT app** to start exploring your new neighborhood immediately.
- **Take photos** of your old place for security deposit purposes.

---

## First Week in Charlotte

### Get Settled
- **Explore your neighborhood on foot.** Find your closest grocery store (Harris Teeter, Publix, or Trader Joe's), pharmacy, and coffee shop.
- **Set up your home.** Unpack essentials first. Charlotte has great thrift stores (Habitat ReStore, Goodwill on South Blvd) for affordable furniture.
- **Meet your neighbors.** Charlotte is genuinely friendly. A simple wave or "hey, we just moved in" goes a long way.

### Essential Errands
- **Get your NC Driver's License** (NC DMV on Tyvola Rd or Arrowood Rd).
- **Register your vehicle** and get NC plates.
- **Find a primary care doctor.** Atrium Health and Novant Health are the two major systems. Most accept new patients within 2-3 weeks.
- **Find a dentist.** Check our [directory](/directory) for vetted local providers.

---

## First Month in Charlotte

### Build Your Life
- **Join something.** Charlotte has incredible community groups — CLT Run Club, Queen City Brewers Guild, Charlotte Hiking Club, and dozens of sports leagues through Charlotte Sports League.
- **Try the food.** Must-hit spots: Amelie's French Bakery (open late), Haberdish (Southern), Optimist Hall (food hall), and Leah & Louise (upscale Southern in Camp North End).
- **Explore beyond your neighborhood.** Take the LYNX Blue Line to see how different areas connect. Drive out to Lake Norman for a weekend. Visit the U.S. National Whitewater Center.
- **Start your CLT Passport.** Track the places you visit and complete themed bingo cards to really get to know the city.

### Pro Tips from Locals
- **Traffic patterns:** I-77 and I-485 are brutal during rush hour. Learn the back roads through Brookshire Freeway and Independence Blvd.
- **Weather:** Charlotte gets all four seasons. Summers are hot and humid (90°F+), winters are mild but occasionally icy. You'll need a light jacket from November to March.
- **The airport code is CLT.** Locals call it "the CLT." Charlotte Douglas is a major American Airlines hub with direct flights almost everywhere.
- **BBQ is a religion.** Eastern NC style (vinegar-based) vs. Lexington style (tomato-based) is a real debate. Try both before picking a side.

---

## You're a Charlottean Now

Welcome to the Queen City. It takes about 3-6 months to really feel settled, but Charlotte has a way of growing on you fast. The people are warm, the opportunities are real, and the quality of life is hard to beat.

Explore our [neighborhood guides](/neighborhoods) to go deeper, or browse the [directory](/directory) for trusted local services. And don't forget to take the [neighborhood quiz](/quiz) if you're still deciding where to land.

Happy settling! 🐝`,
  },
  {
    title: "Best Brunch Spots by Neighborhood",
    slug: "best-brunch-spots-by-neighborhood",
    category: "Food & Drink",
    readTime: "6 min read",
    excerpt: "From South End mimosa flights to NoDa's creative egg dishes — here's where Charlotte does brunch best, organized by neighborhood.",
    content: `# Best Brunch Spots by Neighborhood

Charlotte's brunch scene has exploded in recent years. Every neighborhood has its own vibe, and the brunch spots reflect that perfectly. Whether you're looking for a boozy bottomless mimosa situation or a quiet coffee-and-pastry morning, this guide has you covered.

---

## South End

South End is ground zero for Charlotte's brunch culture. On any given Saturday, you'll see lines wrapping around the block.

**Superica** — Tex-Mex brunch with incredible breakfast tacos and frozen margaritas. The patio on South Tryon is unbeatable on a sunny morning. Expect a 30-45 minute wait on weekends, but it moves fast.

**Tupelo Honey** — Southern comfort food elevated. The sweet potato pancakes are legendary, and the fried chicken biscuit is the kind of thing you'll dream about. They take reservations, which is a game-changer for South End brunch.

**Lunchbox** — A newer addition with creative sandwiches and a killer avocado toast. More casual than the others, with faster seating. Great for a quick weekday brunch.

---

## NoDa (North Davidson)

NoDa's brunch is as eclectic as the neighborhood itself — expect local art on the walls, craft coffee, and dishes you won't find anywhere else.

**Crepe Cellar** — A NoDa institution. French-inspired crepes (both sweet and savory) in a cozy space with exposed brick. The Nutella banana crepe is a must. Pair it with their house-made lavender lemonade.

**Haberdish** — Southern brunch done right. The shrimp and grits are some of the best in Charlotte, and the biscuits come with house-made jam. The space is beautiful — reclaimed wood, Edison bulbs, the whole deal.

**Smelly Cat Coffeehouse** — Not a full brunch spot, but the best coffee in NoDa with excellent pastries. Perfect for a lighter morning before exploring the galleries.

---

## Plaza Midwood

Plaza Midwood is Charlotte's most eclectic neighborhood, and brunch here reflects that — expect diverse flavors and zero pretension.

**Zada Jane's** — A Plaza Midwood staple for over a decade. Funky decor, massive portions, and some of the best breakfast burritos in the city. Cash only (there's an ATM inside). The wait can be long on weekends, but the covered patio makes it bearable.

**Soul Gastrolounge** — Technically a tapas bar, but their weekend brunch is phenomenal. Small plates meant for sharing, creative cocktails, and a dark, moody atmosphere that's perfect for a late brunch.

**Midwood Smokehouse** — BBQ for brunch? Absolutely. Their smoked meat hash and brisket eggs Benedict are incredible. Plus, you can get a side of mac and cheese at 11am without judgment.

---

## Uptown

Uptown brunch tends to be more polished — think hotel restaurants and rooftop views.

**Aura Rooftop** — Brunch with a view. Located atop the Grand Bohemian Hotel, the panoramic Charlotte skyline makes everything taste better. The menu is upscale American with excellent cocktails. Reservations strongly recommended.

**Mert's Heart & Soul** — A Charlotte institution serving soul food since 1998. The chicken and waffles are the gold standard, and the grits are creamy perfection. Casual, welcoming, and consistently great.

---

## Ballantyne & South Charlotte

The suburbs do brunch differently — more family-friendly, easier parking, and surprisingly good food.

**Another Broken Egg Cafe** — A Southern chain that does brunch exceptionally well. The crab cake Benedict and bananas Foster French toast are standouts. Family-friendly with a kids' menu.

**Bad Daddy's Burger Bar** — Known for burgers, but their brunch menu is legit. The breakfast burger (with a fried egg and bacon) is indulgent in the best way. Great craft beer selection for a morning drink.

---

## Pro Tips for Charlotte Brunch

1. **Go early or go late.** The 10am-12pm window is peak chaos. Arrive at 9am or after 1pm for shorter waits.
2. **Check for reservations.** More Charlotte restaurants are adopting reservation systems. Resy and OpenTable cover most spots.
3. **Weekday brunch is underrated.** Many spots offer weekday brunch specials that are quieter and cheaper.
4. **Bring cash for Plaza Midwood.** Several spots there are still cash-only or cash-preferred.
5. **Track your favorites** on your [CLT Passport](/passport) and build your own brunch tour!

---

*Know a brunch spot we missed? Drop a comment on the neighborhood page or [submit it to our directory](/list-your-business).*`,
  },
  {
    title: "Charlotte vs. Raleigh: Which City is Right for You?",
    slug: "charlotte-vs-raleigh",
    category: "City Comparison",
    readTime: "10 min read",
    excerpt: "Two of North Carolina's biggest cities, two very different vibes. Here's an honest comparison to help you decide where to settle.",
    content: `# Charlotte vs. Raleigh: Which City is Right for You?

If you're moving to North Carolina, you've probably narrowed it down to Charlotte or Raleigh. Both are booming, both are affordable compared to the Northeast or West Coast, and both have a lot to offer. But they're surprisingly different cities with distinct personalities.

As someone who's helped hundreds of people settle in Charlotte, here's my honest take on how these two cities compare.

---

## The Quick Version

| Category | Charlotte | Raleigh |
|----------|-----------|---------|
| **Population** | ~900,000 (2.7M metro) | ~480,000 (1.4M metro) |
| **Vibe** | Big city energy, corporate | College town feel, techy |
| **Top Industries** | Banking, finance, energy | Tech, biotech, education |
| **Average 1BR Rent** | $1,400 | $1,350 |
| **Commute** | Car-dependent, some rail | Car-dependent |
| **Pro Sports** | Panthers, Hornets, Charlotte FC | Hurricanes (NHL) |
| **Nightlife** | More options, bigger scene | Smaller but growing |
| **Nature Access** | Mountains 2hrs, beach 3.5hrs | Beach 2.5hrs, mountains 3hrs |

---

## Job Market

**Charlotte wins for:** Finance, banking, corporate careers, logistics, and energy. Charlotte is the second-largest banking center in the US after New York. Bank of America, Wells Fargo, and Truist are all headquartered here. If you're in finance, insurance, or corporate strategy, Charlotte is the clear choice.

**Raleigh wins for:** Tech, biotech, startups, and academia. The Research Triangle (Raleigh-Durham-Chapel Hill) is home to Research Triangle Park, one of the largest research parks in the world. Companies like Cisco, IBM, Red Hat, and Epic Games have major presences. If you're a software engineer or scientist, Raleigh's ecosystem is stronger.

**The verdict:** Charlotte has more Fortune 500 companies; Raleigh has more startups and tech jobs. Both have low unemployment and strong growth.

---

## Cost of Living

These cities are remarkably similar in cost. Charlotte is slightly more expensive for rent in trendy neighborhoods (South End, SouthPark), but Raleigh's housing prices have been climbing fast too.

**Key differences:**
- Charlotte has slightly higher rent in urban core neighborhoods
- Raleigh has higher property taxes (Wake County vs. Mecklenburg County)
- Groceries and utilities are nearly identical
- Both have no state income tax on groceries

**The verdict:** It's essentially a wash. Both are 15-25% cheaper than DC, Atlanta, or Austin.

---

## Neighborhoods & Lifestyle

**Charlotte feels like:** A real city. Uptown has skyscrapers, South End has a walkable urban strip, and the suburbs sprawl out in every direction. There's a clear "downtown" energy with corporate professionals, sports fans, and a growing arts scene.

**Raleigh feels like:** A big college town that grew up. NC State's campus is right downtown, giving the city a youthful energy. The neighborhoods are leafy and residential, with pockets of excellent restaurants and bars. It's more spread out and quieter than Charlotte.

**Charlotte's best neighborhoods:** South End (young professionals), NoDa (artists and creatives), Plaza Midwood (eclectic and diverse), Ballantyne (families), and Dilworth (historic charm). Check our [full neighborhood guides](/neighborhoods) for deep dives.

**Raleigh's best neighborhoods:** Downtown Raleigh (walkable), North Hills (upscale suburban), Five Points (historic), Glenwood South (nightlife), and Cary (family-friendly suburb).

---

## Food & Drink

Both cities have excellent food scenes, but they're different.

**Charlotte excels at:** Southern cuisine, international food (thanks to a more diverse population), food halls (Optimist Hall, Camp North End), and upscale dining. The brewery scene is massive — Charlotte has 50+ breweries.

**Raleigh excels at:** Farm-to-table dining, creative chef-driven restaurants, and a tighter-knit food community. Raleigh's restaurant scene punches above its weight for its size. The food truck scene is also excellent.

**The verdict:** Charlotte has more options; Raleigh has more intimacy. Both are excellent food cities.

---

## Sports & Entertainment

**Charlotte:** NFL (Panthers), NBA (Hornets), MLS (Charlotte FC), minor league baseball (Knights), and NASCAR (Charlotte Motor Speedway). Charlotte is a legit sports city with major venues and game-day culture.

**Raleigh:** NHL (Hurricanes) and that's it for major pro sports. NC State athletics fill the gap with passionate college sports fandom. Durham Bulls (minor league baseball) are nearby.

**Nightlife:** Charlotte wins handily. South End, Uptown, and NoDa have a much bigger nightlife scene. Raleigh's Glenwood South is fun but smaller.

**The verdict:** If sports and nightlife matter to you, Charlotte is the clear winner.

---

## Getting Around

Neither city is great for public transit, but Charlotte is slightly better.

**Charlotte has:** The LYNX Blue Line (light rail connecting South End to Uptown to UNC Charlotte), a bus system, and better walkability in core neighborhoods. You still need a car for most things.

**Raleigh has:** A bus system and that's about it. The Triangle is very car-dependent. There are plans for light rail, but they're years away.

**The verdict:** Charlotte has a slight edge with the Blue Line, but both cities require a car.

---

## Nature & Outdoors

**Charlotte:** The U.S. National Whitewater Center is a world-class outdoor facility right in the city. Lake Norman is 30 minutes north for boating. The Blue Ridge Mountains are 2 hours west, and the beach is 3.5 hours east.

**Raleigh:** Umstead State Park is right in the city. Falls Lake is 20 minutes away. The Outer Banks are 3 hours east (arguably better beaches than what Charlotte can access). Mountains are 3+ hours west.

**The verdict:** Charlotte has better mountain access and the Whitewater Center; Raleigh has better beach access. Both have excellent greenways and parks.

---

## So Which Should You Choose?

**Choose Charlotte if you:**
- Work in finance, banking, or corporate
- Want big-city energy with pro sports
- Value nightlife and a larger social scene
- Want light rail transit options
- Prefer being closer to the mountains

**Choose Raleigh if you:**
- Work in tech, biotech, or academia
- Prefer a quieter, more laid-back vibe
- Value proximity to great beaches
- Want a strong college-town atmosphere
- Prefer a smaller, more intimate city

---

Both cities are excellent places to live, and you really can't go wrong with either. But if you're leaning Charlotte (and you should be — we're biased), take our [neighborhood quiz](/quiz) to find your perfect spot, or dive into our [neighborhood guides](/neighborhoods) to start exploring.

*Welcome to North Carolina, whichever city you choose.*`,
  },
  {
    title: "First 30 Days in Charlotte: A Local's Survival Guide",
    slug: "first-30-days-in-charlotte",
    category: "Moving Guide",
    readTime: "7 min read",
    excerpt: "You've arrived in the Queen City. Now what? Here's your day-by-day guide to making Charlotte feel like home in your first month.",
    content: `# First 30 Days in Charlotte: A Local's Survival Guide

You made it. The boxes are (mostly) unpacked, you've figured out which light switch controls which light, and you're staring at a city full of strangers wondering how to make this place feel like home.

Good news: Charlotte is one of the friendliest cities in America, and it's full of transplants just like you. Here's your week-by-week guide to getting settled.

---

## Week 1: The Essentials

Your first week is about survival — getting the basics in place so you can function.

### Day 1-2: Stock Your Kitchen
Hit up **Harris Teeter** or **Publix** for groceries. Harris Teeter is Charlotte's hometown grocery chain (started here in 1960) and has the best store brand products. Publix has better deli and bakery. **Trader Joe's** in SouthPark and South End are always packed but worth it for specialty items.

**Pro tip:** Download the Harris Teeter app for digital coupons. The savings are real — $20-30 per trip if you clip them.

### Day 3: Get Your Bearings
Drive (or take the Blue Line) to **Uptown** and walk around. See the skyline, find Bank of America Stadium, walk through Romare Bearden Park. This is the heart of the city, and understanding how Uptown connects to other neighborhoods will help everything else make sense.

### Day 4-5: Handle the Paperwork
- **NC Driver's License:** NC DMV on Tyvola Road has the shortest waits. Go right when they open (8am). Bring your current license, SSN card, and two proofs of residency (lease + utility bill).
- **Vehicle Registration:** You need a NC vehicle inspection first. Any Jiffy Lube or Firestone can do it ($30). Then go to the DMV for plates.
- **Set up utilities** if you haven't already: Duke Energy, Piedmont Natural Gas, Charlotte Water.

### Day 6-7: Explore Your Neighborhood
Walk every street within a half-mile of your home. Find your:
- Closest coffee shop (you'll need a "regular" spot)
- Nearest pharmacy (CVS and Walgreens are everywhere)
- Best takeout option for lazy nights
- Closest park or greenway access point

---

## Week 2: Build Your Routine

### Find Your Coffee Shop
This is more important than it sounds. Your coffee shop becomes your third place — not home, not work, but somewhere you go regularly and start recognizing faces.

**By neighborhood:**
- South End: **Undercurrent Coffee** (serious coffee) or **Not Just Coffee** (great vibes)
- NoDa: **Smelly Cat Coffeehouse** (quirky and beloved)
- Plaza Midwood: **Central Coffee Co.** (neighborhood staple)
- Dilworth: **Magnolia Coffee** (quiet and cozy)

### Set Up Your Fitness Routine
Charlotte is an active city. Finding a gym or fitness community is one of the fastest ways to meet people.

- **CLT Run Club** meets weekly and is incredibly welcoming to newcomers
- **MADabolic** and **Burn Boot Camp** are popular Charlotte-born fitness brands
- **The Whitewater Center** offers an annual pass ($60/year) for unlimited access to trails, climbing, and paddling
- Most neighborhoods have a **Planet Fitness** or **Anytime Fitness** within 10 minutes

### Get Your Healthcare Lined Up
Don't wait until you're sick. Charlotte has two major health systems:
- **Atrium Health** (larger, more locations)
- **Novant Health** (generally shorter wait times)

Both accept most insurance. Use their websites to find a primary care doctor accepting new patients. Dental and vision can wait a few weeks, but get your PCP established early.

---

## Week 3: Start Socializing

This is where Charlotte really shines. The city is full of transplants, so nobody thinks it's weird when you introduce yourself as "new here."

### Join a Group
- **Charlotte Sports League** — Kickball, volleyball, softball, and more. Teams are designed for individuals to join, so you don't need to know anyone.
- **Meetup.com** — Charlotte has active groups for hiking, board games, young professionals, book clubs, and more.
- **CLT Transplants** (Facebook group) — Thousands of members, regular meetups, and a great resource for questions.
- **Your apartment/neighborhood** — Many Charlotte apartments have resident events. Actually go to them.

### Attend an Event
Charlotte always has something going on:
- **First Friday in NoDa** — Monthly art walk with open galleries, live music, and food trucks
- **South End Gallery Crawl** — Quarterly art event along the Rail Trail
- **Charlotte FC or Hornets game** — Even if you're not a sports fan, the atmosphere is worth experiencing
- **Food truck Fridays** — Various locations around the city

### Start Your CLT Passport
Seriously — use our [CLT Passport](/passport) to track where you've been. It gamifies exploration and gives you a reason to try new places every week. Complete a bingo card and you'll know the city better than people who've lived here for years.

---

## Week 4: Go Deeper

By now you should have a routine, a few favorite spots, and maybe even a friend or two. Time to go deeper.

### Take a Day Trip
- **U.S. National Whitewater Center** — Even if you're not outdoorsy, spend a day here. The trails alone are worth it, and watching people attempt the whitewater course is free entertainment.
- **Lake Norman** — 30 minutes north. Rent a kayak or paddleboard, or just find a lakeside restaurant.
- **Crowders Mountain** — 45 minutes west. An easy-to-moderate hike with incredible views of the Charlotte skyline on clear days.

### Try the Food Scene Seriously
Move beyond your immediate neighborhood and try:
- **Optimist Hall** — Food hall in a converted textile mill. 20+ vendors, something for everyone.
- **Camp North End** — Charlotte's coolest adaptive reuse project. Restaurants, bars, art, and events in a former Ford factory.
- **Your neighborhood's best restaurant** — Ask a local. Every neighborhood has a hidden gem that doesn't show up on "Best of Charlotte" lists.

### Understand the City's Geography
Charlotte is organized around I-485 (the outer loop) and I-77/I-85 (the main highways). Key mental model:
- **Inside I-485** = urban Charlotte
- **Outside I-485** = suburbs (Huntersville, Matthews, Mint Hill, etc.)
- **The Blue Line** runs from I-485 (south) through South End to Uptown to UNC Charlotte (north)
- **Independence Blvd** goes east, **Freedom Drive** goes west, **South Blvd** goes south

---

## You're Not New Anymore

After 30 days, you'll have a driver's license, a coffee shop, a gym, a few favorite restaurants, and hopefully some people to text on a Friday night. Charlotte won't feel like home yet — that takes 3-6 months — but it'll feel like *your city*.

The best advice? Say yes to everything for the first three months. Every invitation, every event, every "you should check out..." recommendation. Charlotte rewards curiosity.

Welcome home. 🐝

---

*Track your Charlotte exploration with the [CLT Passport](/passport), or browse our [directory](/directory) for trusted local services.*`,
  },
  {
    title: "Charlotte's Hidden Gems: 15 Places Locals Don't Want You to Know About",
    slug: "charlotte-hidden-gems",
    category: "Local Guide",
    readTime: "5 min read",
    excerpt: "Skip the tourist traps. These are the spots that Charlotte locals actually go to — from secret patios to under-the-radar restaurants.",
    content: `# Charlotte's Hidden Gems: 15 Places Locals Don't Want You to Know About

Every Charlotte "best of" list features the same places: Amelie's, Optimist Hall, the Whitewater Center. And they're great — they made the list for a reason. But the real Charlotte? The spots that locals guard jealously and only share with people they actually like? Those are harder to find.

Until now. Here are 15 places that Charlotte regulars don't want going viral.

---

## Food & Drink

### 1. Pho Hoa & Jalapeno (East Charlotte)
Forget the trendy pho spots in South End. This strip-mall gem on Central Avenue serves the best pho in Charlotte, and it's not even close. The broth has been simmering since before you woke up. Cash only, no frills, incredible food. This is what East Charlotte's international food corridor is all about.

### 2. Lupie's Cafe (Midtown)
A Charlotte institution since 1987 that somehow flies under the radar of every "best of" list. The chili is legendary (they have 8 varieties), the meatloaf is your grandmother's recipe but better, and the prices haven't caught up to 2025 yet. Closed on weekends, which is part of its charm.

### 3. The Cellar at Duckworth's (Uptown)
Most people know Duckworth's as a sports bar. But downstairs, there's a speakeasy-style cocktail bar with craft cocktails, dim lighting, and a completely different vibe. It's the best-kept secret in Uptown for a date night or a quiet drink.

### 4. Tacos El Nevado (Multiple Locations)
The taco trucks parked along South Boulevard and Central Avenue serve better tacos than any sit-down Mexican restaurant in Charlotte. Tacos El Nevado is the gold standard — $2 street tacos with handmade tortillas, fresh cilantro, and salsas that'll make you sweat. Look for the truck near the South End LYNX station.

### 5. Futo Buta (South End)
Not exactly hidden, but criminally underrated. This ramen shop serves some of the best bowls in the Southeast. The tonkotsu broth is rich and complex, the pork belly melts in your mouth, and the soft-boiled egg is always perfect. Go on a weeknight to avoid the wait.

---

## Outdoors & Nature

### 6. Reedy Creek Nature Preserve
Everyone goes to the Whitewater Center or Freedom Park. Meanwhile, Reedy Creek sits quietly in east Charlotte with 10+ miles of trails through old-growth forest, zero crowds, and some of the best bird-watching in the metro area. The Robinson Church Road entrance is the least busy.

### 7. The Little Sugar Creek Greenway (Full Length)
Most people only walk the South End section. But the full greenway runs 19 miles from Cordelia Park through Midtown, South End, and all the way to Pineville. The section through Freedom Park and behind the Nature Museum is gorgeous and rarely crowded.

### 8. McDowell Nature Preserve
On the shores of Lake Wylie, 20 minutes from Uptown. Hiking trails, a beach, kayak rentals, and camping — all within Charlotte city limits. The sunset from the lake overlook is one of the best views in the metro area, and most Charlotteans have never been.

### 9. The Birkdale Village Green (Huntersville)
A perfectly manicured green space surrounded by shops and restaurants in Huntersville. On summer evenings, they have free outdoor concerts and movie nights. It's the suburban Charlotte experience at its best — families, dogs, and zero stress.

---

## Culture & Experiences

### 10. Camp North End's Back Alleys
Everyone visits the main Camp North End food hall, but the real magic is in the back buildings and alleys. There are artist studios, pop-up galleries, and small workshops that change monthly. Wander without a plan and you'll discover something new every time.

### 11. The Mint Museum Randolph (Free on Wednesdays)
Charlotte's oldest art museum, housed in the original U.S. Mint building. The permanent collection is excellent (especially the ceramics and American art), and Wednesday evenings are free admission. The gardens are beautiful and rarely photographed.

### 12. NoDa's Alley Art
The main NoDa murals get all the Instagram attention, but the real art is in the alleys between 36th Street and North Davidson. Local artists have been painting these walls for decades, and the work is raw, political, and constantly evolving. Walk slowly and look up.

### 13. The Charlotte Rail Trail
Not the Blue Line — the Rail Trail is a 3.5-mile walking and biking path that runs parallel to the light rail through South End. It's lined with public art installations, murals, and sculptures that most people walk right past. Download the Rail Trail art guide from the city's website for the full experience.

---

## Shopping & Markets

### 14. The Charlotte Regional Farmers Market
The Saturday morning farmers market at the Charlotte Regional Farmers Market (off Yorkmont Road) is the real deal — actual farmers selling actual produce, not the curated Instagram-friendly markets. Prices are lower, selection is better, and you'll find produce varieties you've never seen at Harris Teeter.

### 15. Sleepy Poet Antique Mall
A massive antique mall on South Boulevard with over 100 vendors. It's overwhelming in the best way — vintage furniture, vinyl records, old signs, mid-century modern pieces, and genuine antiques. Plan to spend at least two hours. The prices are negotiable if you ask nicely.

---

## The Real Secret

The best hidden gems in Charlotte aren't places — they're the people who show them to you. Join a running club, talk to your barista, say yes to that coworker's invite. Charlotte's best experiences come from the community, not the guidebook.

But these 15 spots are a pretty good start.

---

*Found a hidden gem we missed? Share it in the comments on the [neighborhood page](/neighborhoods), or [submit it to our directory](/list-your-business). And track your discoveries on your [CLT Passport](/passport).*`,
  },
];

console.log(`\n📝 Seeding ${articles.length} blog articles...\n`);

for (const article of articles) {
  try {
    await db.insert(blogPosts).values({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      coverImage: null,
      authorId: 1,
      status: 'published',
      readTime: article.readTime,
      publishedAt: new Date(),
    });
    console.log(`✅ ${article.title}`);
  } catch (err) {
    if (err.message?.includes('Duplicate')) {
      console.log(`⏭️  ${article.title} — already exists`);
    } else {
      console.log(`❌ ${article.title} — ${err.message}`);
    }
  }
}

console.log(`\n📊 Blog seeding complete!\n`);
await pool.end();
process.exit(0);
