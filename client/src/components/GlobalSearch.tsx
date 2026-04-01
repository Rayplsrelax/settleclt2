import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Store, Calendar, FileText, Compass } from "lucide-react";
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
import { allNeighborhoods } from "../../../shared/neighborhoods";
import { SERVICES, SERVICE_CATEGORIES } from "../../../shared/services";
import { articles } from "../../../shared/articles";
import { trpc } from "@/lib/trpc";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "neighborhood" | "directory" | "event" | "blog";
  href: string;
  icon: React.ReactNode;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const trackSearch = trpc.search.track.useMutation();
  const lastTrackedQuery = useRef("");

  // Fetch dynamic data
  const { data: dbBlogPosts } = trpc.blog.getPublished.useQuery(undefined, { enabled: open });
  const { data: dbEvents } = trpc.events.getPublished.useQuery(undefined, { enabled: open });
  const { data: popularSearches } = trpc.search.popular.useQuery({ limit: 5, days: 30 }, { enabled: open });

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Build static search index
  const searchIndex = useMemo(() => {
    const results: SearchResult[] = [];

    // Neighborhoods
    for (const n of allNeighborhoods) {
      results.push({
        id: `neighborhood-${n.id}`,
        title: n.name,
        subtitle: n.vibe,
        type: "neighborhood",
        href: `/neighborhood/${n.id}`,
        icon: <MapPin className="w-4 h-4 text-primary" />,
      });
    }

    // Directory listings
    for (const s of SERVICES) {
      const cat = SERVICE_CATEGORIES.find((c) => c.id === s.category);
      results.push({
        id: `directory-${s.name}-${s.category}`,
        title: s.name,
        subtitle: `${cat?.name ?? s.category} · ${s.area}`,
        type: "directory",
        href: `/directory?search=${encodeURIComponent(s.name)}`,
        icon: <Store className="w-4 h-4 text-amber-600" />,
      });
    }

    // Static blog articles
    for (const a of articles) {
      results.push({
        id: `blog-static-${a.id}`,
        title: a.title,
        subtitle: `${a.category} · ${a.readTime}`,
        type: "blog",
        href: a.url ?? `/blog`,
        icon: <FileText className="w-4 h-4 text-blue-600" />,
      });
    }

    return results;
  }, []);

  // Build dynamic search results from DB
  const dynamicResults = useMemo(() => {
    const results: SearchResult[] = [];

    // DB blog posts
    if (dbBlogPosts) {
      for (const p of dbBlogPosts) {
        results.push({
          id: `blog-db-${p.id}`,
          title: p.title,
          subtitle: `Blog · ${p.category ?? "Article"}`,
          type: "blog",
          href: `/blog/${p.slug}`,
          icon: <FileText className="w-4 h-4 text-blue-600" />,
        });
      }
    }

    // DB events
    if (dbEvents) {
      for (const e of dbEvents) {
        const date = new Date(e.startDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        results.push({
          id: `event-${e.id}`,
          title: e.title,
          subtitle: `${date} · ${e.venueName ?? e.neighborhood ?? "Charlotte"}`,
          type: "event",
          href: `/events?event=${e.slug}`,
          icon: <Calendar className="w-4 h-4 text-green-600" />,
        });
      }
    }

    return results;
  }, [dbBlogPosts, dbEvents]);

  // Combined and filtered results
  const allResults = useMemo(() => [...searchIndex, ...dynamicResults], [searchIndex, dynamicResults]);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/);
    return allResults
      .filter((r) => {
        const text = `${r.title} ${r.subtitle}`.toLowerCase();
        return words.every((w) => text.includes(w));
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
    neighborhood: "Neighborhoods",
    directory: "Directory",
    event: "Events",
    blog: "Blog",
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
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-muted-foreground text-sm transition-colors whitespace-nowrap shrink-0"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Search CLT...</span>
        <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search dialog */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Settle CLT"
        description="Search across neighborhoods, businesses, events, and blog articles"
      >
        <CommandInput
          placeholder="Search neighborhoods, businesses, events, articles..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim() === "" ? (
            <div className="px-4 py-6 text-center">
              <Compass className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Type to search across all of Settle CLT
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Neighborhoods, businesses, events, and blog articles
              </p>
              {popularSearches && popularSearches.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground/60 mb-2">Popular searches</p>
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
          ) : (
            <>
              <CommandEmpty>
                <div className="py-4">
                  <p className="text-muted-foreground">No results found for "{query}"</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Try a different search term
                  </p>
                </div>
              </CommandEmpty>
              {Object.entries(grouped).map(([type, items], idx) => (
                <div key={type}>
                  {idx > 0 && <CommandSeparator />}
                  <CommandGroup heading={typeLabels[type] ?? type}>
                    {items.slice(0, 5).map((item) => (
                      <CommandItem
                        key={item.id}
                        value={`${item.title} ${item.subtitle}`}
                        onSelect={() => handleSelect(item.href)}
                        className="cursor-pointer"
                      >
                        {item.icon}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-medium">{item.title}</span>
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
                        +{items.length - 5} more results
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
