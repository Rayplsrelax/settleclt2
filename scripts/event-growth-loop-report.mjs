import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const EVENT_CATEGORIES = [
  "concerts",
  "food-drink",
  "sports",
  "arts-culture",
  "festivals",
  "family",
  "nightlife",
  "free",
  "markets",
  "community",
];

const WEEKLY_SOURCES = [
  "Settle CLT event submissions",
  "Charlotte Center City Partners calendar",
  "Blumenthal Performing Arts calendar",
  "Neighborhood brewery/venue calendars",
  "Sports team home schedules",
  "Library and city community calendars",
  "Markets/pop-up Instagram pages",
];

function nextFriday(date = new Date()) {
  const result = new Date(date);
  const day = result.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  result.setDate(result.getDate() + daysUntilFriday);
  result.setHours(9, 0, 0, 0);
  return result;
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

const publishDate = nextFriday();
const slugDate = publishDate.toISOString().slice(0, 10);

const lines = [];
lines.push("# Settle CLT Event Growth Loop");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("Use this every week to keep `/events`, `charlotteweekendevents.com`, and event-related SEO fresh.");
lines.push("");
lines.push("## Weekly schedule");
lines.push("");
lines.push("| Day | Action | Outcome |");
lines.push("|---|---|---|");
lines.push("| Monday | Audit past/current events | Remove stale, archive old, identify empty categories |");
lines.push("| Tuesday | Add/verify upcoming weekend events | Publish at least 10 useful events |");
lines.push("| Wednesday | Draft weekend roundup | Blog/social/email content ready |");
lines.push("| Thursday | Promote + internal link | Link `/events`, `/things-to-do`, category pages, and microsites |");
lines.push("| Friday | Publish weekend guide | Target 'things to do this weekend in Charlotte' intent |");
lines.push("");
lines.push("## Event source checklist");
lines.push("");
for (const source of WEEKLY_SOURCES) lines.push(`- [ ] ${source}`);
lines.push("");
lines.push("## Category freshness targets");
lines.push("");
lines.push("Each week, try to have at least one live/current event in these categories:");
lines.push("");
for (const category of EVENT_CATEGORIES) lines.push(`- [ ] ${category}`);
lines.push("");
lines.push("## Weekend roundup template");
lines.push("");
lines.push(`Suggested blog slug: \`charlotte-weekend-events-${slugDate}\``);
lines.push("");
lines.push(`Suggested title: \`Charlotte Weekend Events: Things to Do ${formatDate(publishDate)}\``);
lines.push("");
lines.push("Suggested structure:");
lines.push("");
lines.push("1. 2-paragraph intro for weekend intent.");
lines.push("2. Best free events.");
lines.push("3. Food/drink and markets.");
lines.push("4. Concerts/live music/nightlife.");
lines.push("5. Family/kids picks.");
lines.push("6. Sports and outdoor options.");
lines.push("7. CTA to `/events` and `/things-to-do`.");
lines.push("8. CTA for venues/businesses to submit or sponsor events.");
lines.push("");
lines.push("## Sponsor package prompt");
lines.push("");
lines.push("Offer this once events traffic starts moving:");
lines.push("");
lines.push("- Weekend Event Sponsor: $99/week");
lines.push("- Category Sponsor: $149/month for food/drink, nightlife, family, or free events");
lines.push("- Featured Event Boost: $25/event");
lines.push("");
lines.push("## Internal links to add");
lines.push("");
lines.push("- `/events`");
lines.push("- `/things-to-do`");
lines.push("- `/business-pricing`");
lines.push("- `https://charlotteweekendevents.com` once live");
lines.push("");
lines.push("## Measurement checklist");
lines.push("");
lines.push("- [ ] Mixpanel: Event Action — event_view");
lines.push("- [ ] Mixpanel: Event Action — external_event_click");
lines.push("- [ ] Mixpanel: Event Action — submit_event_click");
lines.push("- [ ] Search Console: queries containing `charlotte events`, `things to do`, `this weekend`, `free events`");
lines.push("- [ ] Microsite source: `utm_source=charlotteweekendevents.com`");
lines.push("");
lines.push("## Admin event quality checklist");
lines.push("");
lines.push("Before publishing an event, verify:");
lines.push("");
lines.push("- [ ] Clear event title");
lines.push("- [ ] Start date/time");
lines.push("- [ ] Venue name");
lines.push("- [ ] Neighborhood or area");
lines.push("- [ ] External URL");
lines.push("- [ ] Useful description with who it is for");
lines.push("- [ ] Category is accurate");
lines.push("- [ ] Featured only if it is important, sponsored, or high-value");

const outputPath = resolve("docs/seo/EVENT_GROWTH_LOOP.md");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outputPath}`);
console.log(`event_categories=${EVENT_CATEGORIES.length}`);
console.log(`weekly_sources=${WEEKLY_SOURCES.length}`);
