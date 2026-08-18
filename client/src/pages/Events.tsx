import { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import type { EventPromotionLevel } from "@shared/event-promotions";
import {
  Calendar,
  CalendarPlus,
  MapPin,
  ExternalLink,
  Clock,
  Filter,
  Tag,
  Navigation,
  Search,
  X,
  CalendarRange,
} from "lucide-react";
import PageLayout from "@/components/PageLayout";
import ShareButtons from "@/components/ShareButtons";
import QuickStampButton from "@/components/QuickStampButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTagTrackingWithLookup } from "@/hooks/useTagTracking";
import { useSEO } from "@/hooks/useSEO";
import { trackEventAction } from "@/lib/mixpanel";
import {
  useStructuredData,
  buildEventSchema,
  buildBreadcrumbSchema,
} from "@/hooks/useStructuredData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n/I18nContext";
import { formatLocalizedDate } from "@/i18n/formatters";
import type { Locale } from "@shared/i18n";

const CATEGORIES = [
  { value: "", label: "All Events" },
  { value: "concerts", label: "Concerts & Music" },
  { value: "food-drink", label: "Food & Drink" },
  { value: "sports", label: "Sports" },
  { value: "arts-culture", label: "Arts & Culture" },
  { value: "festivals", label: "Festivals" },
  { value: "family", label: "Family & Kids" },
  { value: "nightlife", label: "Nightlife" },
  { value: "free", label: "Free Events" },
  { value: "markets", label: "Markets & Pop-ups" },
  { value: "community", label: "Community" },
  // Recurring community event categories
  { value: "run-walk", label: "Run & Walk Clubs" },
  { value: "yoga-fitness", label: "Yoga & Fitness" },
  { value: "farmers-markets", label: "Farmers Markets" },
  { value: "game-nights", label: "Game Nights & Trivia" },
  { value: "veteran", label: "Veteran & Military" },
  { value: "music-jam", label: "Live Music & Open Mic" },
  { value: "kids-storytime", label: "Kids & Storytime" },
  { value: "meditation", label: "Meditation & Mindfulness" },
  { value: "dog-meetups", label: "Dog Meetups" },
  { value: "makers-crafts", label: "Makers & Crafts" },
  { value: "neighborhood", label: "Neighborhood Events" },
  { value: "professional", label: "Professional & Networking" },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  concerts: "bg-purple-100 text-purple-800 border-purple-200",
  "food-drink": "bg-orange-100 text-orange-800 border-orange-200",
  sports: "bg-blue-100 text-blue-800 border-blue-200",
  "arts-culture": "bg-pink-100 text-pink-800 border-pink-200",
  festivals: "bg-yellow-100 text-yellow-800 border-yellow-200",
  family: "bg-green-100 text-green-800 border-green-200",
  nightlife: "bg-indigo-100 text-indigo-800 border-indigo-200",
  free: "bg-emerald-100 text-emerald-800 border-emerald-200",
  markets: "bg-amber-100 text-amber-800 border-amber-200",
  community: "bg-teal-100 text-teal-800 border-teal-200",
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
  neighborhood: "bg-teal-100 text-teal-800 border-teal-200",
  professional: "bg-gray-100 text-gray-800 border-gray-200",
};

const CATEGORY_EMOJI: Record<string, string> = {
  concerts: "🎵",
  "food-drink": "🍽️",
  sports: "⚽",
  "arts-culture": "🎨",
  festivals: "🎪",
  family: "👨‍👩‍👧‍👦",
  nightlife: "🌙",
  free: "🆓",
  markets: "🛍️",
  community: "🤝",
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
  neighborhood: "📍",
  professional: "🤝",
};

const CHARLOTTE_TIME_ZONE = "America/New_York";

function parseEventDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(
  date: Date | string | null | undefined,
  locale: Locale,
  fallback: string
) {
  const d = parseEventDate(date);
  if (!d) return fallback;
  return formatLocalizedDate(d, locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: CHARLOTTE_TIME_ZONE,
  });
}

function formatTime(
  date: Date | string | null | undefined,
  locale: Locale,
  fallback: string
) {
  const d = parseEventDate(date);
  if (!d) return fallback;
  return formatLocalizedDate(d, locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: CHARLOTTE_TIME_ZONE,
  });
}

