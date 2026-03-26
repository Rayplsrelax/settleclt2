import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Calendar, MapPin, ExternalLink, Clock, Filter, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatFullDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getCategoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
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

function EventCard({ event, onClick }: { event: EventType; onClick: () => void }) {
  const isFeatured = event.isFeatured === "yes";
  return (
    <button
      onClick={onClick}
      className={`group text-left w-full rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${
        isFeatured
          ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10"
          : "border-border bg-card hover:border-primary/20"
      }`}
    >
      {event.imageUrl && (
        <div className="h-40 overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs font-medium ${CATEGORY_COLORS[event.category] ?? "bg-gray-100 text-gray-800"}`}
            >
              {CATEGORY_EMOJI[event.category]} {getCategoryLabel(event.category)}
            </Badge>
            {isFeatured && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        </div>

        <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {event.title}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
            <span>{formatDate(event.startDate)}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>{formatTime(event.startDate)}</span>
          </div>
          {event.venueName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
              <span className="truncate">{event.venueName}</span>
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
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
    </button>
  );
}

export default function Events() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);

  const { data: allEvents, isLoading } = trpc.events.getPublished.useQuery(
    selectedCategory ? { category: selectedCategory } : undefined
  );

  const events = allEvents ?? [];

  const featuredEvents = useMemo(
    () => events.filter((e) => e.isFeatured === "yes"),
    [events]
  );

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events.filter((e) => new Date(e.startDate) >= now);
  }, [events]);

  const pastEvents = useMemo(() => {
    const now = new Date();
    return events.filter((e) => new Date(e.startDate) < now);
  }, [events]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 sm:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Charlotte Events
            </Badge>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-foreground mb-4">
              What's Happening in{" "}
              <span className="text-primary">Charlotte</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Concerts, food festivals, art shows, sports, and more. Discover
              what makes the Queen City come alive.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.value && CATEGORY_EMOJI[cat.value]}{" "}
                {cat.label}
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
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">
              No events yet
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {selectedCategory
                ? "No events found in this category. Try a different filter or check back soon."
                : "Events are coming soon! Check back for concerts, festivals, food events, and more happening in Charlotte."}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Events */}
            {featuredEvents.length > 0 && !selectedCategory && (
              <div>
                <h2 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Featured Events
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredEvents.slice(0, 3).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event as EventType}
                      onClick={() => setSelectedEvent(event as EventType)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-2xl text-foreground mb-6">
                  Upcoming Events
                  <span className="text-muted-foreground font-normal text-base ml-2">
                    ({upcomingEvents.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event as EventType}
                      onClick={() => setSelectedEvent(event as EventType)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-2xl text-foreground mb-6 text-muted-foreground/70">
                  Past Events
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
                  {pastEvents.slice(0, 6).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event as EventType}
                      onClick={() => setSelectedEvent(event as EventType)}
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
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${CATEGORY_COLORS[selectedEvent.category] ?? ""}`}
                  >
                    {CATEGORY_EMOJI[selectedEvent.category]}{" "}
                    {getCategoryLabel(selectedEvent.category)}
                  </Badge>
                  {selectedEvent.isFeatured === "yes" && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
                <DialogTitle className="font-display text-xl">
                  {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>

              {selectedEvent.imageUrl && (
                <img
                  src={selectedEvent.imageUrl}
                  alt={selectedEvent.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <div className="font-medium text-foreground">
                        {formatFullDate(selectedEvent.startDate)}
                      </div>
                      <div className="text-muted-foreground">
                        {formatTime(selectedEvent.startDate)}
                        {selectedEvent.endDate &&
                          ` - ${formatTime(selectedEvent.endDate)}`}
                      </div>
                    </div>
                  </div>

                  {selectedEvent.venueName && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <div className="font-medium text-foreground">
                          {selectedEvent.venueName}
                        </div>
                        {selectedEvent.venueAddress && (
                          <div className="text-muted-foreground">
                            {selectedEvent.venueAddress}
                          </div>
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
    </div>
  );
}
