import { useMemo } from "react";
import { Link, useParams } from "wouter";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  ExternalLink,
  Navigation,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import {
  useStructuredData,
  buildBreadcrumbSchema,
  buildEventSchema,
} from "@/hooks/useStructuredData";
import { SEED_EVENTS, EVENT_CATEGORIES, type SeedEvent } from "@shared/events";

// --- SEO metadata per recurring category ---
const CATEGORY_SEO: Record<
  string,
  { title: string; description: string; keywords: string; h1: string; intro: string }
> = {
  "run-walk": {
    title: "Charlotte Run Clubs & Walking Groups | Settle CLT",
    description:
      "Find Charlotte run clubs, walking groups, and community fitness meetups. Weekly and monthly recurring events for all paces.",
    keywords:
      "Charlotte run clubs, Charlotte running groups, Charlotte walking groups, Charlotte running events, Charlotte fitness meetups",
    h1: "Charlotte Run Clubs & Walking Groups",
    intro:
      "Looking for a Charlotte run club or walking group? The Queen City has a thriving community of runners and walkers of all paces. From weekly group runs at local shops to casual greenway walks, find your crew and explore Charlotte on foot.",
  },
  "yoga-fitness": {
    title: "Charlotte Free Yoga & Outdoor Fitness | Settle CLT",
    description:
      "Free and low-cost yoga classes in Charlotte parks and studios. Recurring weekly outdoor yoga for all levels.",
    keywords:
      "Charlotte free yoga, Charlotte outdoor yoga, Charlotte yoga classes, Charlotte fitness classes, Charlotte park yoga",
    h1: "Charlotte Free Yoga & Outdoor Fitness",
    intro:
      "Roll out your mat at parks across Charlotte with free and low-cost yoga classes. From Freedom Park to the Mint Museum lawn, these recurring weekly sessions welcome all levels — no experience or fancy gear required.",
  },
  "farmers-markets": {
    title: "Charlotte Farmers Markets by Neighborhood | Settle CLT",
    description:
      "Year-round and seasonal farmers markets across Charlotte. Find fresh produce, local goods, and community markets near you.",
    keywords:
      "Charlotte farmers markets, Charlotte farmers market, farmers markets near me, Charlotte local produce, Charlotte markets",
    h1: "Charlotte Farmers Markets by Neighborhood",
    intro:
      "From the year-round Charlotte Regional Farmers Market to seasonal neighborhood markets in Matthews, Cornelius, and South End, browse every recurring farmers market in the Charlotte area. Fresh produce, local artisans, and community vibes — all in one place.",
  },
  "game-nights": {
    title: "Charlotte Game Nights & Trivia | Settle CLT",
    description:
      "Weekly board game nights, trivia, and social gaming events across Charlotte. Find a game night near you.",
    keywords:
      "Charlotte game nights, Charlotte trivia nights, Charlotte board games, Charlotte social gaming, Charlotte pub trivia",
    h1: "Charlotte Game Nights & Trivia",
    intro:
      "Charlotte's game night scene is buzzing — from weekly board game meetups at local breweries to trivia nights at 70+ venues across the city. Grab your friends (or come solo) and find a recurring game night near you.",
  },
  veteran: {
    title: "Charlotte Veteran & Military Community Events | Settle CLT",
    description:
      "Recurring veteran community events, resources, and gatherings in Charlotte, NC.",
    keywords:
      "Charlotte veteran events, Charlotte military events, Charlotte veteran community, veteran events Charlotte NC, Charlotte VA events",
    h1: "Charlotte Veteran & Military Community Events",
    intro:
      "Connect with Charlotte's veteran and military community at recurring events, resource fairs, and gatherings across the region. From benefits outreach to community meetups, find support and camaraderie in the Queen City.",
  },
  "music-jam": {
    title: "Charlotte Live Music & Open Mic Nights | Settle CLT",
    description:
      "Weekly open mic nights, jazz sessions, and live music recurring events in Charlotte.",
    keywords:
      "Charlotte open mic, Charlotte live music, Charlotte jazz nights, Charlotte music events, Charlotte open mic nights",
    h1: "Charlotte Live Music & Open Mic Nights",
    intro:
      "Charlotte's live music scene comes alive every week with open mic nights, jazz sessions, and recurring live music events. From the intimate stage at The Evening Muse to seasonal jazz concert series, discover where Charlotte's musicians play.",
  },
  "kids-storytime": {
    title: "Charlotte Storytime & Kids Events | Settle CLT",
    description:
      "Free library storytimes and kids event programs across Charlotte branches.",
    keywords:
      "Charlotte storytime, Charlotte kids events, Charlotte library storytime, Charlotte children events, Charlotte storytime near me",
    h1: "Charlotte Storytime & Kids Events",
    intro:
      "Free storytimes and kids programs at Charlotte Mecklenburg Library branches across the city. Browse recurring weekly storytime sessions designed for young children and find a program near your neighborhood.",
  },
  meditation: {
    title: "Charlotte Meditation & Mindfulness Groups | Settle CLT",
    description:
      "Weekly meditation and mindfulness groups in Charlotte. Free and low-cost sessions for all levels.",
    keywords:
      "Charlotte meditation, Charlotte mindfulness, Charlotte meditation groups, Charlotte meditation classes, Charlotte mindfulness groups",
    h1: "Charlotte Meditation & Mindfulness Groups",
    intro:
      "Find your calm with weekly meditation and mindfulness groups across Charlotte. From Insight Meditation Community gatherings to Kadampa Center classes, these recurring sessions welcome beginners and experienced practitioners alike.",
  },
  "dog-meetups": {
    title: "Charlotte Dog Meetups & Dog Walks | Settle CLT",
    description:
      "Recurring dog meetups, breed gatherings, and community dog walks in Charlotte.",
    keywords:
      "Charlotte dog meetups, Charlotte dog walks, Charlotte dog groups, Charlotte dog events, Charlotte breed meetups",
    h1: "Charlotte Dog Meetups & Dog Walks",
    intro:
      "Socialize your pup at Charlotte's recurring dog meetups and community dog walks. From breed-specific gatherings at Skiptown to monthly group walks on Charlotte's nature preserves, find the perfect playdate for your dog.",
  },
  "makers-crafts": {
    title: "Charlotte Makers Markets & Craft Events | Settle CLT",
    description:
      "Recurring makers markets, craft fairs, and artisan events in Charlotte.",
    keywords:
      "Charlotte makers market, Charlotte craft fairs, Charlotte artisan events, Charlotte craft markets, Charlotte makers events",
    h1: "Charlotte Makers Markets & Craft Events",
    intro:
      "Shop local at Charlotte's recurring makers markets and craft events. From monthly artisan markets at Fonta Flora Brewing to First Friday handcrafted markets in Pineville, discover handmade goods from Charlotte's creative community.",
  },
};

