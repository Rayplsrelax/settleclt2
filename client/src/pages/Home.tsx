import PageLayout from "@/components/PageLayout";
import DeferredSection from "@/components/DeferredSection";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { articles } from "@shared/articles";
import {
  ArrowRight,
  MapPin,
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
import { lazy, Suspense, useState, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";
import {
  useStructuredData,
  buildOrganizationSchema,
  buildBreadcrumbSchema,
} from "@/hooks/useStructuredData";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTagTrackingWithLookup } from "@/hooks/useTagTracking";
import ActivityFeed from "@/components/ActivityFeed";
import SocialFollowLinks from "@/components/SocialFollowLinks";
import { useI18n } from "@/i18n/I18nContext";
import { formatLocalizedDate } from "@/i18n/formatters";
import type { TranslationKey } from "@/i18n/locales/en";

const BLOG_CATEGORY_KEYS: Record<string, TranslationKey> = {
  "Getting Started": "blog.category.gettingStarted",
  "Cost of Living": "blog.category.costOfLiving",
  Lifestyle: "blog.category.lifestyle",
  Schools: "blog.category.schools",
  Transportation: "blog.category.transportation",
  Relocation: "blog.category.relocation",
  Pets: "blog.category.pets",
};

function blogCategoryLabel(category: string, t: (key: TranslationKey) => string) {
  const key = BLOG_CATEGORY_KEYS[category];
  return key ? t(key) : category;
}

const FeaturedNeighborhoods = lazy(
  () => import("@/components/home/FeaturedNeighborhoods")
);
const DirectoryPreview = lazy(
  () => import("@/components/home/DirectoryPreview")
);

const HERO_IMAGE = "/images/hero-charlotte-skyline.webp";

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden min-h-[520px] md:min-h-[600px] flex items-center">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          loading="eager"
          fetchPriority="high"
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
            {t("home.heroTitle1")}
            <span className="block text-clt-gold">{t("home.heroTitle2")}</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/80 leading-relaxed max-w-xl">
            {t("home.heroTagline")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-clt-teal-dark hover:bg-clt-teal text-white font-semibold px-6 shadow-lg shadow-clt-teal-dark/20"
            >
              <Link href="/neighborhoods">
                {t("home.exploreNeighborhoods")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 text-white hover:bg-white/10 font-semibold px-6 backdrop-blur-sm"
            >
              <Link href="/directory">{t("home.browseDirectory")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-clt-gold hover:bg-clt-gold/90 text-clt-navy font-semibold px-6 shadow-lg shadow-clt-gold/20"
            >
              <Link href="/find-your-home?source=homepage">
                <HomeIcon className="mr-2 w-4 h-4" />
                {t("home.findYourHome")}
              </Link>
            </Button>
          </div>

          {/* Quick stats bar */}
          <div className="mt-10 flex flex-wrap gap-6 md:gap-10">
            {[
              { value: "20", label: t("home.neighborhoodsStat") },
              { value: "700+", label: t("home.servicesStat") },
              { value: "50+", label: t("home.categoriesStat") },
            ].map(stat => (
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
  const { t } = useI18n();
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
                <Sparkles className="w-3.5 h-3.5" /> {t("home.quizBadge")}
              </div>
              <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">
                {t("home.quizPrompt")}
              </h2>
              <p className="text-white/70 max-w-md">
                {t("home.quizDescription")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="bg-clt-gold hover:bg-clt-gold/90 text-clt-navy font-bold text-base px-8 py-6 rounded-xl shadow-lg gap-2 whitespace-nowrap"
              >
                <Link href="/quiz?source=homepage">
                  {t("home.takeTheQuiz")} <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 font-semibold text-base px-8 py-6 rounded-xl gap-2 whitespace-nowrap"
              >
                <Link href="/newcomer-plan?source=homepage">
                  {t("home.buildMyPlan")} <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsletterSignup() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success(t("home.newsletterSuccess"));
    },
    onError: () => {
      toast.error(t("home.newsletterError"));
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
            {t("home.newsletterTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {t("home.newsletterDescription")}
          </p>

          {submitted ? (
            <div className="mt-8 w-full rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                <p className="font-display font-semibold text-foreground">
                  {t("home.newsletterSuccess")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("home.newsletterSuccessHint")}
                </p>
              </div>
              <div className="mt-6 border-t border-primary/15 pt-5">
                <p className="font-display font-semibold text-foreground">
                  {t("home.newsletterFollow")}
                </p>
                <p className="mb-4 mt-1 text-sm text-muted-foreground">
                  {t("home.newsletterFollowHint")}
                </p>
                <SocialFollowLinks
                  surface="newsletter-success"
                  variant="cards"
                />
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                {t("home.emailAddress")}
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                {subscribe.isPending ? t("home.joining") : t("home.subscribe")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            {t("home.newsletterConsent")}
          </p>
        </div>
      </div>
    </section>
  );
}

function BlogPreview() {
  const { locale, t } = useI18n();
  const { data: dbPosts, isLoading } = trpc.blog.getRecent.useQuery({
    limit: 3,
  });

  // Merge DB posts with static articles as fallback
  const recent = useMemo(() => {
    const dbItems = (dbPosts || []).map(p => ({
      id: p.slug || String(p.id),
      title: p.title,
      excerpt: p.excerpt || t("home.articleFallbackExcerpt"),
      category: p.category || t("home.articleFallbackCategory"),
      date: p.publishedAt
        ? formatLocalizedDate(p.publishedAt, locale, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "",
      readTime: p.readTime || t("blog.minRead", {
        count: Math.ceil((p.content?.length || 800) / 1500),
      }),
      image: p.coverImage || undefined,
      slug: p.slug,
      source: "db" as const,
    }));
    if (dbItems.length >= 3) return dbItems.slice(0, 3);
    const staticItems = articles.slice(0, 3 - dbItems.length).map(a => ({
      id: String(a.id),
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      date: a.date
        ? formatLocalizedDate(new Date(`${a.date} 1`), locale, {
            month: "long",
            year: "numeric",
          })
        : "",
      readTime: t("blog.minRead", { count: Number.parseInt(a.readTime, 10) }),
      image: a.image || undefined,
      slug: undefined as string | undefined,
      source: "static" as const,
    }));
    return [...dbItems, ...staticItems];
  }, [dbPosts, locale, t]);

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                {t("home.charlotteBlog")}
              </span>
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
              {t("home.latestFromSettle")}
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md">
              {t("home.blogSubtitle")}
            </p>
          </div>
          <Link
            href="/blog"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline no-underline shrink-0"
          >
            {t("home.viewAllPosts")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card overflow-hidden animate-pulse"
              >
                <div className="h-44 bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-5 bg-muted rounded w-4/5" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recent.map((a, idx) => (
              <Link
                key={a.id}
                href={
                  a.source === "db" && a.slug
                    ? `/blog/${a.slug}`
                    : `/blog#${a.id}`
                }
                className="no-underline group"
              >
                <article className="rounded-xl overflow-hidden border border-border bg-card transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1.5 flex flex-col h-full">
                  {/* Cover image */}
                  <div className="h-44 relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    {a.image ? (
                      <img
                        loading="lazy"
                        src={a.image}
                        alt={`${a.title} - Settle CLT blog`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-primary/20" />
                      </div>
                    )}
                    {/* Category badge overlay */}
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
                        {blogCategoryLabel(a.category, t)}
                      </span>
                    </div>
                    {idx === 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-full bg-clt-gold text-clt-navy text-xs font-bold">
                          {t("home.latest")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-display font-semibold text-base text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {a.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 flex-1 line-clamp-3">
                      {a.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {a.date && <span>{a.date}</span>}
                        {a.readTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {a.readTime}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        {t("home.read")} <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Mobile view all link */}
        <div className="mt-6 text-center sm:hidden">
          <Link href="/blog" className="no-underline">
            <Button variant="outline" className="gap-2">
              {t("home.viewAllBlogPosts")} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
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
  const { locale, t } = useI18n();
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
            <Badge
              variant="outline"
              className="mb-3 text-primary border-primary/30"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {t("home.liveUpdates")}
            </Badge>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
              {t("home.thisWeekInCharlotte")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("home.eventsSubtitle")}
            </p>
          </div>
          <Link
            href="/events"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline no-underline"
          >
            {t("home.viewAllEvents")} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.slice(0, 6).map(event => {
            const d = event.startDate ? new Date(event.startDate) : new Date(0);
            const dayName = formatLocalizedDate(d, locale, {
              weekday: "short",
            });
            const dayNumber = formatLocalizedDate(d, locale, {
              day: "numeric",
            });
            const time = formatLocalizedDate(d, locale, {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
            return (
              <Link
                key={event.id}
                href={`/events?highlight=${event.slug}`}
                className="no-underline group"
              >
                <div className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary text-primary-foreground shrink-0">
                    <span className="text-[10px] font-bold uppercase leading-none">
                      {dayName}
                    </span>
                    <span className="text-lg font-extrabold leading-tight">
                      {dayNumber}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="flex items-center gap-1.5 mb-1 cursor-pointer hover:text-primary transition-colors"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        trackClickByName(event.category, "home-event");
                      }}
                    >
                      <span className="text-sm">
                        {CATEGORY_EMOJI[event.category] ?? "📅"}
                      </span>
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
          {t("home.viewAllEvents")} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function TrendingInCLT() {
  const { t } = useI18n();
  const { data: trending, isLoading } = trpc.trending.getTrending.useQuery({
    limit: 8,
    days: 30,
  });
  const { data: allTags } = trpc.tags.getAll.useQuery();
  const trackEngagement = trpc.trending.track.useMutation();

  // If no engagement data yet, show popular tags from the tags table as fallback
  const displayTags =
    trending && trending.length > 0
      ? trending.map(t => ({
          id: t.tagId,
          name: t.tagName,
          slug: t.tagSlug,
          category: t.tagCategory,
          count: t.engagementCount,
        }))
      : (allTags || []).slice(0, 8).map(t => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          category: t.category,
          count: 0,
        }));

  if (isLoading || displayTags.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {t("home.trendingTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("home.trendingDescription")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {displayTags.map(tag => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="no-underline"
              onClick={() => {
                trackEngagement.mutate({
                  tagId: tag.id,
                  engagementType: "click",
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
  const { t } = useI18n();
  return (
    <section className="py-14 md:py-18 bg-muted/30">
      <div className="container">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              {t("home.communityActivity")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("home.communityActivityDescription")}
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
  const { t } = useI18n();
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="rounded-2xl bg-gradient-to-r from-clt-navy to-clt-teal-dark p-8 md:p-12 text-center">
          <Building2 className="w-10 h-10 text-clt-gold mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white">
            {t("home.businessCtaTitle")}
          </h2>
          <p className="mt-3 text-white/70 max-w-lg mx-auto">
            {t("home.businessCtaDescription")}
          </p>
          <Link href="/list-your-business">
            <Button
              size="lg"
              className="mt-6 bg-clt-gold text-clt-navy font-bold hover:opacity-90"
            >
              {t("home.businessCtaButton")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ForYouSection() {
  const { t } = useI18n();
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

  const hasContent =
    (data.neighborhoods?.length ?? 0) > 0 ||
    (data.events?.length ?? 0) > 0 ||
    (data.directory?.length ?? 0) > 0;
  if (!hasContent && (!preferences.data || preferences.data.length === 0))
    return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
              {t("home.forYou", { name: user.name?.split(" ")[0] || t("home.explorer") })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("home.forYouDescription")}
            </p>
          </div>
        </div>

        {/* User's top interests */}
        {preferences.data && preferences.data.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-2">
              {t("home.topInterests")}
            </p>
            <div className="flex flex-wrap gap-2">
              {preferences.data.slice(0, 8).map((p, i) => (
                <Link key={i} href={`/tag/${p.tagSlug}`}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-accent"
                  >
                    {p.tagName}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({p.score})
                    </span>
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
                <h3 className="font-semibold text-foreground text-sm">
                  {t("home.neighborhoodsForYou")}
                </h3>
              </div>
              <div className="space-y-2">
                {data.neighborhoods.slice(0, 4).map((n, i) => (
                  <Link key={i} href={`/neighborhood/${n.id}`}>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-foreground">
                        {n.id
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {n.matchedTag}
                      </Badge>
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
                <h3 className="font-semibold text-foreground text-sm">
                  {t("home.eventsForYou")}
                </h3>
              </div>
              <div className="space-y-2">
                {data.events.slice(0, 4).map((e, i) => (
                  <Link key={i} href={`/events?highlight=${e.id}`}>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-foreground truncate">
                        {e.id}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {e.matchedTag}
                      </Badge>
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
                <h3 className="font-semibold text-foreground text-sm">
                  {t("home.placesForYou")}
                </h3>
              </div>
              <div className="space-y-2">
                {data.directory.slice(0, 4).map((d, i) => (
                  <Link key={i} href={`/directory/${encodeURIComponent(d.id)}`}>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-foreground truncate">
                        {d.id}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {d.matchedTag}
                      </Badge>
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
  const { t } = useI18n();
  useSEO({
    title: t("home.seoTitle"),
    description: t("home.seoDescription"),
    keywords: t("home.seoKeywords"),
    path: "/",
    noSuffix: true,
  });

  useStructuredData([
    { "@context": "https://schema.org", ...buildOrganizationSchema() },
    {
      "@context": "https://schema.org",
      ...buildBreadcrumbSchema([
        { name: "Home", url: "https://settleclt.com" },
      ]),
    },
  ]);

  return (
    <PageLayout>
      <Hero />
      <ForYouSection />
      <ThisWeekInCLT />
      <TrendingInCLT />
      <QuizCTA />
      <DeferredSection minHeight={416}>
        <Suspense fallback={null}>
          <FeaturedNeighborhoods />
        </Suspense>
      </DeferredSection>
      <DeferredSection minHeight={392}>
        <Suspense fallback={null}>
          <DirectoryPreview />
        </Suspense>
      </DeferredSection>
      <CTABanner />
      <CommunityActivity />
      <NewsletterSignup />
      <BlogPreview />
    </PageLayout>
  );
}
