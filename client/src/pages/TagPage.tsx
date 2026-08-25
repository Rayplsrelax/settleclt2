import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import PageLayout from "@/components/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, Calendar, BookOpen, MapPin, Building2, ArrowLeft, ChevronRight } from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import { useEffect, useRef } from "react";
import { useI18n } from "@/i18n/I18nContext";
import type { TranslationKey } from "@/i18n/locales/en";
import { useSEO } from "@/hooks/useSEO";
import { hydratedDynamicCanonicalPath } from "@/lib/dynamic-canonical";

const CONTENT_TYPE_ICONS: Record<string, { icon: typeof Tag; labelKey: TranslationKey }> = {
  event: { icon: Calendar, labelKey: "tag.events" },
  blog: { icon: BookOpen, labelKey: "tag.blogPosts" },
  directory: { icon: Building2, labelKey: "tag.directoryListings" },
  neighborhood: { icon: MapPin, labelKey: "tag.neighborhoods" },
};

const TAG_CATEGORY_KEYS: Record<string, TranslationKey> = {
  activity: "tag.categories.activity",
  audience: "tag.categories.audience",
  neighborhood: "tag.categories.neighborhood",
  season: "tag.categories.season",
  "content-type": "tag.categories.contentType",
};

export default function TagPage() {
  const { locale, t } = useI18n();
  const [, params] = useRoute("/tag/:slug");
  const slug = params?.slug ?? "";

  const { data: tag, isLoading: tagLoading } = trpc.tags.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const { data: contentItems, isLoading: contentLoading } = trpc.tags.getContentByTag.useQuery(
    { tagId: tag?.id ?? 0 },
    { enabled: !!tag?.id }
  );

  // Track tag page view for trending
  const trackEngagement = trpc.trending.track.useMutation();
  const trackedTagIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (tag?.id && trackedTagIdRef.current !== tag.id) {
      trackedTagIdRef.current = tag.id;
      trackEngagement.mutate({ tagId: tag.id, engagementType: 'view' });
    }
  }, [tag?.id, trackEngagement]);

  const isLoading = tagLoading || contentLoading;

  useSEO({
    title: tag?.name ? t("tag.seoTitle", { name: tag.name }) : t("tag.fallbackTitle"),
    description: tag?.name
      ? t("tag.seoDescription", { name: tag.name })
      : t("tag.fallbackDescription"),
    keywords: locale === "en" && tag?.name
      ? `${tag.name}, Charlotte NC, Charlotte tag`
      : undefined,
    path: hydratedDynamicCanonicalPath(
      `/tag/${slug}`,
      tagLoading ? "loading" : tag ? "found" : "missing"
    ),
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container py-16">
          <h1 className="sr-only">{t("tag.fallbackTitle")}</h1>
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-48 bg-muted rounded" />
            <div className="h-6 w-96 bg-muted rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!tag) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <Tag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">
            {t("tag.notFound")}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t("tag.notFoundDescription", { tag: slug })}
          </p>
          <Link href="/events">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("tag.browseEvents")}
            </Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  // Group content by type
  const items = contentItems ?? [];
  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.contentType]) acc[item.contentType] = [];
      acc[item.contentType]!.push(item);
      return acc;
    },
    {} as Record<string, Array<(typeof items)[number]>>
  );

  const totalItems = contentItems?.length ?? 0;

  return (
    <PageLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-14">
          <div className="container">
            <Link href="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 no-underline">
              <ArrowLeft className="w-4 h-4" />
              {t("tag.back")}
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {TAG_CATEGORY_KEYS[tag.category]
                  ? t(TAG_CATEGORY_KEYS[tag.category])
                  : tag.category}
              </Badge>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground">
                  {tag.name}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {totalItems === 1
                    ? t("tag.itemSingular", { name: tag.name })
                    : t("tag.items", { count: totalItems, name: tag.name })}
                </p>
              </div>
              <ShareButtons compact title={`${tag.name} - Settle CLT`} description={t("tag.shareDescription", { name: tag.name })} />
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="container py-10">
          {totalItems === 0 ? (
            <div className="text-center py-16">
              <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t("tag.empty", { name: tag.name })}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(grouped).map(([type, items]) => {
                const config = CONTENT_TYPE_ICONS[type];
                const label = config ? t(config.labelKey) : type;
                const Icon = config?.icon ?? Tag;
                return (
                  <div key={type}>
                    <h2 className="font-display font-bold text-xl text-foreground mb-4 flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      {label}
                      <span className="text-muted-foreground font-normal text-sm">
                        ({items!.length})
                      </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items!.map((item) => {
                        const href =
                          type === "event"
                            ? `/events?highlight=${item.contentId}`
                            : type === "blog"
                            ? `/blog/${item.contentId}`
                            : type === "neighborhood"
                            ? `/neighborhood/${item.contentId}`
                            : `/directory/${item.contentId}`;
                        return (
                          <Link
                            key={`${item.contentType}-${item.contentId}`}
                            href={href}
                            className="no-underline group"
                          >
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                  {item.contentId}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {label}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