function formatFullDate(
  date: Date | string | null | undefined,
  locale: Locale,
  fallback: string
) {
  const d = parseEventDate(date);
  if (!d) return fallback;
  return formatLocalizedDate(d, locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: CHARLOTTE_TIME_ZONE,
  });
}

function getCategoryLabel(value: string) {
  return CATEGORIES.find(c => c.value === value)?.label ?? value;
}

type EventType = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  venueName: string | null;
  venueAddress: string | null;
  neighborhood: string | null;
  externalUrl: string | null;
  imageUrl: string | null;
  category: string;
  isFeatured: string;
  isRecurring: string;
};

const PROMOTED_STYLES: Record<EventPromotionLevel, string> = {
  boost: "bg-amber-100 text-amber-900",
  spotlight: "bg-violet-100 text-violet-900",
  headliner: "bg-yellow-100 text-yellow-900",
};

function EventCard({
  event,
  onClick,
  onCategoryClick,
  onNeighborhoodClick,
  promoted,
}: {
  event: EventType;
  onClick: () => void;
  onCategoryClick?: (category: string) => void;
  onNeighborhoodClick?: (neighborhood: string) => void;
  promoted?: { level: EventPromotionLevel; customHeadline?: string | null; sponsorMessage?: string | null; organizerLogoUrl?: string | null } | null;
}) {
  const { locale, t } = useI18n();
  return (
    <button
      onClick={onClick}
      className="group text-left w-full rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden border-border bg-card hover:border-primary/20"
    >
      {event.imageUrl && (
        <div className="h-40 overflow-hidden">
          <img
            loading="lazy"
            src={event.imageUrl}
            alt={`${event.title} - Charlotte NC event`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {promoted && (
              <Badge
                className={`text-xs font-semibold border border-amber-300 ${PROMOTED_STYLES[promoted.level] ?? PROMOTED_STYLES.boost}`}
              >
                ★ Promoted
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-xs font-medium ${CATEGORY_COLORS[event.category] ?? "bg-gray-100 text-gray-800"}`}
            >
              {CATEGORY_EMOJI[event.category]}{" "}
              {getCategoryLabel(event.category)}
            </Badge>
          </div>
          <QuickStampButton
            eventSlug={event.slug}
            area={event.neighborhood ?? undefined}
          />
        </div>

        <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {promoted?.customHeadline || event.title}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
            <span>{formatDate(event.startDate, locale, t("events.dateTba"))}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>{formatTime(event.startDate, locale, t("events.timeTba"))}</span>
          </div>
          {event.venueName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
              <span className="truncate">{event.venueName}</span>
              {event.venueAddress && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.venueAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium no-underline transition-colors shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <Navigation className="w-3 h-3" /> {t("events.directions")}
                </a>
              )}
            </div>
          )}
          {event.neighborhood && (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors"
              onClick={e => {
                e.stopPropagation();
                onNeighborhoodClick?.(event.neighborhood!);
              }}
            >
              <Tag className="w-4 h-4 text-primary/70 shrink-0" />
              <span>{event.neighborhood}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
    </button>
  );
}

export default function Events() {
  const { locale, t } = useI18n();
  useSEO({
    title: "Charlotte Events This Week & Weekend: Things to Do in CLT (2026)",
    description:
      "Your complete Charlotte events calendar. Find concerts, festivals, sports, food events, family activities, and things to do in Charlotte NC this week and weekend.",
    keywords:
      "Charlotte events, events in Charlotte NC, things to do in Charlotte this weekend, Charlotte events this weekend, Charlotte concerts, Charlotte festivals, what to do in Charlotte",
    path: "/events",
  });

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [newcomerFriendlyOnly, setNewcomerFriendlyOnly] = useState(false);
  const { trackClickByName } = useTagTrackingWithLookup();

  const { data: allEvents, isLoading } = trpc.events.getPublished.useQuery({
    includeExpired: true,
    ...(selectedCategory ? { category: selectedCategory } : {}),
  });

  const { data: promotedRows } = trpc.events.promoted.useQuery();
  const promotedBySlug = useMemo(() => {
    const map = new Map<string, { level: EventPromotionLevel; customHeadline?: string | null; sponsorMessage?: string | null; organizerLogoUrl?: string | null }>();
    for (const row of promotedRows ?? []) {
      if (row.slug) map.set(row.slug, row);
    }
    return map;
  }, [promotedRows]);

  // Promoted events surface first
  const events = useMemo(() => {
    const list = allEvents ?? [];
    return [...list].sort((a, b) => {
      const pa = promotedBySlug.has(a.slug) ? 1 : 0;
      const pb = promotedBySlug.has(b.slug) ? 1 : 0;
      return pb - pa;
    });
  }, [allEvents, promotedBySlug]);

  // Auto-open event from URL query param (e.g., /events?highlight=event-slug)
  useEffect(() => {
    if (!allEvents || allEvents.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const highlightSlug = params.get("highlight");
    const highlightId = params.get("event");
    if (highlightSlug) {
      const found = allEvents.find(
        (e: any) => e.slug === highlightSlug || String(e.id) === highlightSlug
      );
      if (found) setSelectedEvent(found as EventType);
    } else if (highlightId) {
      const found = allEvents.find((e: any) => String(e.id) === highlightId);
      if (found) setSelectedEvent(found as EventType);
    }
  }, [allEvents]);

  // Structured data for events (inject top 10 upcoming events as schema)
  const eventsForSchema = useMemo(() => {
    if (!allEvents) return null;
    const now = new Date();
    const upcoming = allEvents
      .filter(e => (e.startDate ? new Date(e.startDate) >= now : false))
      .slice(0, 10);
    if (upcoming.length === 0) return null;
    return [
      {
        "@context": "https://schema.org",
        ...buildBreadcrumbSchema([
          { name: "Home", url: "https://settleclt.com" },
          { name: "Events", url: "https://settleclt.com/events" },
        ]),
      },
      ...upcoming.map(e => ({
        "@context": "https://schema.org",
        ...buildEventSchema({
          title: e.title || e.name || "Untitled Event",
          description: e.description ?? undefined,
          startDate: e.startDate || e.startDateStr || "",
          endDate: e.endDate,
          venueName: e.venueName,
          venueAddress: e.venueAddress,
          externalUrl: e.externalUrl,
          imageUrl: e.imageUrl,
        }),
      })),
    ];
  }, [allEvents]);
  useStructuredData(eventsForSchema);

  const hasActiveFilters =
    searchQuery || dateFrom || dateTo || recurringOnly || newcomerFriendlyOnly;

  const openEvent = useCallback((event: EventType, surface: string) => {
    trackEventAction("event_view", {
      event_slug: event.slug,
      event_title: event.title,
      category: event.category,
      neighborhood: event.neighborhood || undefined,
      venue_name: event.venueName,
      surface,
    });
    setSelectedEvent(event);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setSelectedCategory("");
    setRecurringOnly(false);
    setNewcomerFriendlyOnly(false);
  }, []);

  // Apply search and date filters
  const filteredEvents = useMemo(() => {
    let result = [...events];
    if (recurringOnly) {
      result = result.filter(
        (e: any) => e.type === "recurring" || e.isRecurring === "yes"
      );
    }
    if (newcomerFriendlyOnly) {
      result = result.filter((e: any) => e.newcomerFriendly === true);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        e =>
          (e.title || e.name || "").toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.neighborhood && e.neighborhood.toLowerCase().includes(q)) ||
          (e.venueName || e.venue || "").toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(e =>
        e.startDate ? new Date(e.startDate) >= from : false
      );
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(e =>
        e.startDate ? new Date(e.startDate) <= to : false
      );
    }
    return result;
  }, [
    events,
    searchQuery,
    dateFrom,
    dateTo,
    recurringOnly,
    newcomerFriendlyOnly,
  ]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents.filter(event => {
      const start = parseEventDate(event.startDate);
      const end = parseEventDate(event.endDate);
      if (end) return end >= now;
      if (start) {
        // No end date: treat as live for 24h after start.
        return start.getTime() + 24 * 60 * 60 * 1000 >= now.getTime();
      }
      return false;
    });
  }, [filteredEvents]);

  const pastEvents = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const upcomingIds = new Set(upcomingEvents.map(event => event.id));
    return filteredEvents.filter(event => {
      if (upcomingIds.has(event.id)) return false;
      const start = parseEventDate(event.startDate);
      return start !== null && start < now && start >= thirtyDaysAgo;
    });
  }, [filteredEvents, upcomingEvents]);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 sm:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="mb-4 text-primary border-primary/30"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              {t("events.charlotteBadge")}
            </Badge>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-foreground mb-4">
              {t("events.title1")}{" "}
              <span className="text-primary">{t("events.title2")}</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("events.subtitle")}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link href="/submit-event">
                <Button
                  className="bg-primary text-primary-foreground font-semibold"
                  onClick={() =>
                    trackEventAction("submit_event_click", {
                      surface: "events_hero",
                    })
                  }
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  {t("events.submit")}
                </Button>
              </Link>
              <ShareButtons
                title="Charlotte Events - Settle CLT"
                description="Discover what's happening in Charlotte"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SEO intro section — indexable content for search engines */}
      <section className="bg-muted/30 border-b border-border">
        <div className="container py-6 max-w-4xl">
          <h2 className="font-display font-bold text-xl text-foreground mb-3">
            Things to Do in Charlotte, NC This Week & Weekend
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            Looking for things to do in Charlotte this weekend? Settle CLT's
            events calendar covers everything happening in the Queen City — from
            live concerts and music festivals to family-friendly activities,
            free community events, food and drink experiences, professional
            sports games, and seasonal festivals.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Whether you just moved to Charlotte or you're a lifelong local, use
            this page to find Charlotte events this week, plan your weekend, and
            discover new experiences across every neighborhood. Filter by date,
            category, or search for specific venues and artists.
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container py-3 space-y-3">
          {/* Search bar + filter toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                aria-label="Search events, venues, and neighborhoods"
                placeholder={t("events.searchPlaceholder")}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length >= 3) {
                    trackEventAction("search", {
                      search_query: e.target.value.trim(),
                      surface: "events_search",
                    });
                  }
                }}
                className="pl-9 pr-9 h-9 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear event search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-controls="events-date-filters"
              className={`gap-1.5 shrink-0 ${
                showFilters || hasActiveFilters
                  ? "border-primary text-primary"
                  : ""
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              Date Range
              {(dateFrom || dateTo) && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground gap-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                Clear all
              </Button>
            )}
          </div>

          {/* Date range picker (collapsible) */}
          {showFilters && (
            <div
              id="events-date-filters"
              className="flex items-center gap-3 flex-wrap"
            >
              <div className="flex items-center gap-2">
                <label
                  htmlFor="events-date-from"
                  className="text-xs font-medium text-muted-foreground"
                >
                  From
                </label>
                <Input
                  id="events-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="h-8 text-sm w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="events-date-to"
                  className="text-xs font-medium text-muted-foreground"
                >
                  To
                </label>
                <Input
                  id="events-date-to"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="h-8 text-sm w-40"
                />
              </div>
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-xs text-muted-foreground h-8"
                >
                  Clear dates
                </Button>
              )}
            </div>
          )}

          {/* Recurring + Newcomer toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setRecurringOnly(!recurringOnly)}
              aria-pressed={recurringOnly}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                recurringOnly
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              🔁 Recurring Events
            </button>
            <button
              onClick={() => setNewcomerFriendlyOnly(!newcomerFriendlyOnly)}
              aria-pressed={newcomerFriendlyOnly}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                newcomerFriendlyOnly
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              🌟 Newcomer Friendly
            </button>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                aria-pressed={selectedCategory === cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  if (cat.value) {
                    trackClickByName(cat.value, "event-filter");
                    trackEventAction("filter_click", {
                      category: cat.value,
                      surface: "events_category_pills",
                    });
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.value && CATEGORY_EMOJI[cat.value]} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card animate-pulse"
              >
                <div className="h-40 bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-muted rounded w-24" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">
              {hasActiveFilters ? "No matching events" : "No events yet"}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {hasActiveFilters
                ? "Try adjusting your search, date range, or category filters."
                : selectedCategory
                  ? "No events found in this category. Try a different filter or check back soon."
                  : "Events are coming soon! Check back for concerts, festivals, food events, and more happening in Charlotte."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="mt-4"
              >
                {t("events.clearAllFilters")}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-2xl text-foreground mb-6">
                  {t("events.upcoming")}
                  <span className="text-muted-foreground font-normal text-base ml-2">
                    ({upcomingEvents.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event as EventType}
                      promoted={promotedBySlug.get(event.slug) ?? null}
                      onClick={() =>
                        openEvent(event as EventType, "upcoming_grid")
                      }
                      onCategoryClick={cat =>
                        trackClickByName(cat, "event-card")
                      }
                      onNeighborhoodClick={n =>
                        trackClickByName(n, "event-card")
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-2xl text-foreground mb-6 text-muted-foreground/70">
                  {t("events.past")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
                  {pastEvents.slice(0, 6).map(event => (
                    <EventCard
                      key={event.id}
                      event={event as EventType}
                      onClick={() => openEvent(event as EventType, "past_grid")}
                      onCategoryClick={cat =>
                        trackClickByName(cat, "event-card")
                      }
                      onNeighborhoodClick={n =>
                        trackClickByName(n, "event-card")
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={open => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedEvent && (
            <>
              {(() => {
                const promo = promotedBySlug.get(selectedEvent.slug);
                if (!promo) return null;
                return (
                  <div className={`rounded-lg px-4 py-3 mb-3 border ${PROMOTED_STYLES[promo.level] ?? PROMOTED_STYLES.boost} border-amber-300`}>
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      {promo.organizerLogoUrl && (
                        <img
                          src={promo.organizerLogoUrl}
                          alt=""
                          loading="lazy"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      )}
                      ★ Promoted Event
                    </div>
                    {promo.customHeadline && (
                      <p className="mt-1 font-display font-bold text-base text-foreground">
                        {promo.customHeadline}
                      </p>
                    )}
                    {promo.sponsorMessage && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {promo.sponsorMessage}
                      </p>
                    )}
                  </div>
                );
              })()}
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${CATEGORY_COLORS[selectedEvent.category] ?? ""}`}
                  >
                    {CATEGORY_EMOJI[selectedEvent.category]}{" "}
                    {getCategoryLabel(selectedEvent.category)}
                  </Badge>
                </div>
                <DialogTitle className="font-display text-xl">
                  {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>

              {selectedEvent.imageUrl && (
                <img
                  loading="lazy"
                  src={selectedEvent.imageUrl}
                  alt={`${selectedEvent.title} - Charlotte NC event`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <div className="font-medium text-foreground">
                        {formatFullDate(
                          selectedEvent.startDate,
                          locale,
                          t("events.dateTba")
                        )}
                      </div>
                      <div className="text-muted-foreground">
                        {formatTime(
                          selectedEvent.startDate,
                          locale,
                          t("events.timeTba")
                        )}
                        {selectedEvent.endDate &&
                          ` - ${formatTime(
                            selectedEvent.endDate,
                            locale,
                            t("events.timeTba")
                          )}`}
                      </div>
                    </div>
                  </div>

                  {selectedEvent.venueName && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {selectedEvent.venueName}
                        </div>
                        {selectedEvent.venueAddress && (
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {selectedEvent.venueAddress}
                          </p>
                        )}
                        {selectedEvent.venueAddress && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedEvent.venueAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium no-underline transition-colors"
                            onClick={() =>
                              trackEventAction("directions_click", {
                                event_slug: selectedEvent.slug,
                                event_title: selectedEvent.title,
                                category: selectedEvent.category,
                                neighborhood:
                                  selectedEvent.neighborhood || undefined,
                                venue_name: selectedEvent.venueName,
                                surface: "event_dialog",
                              })
                            }
                          >
                            <Navigation className="w-3.5 h-3.5" /> Get
                            Directions
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedEvent.neighborhood && (
                    <div className="flex items-center gap-3 text-sm">
                      <Tag className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-foreground">
                        {selectedEvent.neighborhood}
                      </span>
                    </div>
                  )}

                  {selectedEvent.isRecurring === "yes" && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">
                        Recurring event
                      </span>
                    </div>
                  )}
                </div>

                {selectedEvent.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selectedEvent.description}
                  </p>
                )}

                {selectedEvent.externalUrl && (
                  <a
                    href={selectedEvent.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                    onClick={() =>
                      trackEventAction("external_click", {
                        event_slug: selectedEvent.slug,
                        event_title: selectedEvent.title,
                        category: selectedEvent.category,
                        neighborhood: selectedEvent.neighborhood || undefined,
                        venue_name: selectedEvent.venueName,
                        surface: "event_dialog",
                      })
                    }
                  >
                    <Button className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Get Tickets / More Info
                    </Button>
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