// Category colors (kept in sync with Events.tsx)
const CATEGORY_COLORS: Record<string, string> = {
  "run-walk": "bg-red-100 text-red-800 border-red-200",
  "yoga-fitness": "bg-lime-100 text-lime-800 border-lime-200",
  "farmers-markets": "bg-green-100 text-green-800 border-green-200",
  "game-nights": "bg-violet-100 text-violet-800 border-violet-200",
  veteran: "bg-blue-100 text-blue-800 border-blue-200",
  "music-jam": "bg-purple-100 text-purple-800 border-purple-200",
  "kids-storytime": "bg-cyan-100 text-cyan-800 border-cyan-200",
  meditation: "bg-slate-100 text-slate-800 border-slate-200",
  "dog-meetups": "bg-orange-100 text-orange-800 border-orange-200",
  "makers-crafts": "bg-pink-100 text-pink-800 border-pink-200",
};

const CATEGORY_EMOJI: Record<string, string> = {
  "run-walk": "🏃",
  "yoga-fitness": "🧘",
  "farmers-markets": "🥕",
  "game-nights": "🎲",
  veteran: "🎖️",
  "music-jam": "🎵",
  "kids-storytime": "📚",
  meditation: "🧠",
  "dog-meetups": "🐕",
  "makers-crafts": "🎨",
};

const COST_LABELS: Record<string, string> = {
  free: "Free",
  paid: "Paid",
  mixed: "Free–Paid",
};

function getCategoryName(categoryId: string): string {
  return EVENT_CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId;
}

function EventListItem({ event }: { event: SeedEvent }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 hover:border-primary/20">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-display font-bold text-lg text-foreground line-clamp-2">
          {event.name}
        </h3>
        <Badge
          variant="outline"
          className={`text-xs font-medium shrink-0 ${CATEGORY_COLORS[event.category] ?? "bg-gray-100 text-gray-800"}`}
        >
          {CATEGORY_EMOJI[event.category]} {getCategoryName(event.category)}
        </Badge>
      </div>

      <div className="space-y-2 mb-3">
        {event.recurringPattern && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary/70 shrink-0" />
            <span>{event.recurringPattern}</span>
          </div>
        )}
        {event.venue && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
            <span className="truncate">{event.venue}</span>
            {event.venueArea && (
              <span className="text-muted-foreground/60">· {event.venueArea}</span>
            )}
          </div>
        )}
        {event.neighborhood && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="w-4 h-4 text-primary/70 shrink-0" />
            <span>{event.neighborhood}</span>
          </div>
        )}
      </div>

      {event.description && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {event.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-border/60">
        <div className="flex items-center gap-2 flex-wrap">
          {event.cost && (
            <Badge variant="secondary" className="text-xs">
              {COST_LABELS[event.cost] ?? event.cost}
            </Badge>
          )}
          {event.newcomerFriendly && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              🌟 Newcomer Friendly
            </Badge>
          )}
        </div>
        {event.sourceUrl && (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            More Info
          </a>
        )}
      </div>
    </div>
  );
}

