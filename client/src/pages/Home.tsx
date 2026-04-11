import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { neighborhoods } from "@shared/neighborhoods";
import { SERVICE_SUPER_GROUPS, SERVICE_CATEGORIES } from "@shared/services";
import { articles } from "@shared/articles";
import {
  ArrowRight,
  MapPin,
  Search,
  Building2,
  BookOpen,
  ChevronRight,
  Map,
  Mail,
  Sparkles,
  Calendar,
  Clock,
  Activity,
  TrendingUp,
  Hash,
  Home as HomeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useStructuredData, buildOrganizationSchema, buildBreadcrumbSchema } from "@/hooks/useStructuredData";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTagTrackingWithLookup } from "@/hooks/useTagTracking";
import ActivityFeed from "@/components/ActivityFeed";

const HERO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/charlotte-skyline-hero_b8e3deb7.jpg";

function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[520px] md:min-h-[600px] flex items-center">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt="Charlotte NC skyline - Settle CLT relocation guide"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-clt-navy/90 via-clt-navy/75 to-clt-navy/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-clt-navy/60 to-transparent" />
      </div>

      <div className="container relative z-10 py-20 md:py-28">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-6 border border-white/10">
            <MapPin className="w-3.5 h-3.5 text-clt-gold" />
            Charlotte, North Carolina
          </div>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
            Your complete guide to
            <span className="block text-clt-gold">settling in Charlotte</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/80 leading-relaxed max-w-xl">
            Explore 20 neighborhoods, discover 700+ local services, and get
            honest advice from people who actually live here.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/neighborhoods">
              <Button
                size="lg"
                className="bg-clt-teal hover:bg-clt-teal-dark text-white font-semibold px-6 shadow-lg shadow-clt-teal/20"
              >
                Explore Neighborhoods
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/directory">
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 text-white hover:bg-white/10 font-semibold px-6 backdrop-blur-sm"
              >
                Browse Directory
              </Button>
            </Link>
            <Link href="/find-your-home?source=homepage">
              <Button
                size="lg"
                className="bg-clt-gold hover:bg-clt-gold/90 text-clt-navy font-semibold px-6 shadow-lg shadow-clt-gold/20"
              >
                <HomeIcon className="mr-2 w-4 h-4" />
                Find Your Home
              </Button>
            </Link>
          </div>

          {/* Quick stats bar */}
          <div className="mt-10 flex flex-wrap gap-6 md:gap-10">
            {[
              { value: "20", label: "Neighborhoods" },
              { value: "700+", label: "Local Services" },
              { value: "50+", label: "Categories" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-display font-extrabold text-clt-gold">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-white/60 mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function QuizCTA() {
  return (
    <section className="py-14 md:py-18">
      <div className="container">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-clt-navy via-clt-navy to-clt-teal-dark p-8 md:p-12">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-clt-gold rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-clt-teal rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-clt-gold text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" /> 2-Minute Quiz
              </div>
              <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">
                Not sure where to live?
              </h2>
              <p className="text-white/70 max-w-md">
                Answer 6 quick questions about your budget, lifestyle, and priorities — we'll match you with the best Charlotte neighborhoods.
              </p>
            </div>
            <Link href="/quiz">
              <Button size="lg" className="bg-clt-gold hover:bg-clt-gold/90 text-clt-navy font-bold text-base px-8 py-6 rounded-xl shadow-lg gap-2 whitespace-nowrap">
                Take the Quiz <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedNeighborhoods() {
  const { trackClickByName } = useTagTrackingWithLookup();
  const featured = neighborhoods.filter((n) => n.featured).slice(0, 4);
  return (
    <section className="py-16 md:py-20 bg-muted/50">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
              Popular Neighborhoods
            </h2>
            <p className="mt-2 text-muted-foreground">
              Where most newcomers start their search
            </p>
          </div>
          <Link
            href="/neighborhoods"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline no-underline"
          >
            View all 20 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((n) => (
            <Link
              key={n.id}
              href={`/neighborhood/${n.id}`}
              className="no-underline group"
            >
              <div className="relative rounded-xl overflow-hidden h-72 border border-border bg-card transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                {/* Real photo background */}
                <img
                  src={n.photoUrls[0]}
                  alt={`${n.name} neighborhood in Charlotte NC`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-5">
                  <h3 className="font-display font-bold text-lg text-white">
                    {n.name}
                  </h3>
                  <p className="text-sm text-white/80 mt-1">{n.vibe}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {n.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs hover:bg-white/25 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          trackClickByName(tag.replace(/[^\w\s]/g, '').trim(), 'home-neighborhood', n.id);
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/neighborhoods"
          className="sm:hidden flex items-center justify-center gap-1 mt-6 text-sm font-medium text-primary no-underline"
        >
          View all 20 neighborhoods <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function DirectoryPreview() {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            700+ Charlotte Services
          </h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            From movers to mechanics, barbers to breweries — every service you
            need to get settled.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {SERVICE_SUPER_GROUPS.map((sg) => {
            const catCount = SERVICE_CATEGORIES.filter(
              (c) => c.group === sg.id
            ).length;
            return (
              <Link
                key={sg.id}
                href={`/directory?group=${sg.id}`}
                className="no-underline"
              >
                <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all text-center group">
                  <span className="text-3xl">{sg.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                      {sg.label.replace(sg.icon + " ", "")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {catCount} categories
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link href="/directory">
            <Button variant="outline" size="lg" className="font-semibold">
              <Search className="w-4 h-4 mr-2" />
              Browse Full Directory
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function NewsletterSignup() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      if (data.alreadySubscribed) {
        toast.info("You're already subscribed — welcome back!");
      } else {
        toast.success("You're in! Check your inbox for Charlotte tips.");
      }
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribe.mutate({ email, source: "homepage" });
  };

  return (
    <section className="py-16 md:py-20 bg-muted/50">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-5">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            Get the Charlotte Insider Newsletter
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Weekly tips on neighborhoods, hidden gems, cost-saving hacks, and
            everything you need to know before (and after) your move.
          </p>

          {submitted ? (
            <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20 inline-flex flex-col items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <p className="font-display font-semibold text-foreground">
                You're on the list!
              </p>
              <p className="text-sm text-muted-foreground">
                Your first Charlotte insider email is on its way.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                placeholder="your@email.com"
              />
              <Button
                type="submit"
                size="lg"
                className="bg-primary text-primary-foreground font-semibold px-6 rounded-xl whitespace-nowrap"
                disabled={subscribe.isPending}
              >
                {subscribe.isPending ? "Joining..." : "Subscribe"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            Free forever. No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}

function BlogPreview() {
  const { data: dbPosts } = trpc.blog.getPublished.useQuery();
  // Show DB posts first (with proper detail links), then static articles as fallback
  const recent = useMemo(() => {
    const dbItems = (dbPosts || []).map(p => ({
      id: p.slug || String(p.id),
      title: p.title,
      excerpt: p.excerpt || '',
      category: p.category || 'Guide',
      date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      readTime: `${Math.ceil((p.content?.length || 0) / 1500)} min read`,
      gradient: 'linear-gradient(135deg, #2A9D8F 0%, #264653 100%)',
      image: p.coverImage || undefined,
      slug: p.slug,
      featured: false,
      source: 'db' as const,
    }));
    const staticItems = articles.slice(0, 3).map(a => ({ ...a, slug: undefined as string | undefined, source: 'static' as const }));
    return [...dbItems, ...staticItems].slice(0, 3);
  }, [dbPosts]);
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
              Moving Guides
            </h2>
            <p className="mt-2 text-muted-foreground">
              Practical advice for your Charlotte move
            </p>
          </div>
          <Link
            href="/blog"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline no-underline"
          >
            All articles <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recent.map((a) => (
            <Link
              key={a.id}
              href={a.source === 'db' && a.slug ? `/blog/${a.slug}` : `/blog#${a.id}`}
              className="no-underline group"
            >
              <div className="rounded-xl overflow-hidden border border-border bg-card transition-all group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col">
                <div className="h-40 relative overflow-hidden" style={{ background: a.gradient }}>
                  {a.image ? (
                    <img
                      src={a.image}
                      alt={`${a.title} - Settle CLT blog`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-white/30" />
                    </div>
                  )}
                  {a.featured && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-clt-gold text-clt-navy text-xs font-bold">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-xs font-medium text-primary">
                    {a.category}
                  </span>
                  <h3 className="font-display font-semibold text-foreground mt-1 group-hover:text-primary transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 flex-1">
                    {a.excerpt}
                  </p>
                  <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                    <span>{a.date}</span>
                    <span>{a.readTime}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

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

function ThisWeekInCLT() {
  const { trackClickByName } = useTagTrackingWithLookup();
  const { data: events, isLoading } = trpc.events.getThisWeek.useQuery();

  if (isLoading) {
    return (
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="h-8 w-64 bg-muted rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-primary/5 to-background">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Live Updates
            </Badge>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
              This Week in Charlotte
            </h2>
            <p className="mt-2 text-muted-foreground">
              Don't miss what's happening around the Queen City
            </p>
          </div>
          <Link
            href="/events"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline no-underline"
          >
            All events <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.slice(0, 6).map((event) => {
            const d = new Date(event.startDate);
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
            const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
            return (
              <Link key={event.id} href={`/events?highlight=${event.slug}`} className="no-underline group">
                <div className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary shrink-0">
                    <span className="text-[10px] font-bold uppercase leading-none">{dayName}</span>
                    <span className="text-lg font-extrabold leading-tight">{d.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="flex items-center gap-1.5 mb-1 cursor-pointer hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        trackClickByName(event.category, 'home-event');
                      }}
                    >
                      <span className="text-sm">{CATEGORY_EMOJI[event.category] ?? "📅"}</span>
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                        {event.category.replace("-", " ")}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {time}
                      </span>
                      {event.venueName && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {event.venueName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <Link
          href="/events"
          className="sm:hidden flex items-center justify-center gap-1 mt-6 text-sm font-medium text-primary no-underline"
        >
          View all events <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function TrendingInCLT() {
  const { data: trending, isLoading } = trpc.trending.getTrending.useQuery({ limit: 8, days: 30 });
  const { data: allTags } = trpc.tags.getAll.useQuery();
  const trackEngagement = trpc.trending.track.useMutation();

  // If no engagement data yet, show popular tags from the tags table as fallback
  const displayTags = trending && trending.length > 0
    ? trending.map(t => ({ id: t.tagId, name: t.tagName, slug: t.tagSlug, category: t.tagCategory, count: t.engagementCount }))
    : (allTags || []).slice(0, 8).map(t => ({ id: t.id, name: t.name, slug: t.slug, category: t.category, count: 0 }));

  if (isLoading || displayTags.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Trending in CLT
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Popular topics and tags people are exploring
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {displayTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="no-underline"
              onClick={() => {
                trackEngagement.mutate({
                  tagId: tag.id,
                  engagementType: 'click',
                });
              }}
            >
              <div className="group flex items-center gap-1.5 px-3 py-2 rounded-full border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                <Hash className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {tag.name}
                </span>
                {tag.count > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {tag.count}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CommunityActivity() {
  return (
    <section className="py-14 md:py-18 bg-muted/30">
      <div className="container">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Community Activity
            </h2>
            <p className="mt-2 text-muted-foreground">
              See what Charlotte explorers are up to right now
            </p>
          </div>
        </div>
        <div className="max-w-2xl">
          <ActivityFeed limit={8} />
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="rounded-2xl bg-gradient-to-r from-clt-navy to-clt-teal-dark p-8 md:p-12 text-center">
          <Building2 className="w-10 h-10 text-clt-gold mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white">
            Own a Charlotte Business?
          </h2>
          <p className="mt-3 text-white/70 max-w-lg mx-auto">
            Get discovered by thousands of people moving to Charlotte. List your
            business for free.
          </p>
          <Link href="/list-your-business">
            <Button
              size="lg"
              className="mt-6 bg-clt-gold text-clt-navy font-bold hover:opacity-90"
            >
              List Your Business — Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ForYouSection() {
  const { user } = useAuth();
  const recommendations = trpc.recommendations.getForUser.useQuery(undefined, {
    enabled: !!user,
  });
  const preferences = trpc.recommendations.myPreferences.useQuery(undefined, {
    enabled: !!user,
  });

  if (!user) return null;
  if (recommendations.isLoading) return null;

  const data = recommendations.data;
  if (!data) return null;

  const hasContent = (data.neighborhoods?.length ?? 0) > 0 || (data.events?.length ?? 0) > 0 || (data.directory?.length ?? 0) > 0;
  if (!hasContent && (!preferences.data || preferences.data.length === 0)) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
              For You, {user.name?.split(' ')[0] || 'Explorer'}
            </h2>
            <p className="text-sm text-muted-foreground">Based on your browsing and engagement</p>
          </div>
        </div>

        {/* User's top interests */}
        {preferences.data && preferences.data.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-2">Your top interests</p>
            <div className="flex flex-wrap gap-2">
              {preferences.data.slice(0, 8).map((p, i) => (
                <Link key={i} href={`/tag/${p.tagSlug}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                    {p.tagName}
                    <span className="ml-1 text-xs text-muted-foreground">({p.score})</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recommended Neighborhoods */}
          {data.neighborhoods && data.neighborhoods.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Neighborhoods for You</h3>
              </div>
              <div className="space-y-2">
                {data.neighborhoods.slice(0, 4).map((n, i) => (
                  <Link key={i} href={`/neighborhood/${n.id}`}>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-foreground">{n.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      <Badge variant="outline" className="text-[10px]">{n.matchedTag}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Events */}
          {data.events && data.events.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Events You'd Like</h3>
              </div>
              <div className="space-y-2">
                {data.events.slice(0, 4).map((e, i) => (
                  <Link key={i} href={`/events?highlight=${e.id}`}>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-foreground truncate">{e.id}</span>
                      <Badge variant="outline" className="text-[10px]">{e.matchedTag}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Directory */}
          {data.directory && data.directory.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Places to Check Out</h3>
              </div>
              <div className="space-y-2">
                {data.directory.slice(0, 4).map((d, i) => (
                  <Link key={i} href={`/directory/${encodeURIComponent(d.id)}`}>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-foreground truncate">{d.id}</span>
                      <Badge variant="outline" className="text-[10px]">{d.matchedTag}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useSEO({
    title: "Settle CLT \u2014 Your Complete Guide to Living in Charlotte, NC",
    description: "Explore 20 Charlotte neighborhoods, discover 700+ local businesses, find events, and get honest advice from locals.",
    keywords: "Charlotte NC, moving to Charlotte, Charlotte neighborhoods, Charlotte local guide, CLT relocation",
    path: "/",
    noSuffix: true,
  });

  useStructuredData([
    { "@context": "https://schema.org", ...buildOrganizationSchema() },
    { "@context": "https://schema.org", ...buildBreadcrumbSchema([{ name: "Home", url: "https://settleclt.com" }]) },
  ]);

  return (
    <PageLayout>
      <Hero />
      <ForYouSection />
      <ThisWeekInCLT />
      <TrendingInCLT />
      <QuizCTA />
      <FeaturedNeighborhoods />
      <DirectoryPreview />
      <CTABanner />
      <CommunityActivity />
      <NewsletterSignup />
      <BlogPreview />
    </PageLayout>
  );
}
