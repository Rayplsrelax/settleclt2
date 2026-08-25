import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import {
  Search,
  MapPin,
  Store,
  Calendar,
  FileText,
  Compass,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { articles } from "../../../shared/articles";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n/I18nContext";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "neighborhood" | "directory" | "event" | "blog";
  href: string;
  icon: React.ReactNode;
}

function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|Unable to preload CSS/i.test(
    message
  );
}

export default function GlobalSearch() {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<SearchResult[] | null>(null);
  const [searchIndexStatus, setSearchIndexStatus] = useState<
    "loading" | "ready" | "error" | "idle"
  >("idle");
  const [searchIndexAttempt, setSearchIndexAttempt] = useState(0);
  const [searchIndexRecovery, setSearchIndexRecovery] = useState<
    "retry" | "reload"
  >("retry");
  const [, navigate] = useLocation();
  const trackSearch = trpc.search.track.useMutation();
  const lastTrackedQuery = useRef("");

  // Fetch dynamic data
  const { data: dbBlogPosts } = trpc.blog.getPublished.useQuery(undefined, {
    enabled: open,
  });
  const { data: dbEvents } = trpc.events.getPublished.useQuery(undefined, {
    enabled: open,
  });
  const { data: popularSearches } = trpc.search.popular.useQuery(
    { limit: 5, days: 30 },
    { enabled: open }
  );

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // The full service and neighborhood datasets are large. Load them only when
  // the visitor asks to search instead of putting them on every route's
  // critical path through the persistent navbar.
  useEffect(() => {
    if (!open || searchIndex) return;

    let cancelled = false;
    setSearchIndexStatus("loading");
    void Promise.all([
      import("../../../shared/neighborhoods"),
      import("../../../shared/services"),
    ])
      .then(([neighborhoodData, serviceData]) => {
        if (cancelled) return;

        const results: SearchResult[] = [];
        for (const n of neighborhoodData.allNeighborhoods) {
          results.push({
            id: `neighborhood-${n.id}`,
            title: n.name,
            subtitle: n.vibe,
            type: "neighborhood",
            href: `/neighborhood/${n.id}`,
            icon: <MapPin className="w-4 h-4 text-primary" />,
          });
        }

        for (const s of serviceData.SERVICES) {
          const category = serviceData.SERVICE_CATEGORIES.find(
            candidate => candidate.id === s.category
          );
          results.push({
            id: `directory-${s.name}-${s.category}`,
            title: s.name,
            subtitle: `${category?.name ?? s.category} · ${s.area}`,
            type: "directory",
            href: `/directory?search=${encodeURIComponent(s.name)}`,
            icon: <Store className="w-4 h-4 text-amber-600" />,
          });
        }

        for (const article of articles) {
          results.push({
            id: `blog-static-${article.id}`,
            title: article.title,
            subtitle: `${article.category} · ${article.readTime}`,
            type: "blog",
            href: article.url ?? "/blog",
            icon: <FileText className="w-4 h-4 text-blue-600" />,
          });
        }

        setSearchIndex(results);
        setSearchIndexStatus("ready");
        setSearchIndexRecovery("retry");
      })
      .catch(error => {
        if (cancelled) return;
        console.error("Failed to load search index", error);
        setSearchIndexRecovery(isStaleChunkError(error) ? "reload" : "retry");
        setSearchIndexStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [open, searchIndex, searchIndexAttempt]);

  const retrySearchIndex = useCallback(() => {
    setSearchIndexRecovery("retry");
    setSearchIndexStatus("idle");
    setSearchIndexAttempt(attempt => attempt + 1);
  }, []);

  const recoverSearchIndex = useCallback(() => {
    if (searchIndexRecovery === "reload") {
      window.location.reload();
      return;
    }
    retrySearchIndex();
  }, [retrySearchIndex, searchIndexRecovery]);

  // Build dynamic search results from DB
  const dynamicResults = useMemo(() => {
    const results: SearchResult[] = [];

    // DB blog posts
    if (dbBlogPosts) {
      for (const p of dbBlogPosts) {
        results.push({
          id: `blog-db-${p.id}`,
          title: p.title,
          subtitle: `Blog · ${p.category ?? t("search.article")}`,
          type: "blog",
          href: `/blog/${p.slug}`,
          icon: <FileText className="w-4 h-4 text-blue-600" />,
        });
      }
    }

    // DB events
    if (dbEvents) {
      for (const e of dbEvents) {
        const date = e.startDate
          ? new Date(e.startDate).toLocaleDateString(
              locale === "es" ? "es-US" : "en-US",
              {
                month: "short",
                day: "numeric",
              }
            )
          : t("search.dateTbd");
        results.push({
          id: `event-${e.id}`,
          title: e.title || e.name || t("search.untitledEvent"),
          subtitle: `${date} · ${e.venueName ?? e.neighborhood ?? "Charlotte"}`,
          type: "event",
          href: `/events?event=${e.slug}`,
          icon: <Calendar className="w-4 h-4 text-green-600" />,
        });
      }
    }

    return results;
  }, [dbBlogPosts, dbEvents, locale, t]);

  // Combined and filtered results
  const allResults = useMemo(
    () => [...(searchIndex ?? []), ...dynamicResults],
    [searchIndex, dynamicResults]
  );

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/);
    return allResults
      .filter(r => {
        const text = `${r.title} ${r.subtitle}`.toLowerCase();
        return words.every(w => text.includes(w));
      })
      .slice(0, 20);
  }, [query, allResults]);

  // Group results by type
  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const r of filteredResults) {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    }
    return groups;
  }, [filteredResults]);

  const typeLabels: Record<string, string> = {
    neighborhood: t("search.neighborhoods"),
    directory: t("search.directory"),
    event: t("search.events"),
    blog: t("search.blog"),
  };

  // Track search query with debounce on dialog close
  const trackCurrentSearch = useCallback(() => {
    const q = query.trim();
    if (q && q.length >= 2 && q !== lastTrackedQuery.current) {
      lastTrackedQuery.current = q;
      trackSearch.mutate({
        query: q,
        resultCount: filteredResults.length,
        source: "global-search",
      });
    }
  }, [query, filteredResults.length, trackSearch]);

  // Track when dialog closes with a query
  useEffect(() => {
    if (!open && query.trim().length >= 2) {
      trackCurrentSearch();
    }
  }, [open]);

  const handleSelect = useCallback(
    (href: string) => {
      // Track the search before navigating
      const q = query.trim();
      if (q && q.length >= 2 && q !== lastTrackedQuery.current) {
        lastTrackedQuery.current = q;
        trackSearch.mutate({
          query: q,
          resultCount: filteredResults.length,
          source: "global-search",
        });
      }
      setOpen(false);
      setQuery("");
      navigate(href);
    },
    [navigate, query, filteredResults.length, trackSearch]
  );

  return (
    <>
      {/* Search trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("search.trigger")}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-muted-foreground text-sm transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">{t("search.trigger")}</span>
        <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search dialog */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("search.dialogTitle")}
        description={t("search.dialogDescription")}
      >
        <CommandInput
          placeholder={t("search.inputPlaceholder")}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim() === "" ? (
            <div className="px-4 py-6 text-center">
              <Compass className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {t("search.prompt")}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {t("search.scope")}
              </p>
              {popularSearches && popularSearches.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground/60 mb-2">
                    {t("search.popular")}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {popularSearches.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(s.query)}
                        className="px-2.5 py-1 rounded-full bg-accent text-xs text-foreground hover:bg-accent/80 transition-colors"
                      >
                        {s.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : searchIndexStatus === "loading" ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("search.loading")}
            </div>
          ) : searchIndexStatus === "error" ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t("search.loadError")}
              </p>
              <button
                type="button"
                onClick={recoverSearchIndex}
                className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                {searchIndexRecovery === "reload"
                  ? t("search.reload")
                  : t("search.retry")}
              </button>
            </div>
          ) : (
            <>
              <CommandEmpty>
                <div className="py-4">
                  <p className="text-muted-foreground">
                    {t("search.noResults", { query })}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {t("search.tryDifferent")}
                  </p>
                </div>
              </CommandEmpty>
              {Object.entries(grouped).map(([type, items], idx) => (
                <div key={type}>
                  {idx > 0 && <CommandSeparator />}
                  <CommandGroup heading={typeLabels[type] ?? type}>
                    {items.slice(0, 5).map(item => (
                      <CommandItem
                        key={item.id}
                        value={`${item.title} ${item.subtitle}`}
                        onSelect={() => handleSelect(item.href)}
                        className="cursor-pointer"
                      >
                        {item.icon}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-medium">
                            {item.title}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {item.subtitle}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[10px] px-1.5 py-0 shrink-0"
                        >
                          {typeLabels[item.type]}
                        </Badge>
                      </CommandItem>
                    ))}
                    {items.length > 5 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        {t("search.moreResults", { count: items.length - 5 })}
                      </div>
                    )}
                  </CommandGroup>
                </div>
              ))}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