export default function EventCategoryPage() {
  const params = useParams<{ categoryId: string }>();
  const categoryId = params.categoryId ?? "";

  const seo = CATEGORY_SEO[categoryId];
  const categoryName = getCategoryName(categoryId);
  const categoryEmoji = CATEGORY_EMOJI[categoryId] ?? "📅";

  // Filter SEED_EVENTS by this category — prefer recurring events first
  const categoryEvents = useMemo(() => {
    const all = SEED_EVENTS.filter((e) => e.category === categoryId);
    // Sort recurring events first, then by name
    return all.sort((a, b) => {
      if (a.type === "recurring" && b.type !== "recurring") return -1;
      if (a.type !== "recurring" && b.type === "recurring") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [categoryId]);

  const recurringCount = categoryEvents.filter((e) => e.type === "recurring").length;
  const freeCount = categoryEvents.filter((e) => e.cost === "free").length;

  // SEO — use a safe fallback if category is not in the SEO mapping
  const seoTitle = seo?.title ?? `${categoryName} in Charlotte | Settle CLT`;
  const seoDescription =
    seo?.description ??
    `Find ${categoryName.toLowerCase()} and recurring events in Charlotte, NC.`;
  const seoKeywords = seo?.keywords ?? `Charlotte ${categoryName.toLowerCase()}`;
  const h1 = seo?.h1 ?? `${categoryName} in Charlotte`;
  const intro =
    seo?.intro ??
    `Browse ${categoryName.toLowerCase()} and recurring community events across Charlotte, NC.`;

  useSEO({
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    path: `/events/category/${categoryId}`,
  });

  // Breadcrumb + Event structured data
  const structuredData = useMemo(() => {
    const crumbs = {
      "@context": "https://schema.org",
      ...buildBreadcrumbSchema([
        { name: "Home", url: "https://settleclt.com" },
        { name: "Events", url: "https://settleclt.com/events" },
        { name: categoryName, url: `https://settleclt.com/events/category/${categoryId}` },
      ]),
    };
    // Inject up to 10 event schemas for the category
    const eventSchemas = categoryEvents.slice(0, 10).map((e) => ({
      "@context": "https://schema.org",
      ...buildEventSchema({
        title: e.name,
        description: e.description ?? undefined,
        startDate: e.startDate ?? new Date().toISOString(),
        endDate: e.endDate,
        venueName: e.venue ?? null,
        venueAddress: null,
        externalUrl: e.sourceUrl,
        imageUrl: null,
      }),
    }));
    return [crumbs, ...eventSchemas];
  }, [categoryId, categoryName, categoryEvents]);

  useStructuredData(structuredData);

  // If category doesn't exist, show a not-found-style message
  const isValidCategory = EVENT_CATEGORIES.some((c) => c.id === categoryId);

  if (!isValidCategory) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">
            Category Not Found
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            We couldn't find the event category "{categoryId}". Browse all
            Charlotte events instead.
          </p>
          <Link href="/events">
            <Button className="gap-2">
              <ArrowRight className="w-4 h-4" />
              Explore All Events
            </Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Breadcrumb */}
      <nav className="container pt-4 pb-2">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
          </li>
          <ChevronRight className="w-3.5 h-3.5" />
          <li>
            <Link href="/events" className="hover:text-primary transition-colors">
              Events
            </Link>
          </li>
          <ChevronRight className="w-3.5 h-3.5" />
          <li className="text-foreground font-medium">{categoryName}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-14 sm:py-18">
        <div className="container">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              <span className="mr-1.5">{categoryEmoji}</span>
              {categoryName}
            </Badge>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-foreground mb-4">
              {h1}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {intro}
            </p>

            {/* Quick stats */}
            {categoryEvents.length > 0 && (
              <div className="mt-6 flex items-center gap-4 flex-wrap text-sm">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  {categoryEvents.length} event{categoryEvents.length !== 1 ? "s" : ""}
                </Badge>
                {recurringCount > 0 && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {recurringCount} recurring
                  </Badge>
                )}
                {freeCount > 0 && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0">
                    {freeCount} free
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Events List */}
      <div className="container py-10">
        {categoryEvents.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">
              No events in this category yet
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              We're still gathering {categoryName.toLowerCase()} events for
              Charlotte. Check back soon or explore all events.
            </p>
            <Link href="/events">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="w-4 h-4" />
                Explore All Events
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryEvents.map((event) => (
                <EventListItem key={event.slug} event={event} />
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-8 text-center">
              <h2 className="font-display font-bold text-2xl text-foreground mb-2">
                Explore More Charlotte Events
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-4">
                Discover festivals, concerts, food events, and everything
                happening in the Queen City.
              </p>
              <Link href="/events">
                <Button className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Browse All Charlotte Events
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
