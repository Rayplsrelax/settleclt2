import PageLayout from "@/components/PageLayout";
import {
  SERVICE_SUPER_GROUPS,
  SERVICE_CATEGORIES,
  SERVICES,
} from "@shared/services";
import { neighborhoods } from "@shared/neighborhoods";
import { CORE_NEIGHBORHOOD_NAMES } from "@shared/metroAreas";
import { useMyNeighborhood } from "@/hooks/useMyNeighborhood";
import { MapView } from "@/components/Map";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Search,
  ExternalLink,
  Phone,
  X,
  MapPin,
  Star,
  Filter,
  Map,
  List,
  Home,
  ArrowRight,
  Building2,
  Sparkles,
  TrendingUp,
  ArrowUpDown,
  Crown,
  Award,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { MapMarkerGeneration } from "@/lib/map-marker-generation";
import WishlistButton from "@/components/WishlistButton";
import QuickStampButton from "@/components/QuickStampButton";
import ShareButtons from "@/components/ShareButtons";
import { useTagTrackingWithLookup } from "@/hooks/useTagTracking";
import { useSEO } from "@/hooks/useSEO";
import {
  useStructuredData,
  buildBreadcrumbSchema,
} from "@/hooks/useStructuredData";
import ClaimBusinessDialog from "@/components/ClaimBusinessDialog";
import { trackBusinessAction, trackFindHomeIntent } from "@/lib/mixpanel";
import { useI18n } from "@/i18n/I18nContext";
import {
  getServiceCategoryLabel,
  getServiceSuperGroupLabel,
} from "@/i18n/serviceLabels";

// Generate a slug key from service name
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getUrlParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get("category") || "",
    area: params.get("area") || "",
    neighborhood: params.get("neighborhood") || "",
    group: params.get("group") || "",
  };
}

// Charlotte center coordinates
const CLT_CENTER = { lat: 35.2271, lng: -80.8431 };

// Approximate coordinates for areas (for map markers)
const AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  "South End": { lat: 35.21, lng: -80.857 },
  NoDa: { lat: 35.25, lng: -80.815 },
  "Plaza Midwood": { lat: 35.22, lng: -80.81 },
  Dilworth: { lat: 35.205, lng: -80.85 },
  "Myers Park": { lat: 35.19, lng: -80.835 },
  Uptown: { lat: 35.2271, lng: -80.8431 },
  Ballantyne: { lat: 35.055, lng: -80.85 },
  "Camp North End": { lat: 35.245, lng: -80.855 },
  SouthPark: { lat: 35.155, lng: -80.83 },
  Elizabeth: { lat: 35.215, lng: -80.825 },
  LoSo: { lat: 35.2, lng: -80.86 },
  "East Charlotte": { lat: 35.21, lng: -80.77 },
  "South Charlotte": { lat: 35.12, lng: -80.85 },
  "West Charlotte": { lat: 35.23, lng: -80.88 },
  "University Area": { lat: 35.31, lng: -80.74 },
  Huntersville: { lat: 35.41, lng: -80.84 },
  "Lake Norman": { lat: 35.45, lng: -80.87 },
  Matthews: { lat: 35.12, lng: -80.72 },
  Concord: { lat: 35.41, lng: -80.58 },
  "Fort Mill": { lat: 35.01, lng: -80.94 },
  Pineville: { lat: 35.08, lng: -80.89 },
  "Charlotte Metro": { lat: 35.2271, lng: -80.8431 },
  Charlotte: { lat: 35.2271, lng: -80.8431 },
  "Mecklenburg County": { lat: 35.25, lng: -80.83 },
  "North End": { lat: 35.245, lng: -80.855 },
};

// Color palette for map markers by category group
const GROUP_COLORS: Record<string, string> = {
  "moving-settling": "#E74C3C",
  "official-business": "#3498DB",
  "home-property": "#2ECC71",
  "personal-services": "#9B59B6",
  "daily-essentials": "#F39C12",
  "lifestyle-entertainment": "#E91E63",
};

export default function Directory() {
  const { locale, t } = useI18n();
  useSEO({
    title: t("directory.seoTitle"),
    description: t("directory.seoDescription"),
    keywords: t("directory.seoKeywords"),
    path: "/directory",
  });

  useStructuredData([
    {
      "@context": "https://schema.org",
      ...buildBreadcrumbSchema([
        { name: "Home", url: "https://settleclt.com" },
        { name: "Business Directory", url: "https://settleclt.com/directory" },
      ]),
    },
  ]);

  const urlParams = getUrlParams();
  const { myNeighborhood } = useMyNeighborhood();
  const myNeighborhoodData = neighborhoods.find(n => n.id === myNeighborhood);

  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState(urlParams.group || "");
  const [activeCategory, setActiveCategory] = useState(
    urlParams.category || ""
  );
  const [activeArea, setActiveArea] = useState(urlParams.area || "");
  const { trackClickByName } = useTagTrackingWithLookup();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [sortBy, setSortBy] = useState<
    "default" | "top-rated" | "most-reviewed" | "newest"
  >("default");
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch enrichment data for all services
  const enrichmentQuery = trpc.enrichment.getAll.useQuery();
  const enrichmentMap = useMemo(() => {
    const m: Record<
      string,
      {
        googleRating: string | null;
        reviewCount: number | null;
        verifiedAddress: string | null;
        verifiedPhone: string | null;
        hoursJson: string | null;
        priceLevel: number | null;
      }
    > = {};
    if (enrichmentQuery.data) {
      for (const e of enrichmentQuery.data) {
        m[e.serviceKey] = e;
      }
    }
    return m;
  }, [enrichmentQuery.data]);

  // Fetch all review stats in one query (prevents 700+ individual queries)
  const bulkReviewStats = trpc.reviews.bulkStats.useQuery({
    targetType: "directory",
  });
  const reviewStatsMap = useMemo(() => {
    const m: Record<string, { avgRating: number; count: number }> = {};
    if (bulkReviewStats.data) {
      for (const r of bulkReviewStats.data) {
        m[r.targetId] = { avgRating: r.avgRating, count: r.count };
      }
    }
    return m;
  }, [bulkReviewStats.data]);

  // Fetch active premium tiers
  const premiumQuery = trpc.premium.getActiveTiers.useQuery();
  const premiumMap = useMemo(() => {
    const m: Record<string, string> = {};
    if (premiumQuery.data) {
      for (const p of premiumQuery.data) {
        m[p.serviceKey] = p.tier;
      }
    }
    return m;
  }, [premiumQuery.data]);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markerGenerationRef = useRef(
    new MapMarkerGeneration<
      google.maps.Map,
      google.maps.marker.AdvancedMarkerElement
    >()
  );
  const [mapReady, setMapReady] = useState(false);
  const [mapGeneration, setMapGeneration] = useState(0);

  // Derive unique areas from services, split into core and metro
  const EXCLUDED_AREAS = new Set([
    "Anywhere",
    "Online",
    "Expanding",
    "Select Areas",
    "Rural Areas",
    "North Carolina",
    "Yorkmont Rd",
    "Suburbs",
    "SouthPark Mall",
    "Shalom Park",
  ]);
  const { coreAreas, metroAreas } = useMemo(() => {
    const areas = new Set(SERVICES.map(s => s.area));
    const all = Array.from(areas)
      .filter(a => !EXCLUDED_AREAS.has(a))
      .sort();
    const core: string[] = [];
    const metro: string[] = [];
    all.forEach(a => {
      if (CORE_NEIGHBORHOOD_NAMES.includes(a)) {
        core.push(a);
      } else {
        metro.push(a);
      }
    });
    return { coreAreas: core, metroAreas: metro };
  }, []);

  // Filter categories by active group
  const visibleCategories = useMemo(() => {
    if (!activeGroup) return SERVICE_CATEGORIES;
    return SERVICE_CATEGORIES.filter(c => c.group === activeGroup);
  }, [activeGroup]);

  // Filter services
  const filteredServices = useMemo(() => {
    let result = [...SERVICES];

    if (activeCategory) {
      result = result.filter(s => s.category === activeCategory);
    } else if (activeGroup) {
      const groupCats: string[] = SERVICE_CATEGORIES.filter(
        c => c.group === activeGroup
      ).map(c => c.id);
      result = result.filter(s => groupCats.includes(s.category));
    }

    if (activeArea) {
      result = result.filter(s =>
        s.area.toLowerCase().includes(activeArea.toLowerCase())
      );
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    // Sort based on selected sort option
    if (sortBy === "top-rated") {
      result.sort((a, b) => {
        const aRating = parseFloat(
          enrichmentMap[toSlug(a.name)]?.googleRating || "0"
        );
        const bRating = parseFloat(
          enrichmentMap[toSlug(b.name)]?.googleRating || "0"
        );
        if (bRating !== aRating) return bRating - aRating;
        return (
          (enrichmentMap[toSlug(b.name)]?.reviewCount || 0) -
          (enrichmentMap[toSlug(a.name)]?.reviewCount || 0)
        );
      });
    } else if (sortBy === "most-reviewed") {
      result.sort((a, b) => {
        const aReviews = enrichmentMap[toSlug(a.name)]?.reviewCount || 0;
        const bReviews = enrichmentMap[toSlug(b.name)]?.reviewCount || 0;
        if (bReviews !== aReviews) return bReviews - aReviews;
        return (
          parseFloat(enrichmentMap[toSlug(b.name)]?.googleRating || "0") -
          parseFloat(enrichmentMap[toSlug(a.name)]?.googleRating || "0")
        );
      });
    } else if (sortBy === "newest") {
      result.reverse();
    } else {
      // Default: active Premium > active Featured > personalization > alphabetical
      const tierRank = (key: string) => {
        const tier = premiumMap[key];
        if (tier === "premium") return 0;
        if (tier === "featured") return 1;
        return 2;
      };
      if (myNeighborhoodData) {
        const myArea = myNeighborhoodData.name;
        result.sort((a, b) => {
          const aKey = toSlug(a.name);
          const bKey = toSlug(b.name);
          const aTier = tierRank(aKey);
          const bTier = tierRank(bKey);
          if (aTier !== bTier) return aTier - bTier;
          const aLocal = a.area.includes(myArea) ? 0 : 1;
          const bLocal = b.area.includes(myArea) ? 0 : 1;
          if (aLocal !== bLocal) return aLocal - bLocal;
          return a.name.localeCompare(b.name);
        });
      } else {
        result.sort((a, b) => {
          const aKey = toSlug(a.name);
          const bKey = toSlug(b.name);
          const aTier = tierRank(aKey);
          const bTier = tierRank(bKey);
          if (aTier !== bTier) return aTier - bTier;
          return a.name.localeCompare(b.name);
        });
      }
    }

    return result;
  }, [
    activeCategory,
    activeGroup,
    activeArea,
    search,
    myNeighborhoodData,
    sortBy,
    enrichmentMap,
  ]);

  const clearFilters = () => {
    setSearch("");
    setActiveGroup("");
    setActiveCategory("");
    setActiveArea("");
    setSortBy("default");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/directory");
    }
  };

  const activeFilterCount = [
    search,
    activeGroup,
    activeCategory,
    activeArea,
  ].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0 || sortBy !== "default";

  // Fetch active promotions for boosted placements
  const promotionsQuery = trpc.premium.getActiveDirectoryPromotions.useQuery();
  const boostedKeys = useMemo(() => {
    if (!promotionsQuery.data) return new Set<string>();
    return new Set(promotionsQuery.data.map(p => p.serviceKey));
  }, [promotionsQuery.data]);
  const activePromotionMap = useMemo(() => {
    if (!promotionsQuery.data)
      return {} as Record<
        string,
        {
          headline: string;
          subtitle?: string | null;
          type: string;
          targetCategory?: string | null;
          targetNeighborhood?: string | null;
        }
      >;
    const map: Record<
      string,
      {
        headline: string;
        subtitle?: string | null;
        type: string;
        targetCategory?: string | null;
        targetNeighborhood?: string | null;
      }
    > = {};
    for (const p of promotionsQuery.data) {
      map[p.serviceKey] = {
        headline: p.headline ?? "",
        subtitle: p.subtitle,
        type: p.type,
        targetCategory: p.targetCategory,
        targetNeighborhood: p.targetNeighborhood,
      };
    }
    return map;
  }, [promotionsQuery.data]);

  const isPromotionRelevant = useCallback(
    (service: (typeof SERVICES)[number]) => {
      const promotion = activePromotionMap[toSlug(service.name)];
      if (!promotion) return false;
      if (promotion.type === "directory_boost") return true;
      if (promotion.type === "category_spotlight")
        return (
          !promotion.targetCategory ||
          promotion.targetCategory === service.category
        );
      if (promotion.type === "neighborhood_spotlight")
        return (
          !promotion.targetNeighborhood ||
          service.area.toLowerCase() ===
            promotion.targetNeighborhood.toLowerCase()
        );
      return false;
    },
    [activePromotionMap]
  );

  // Sort paid placements to the top, including their category/neighborhood targets.
  const sortedWithBoosts = useMemo(() => {
    if (activePromotionMap && Object.keys(activePromotionMap).length > 0) {
      return [...filteredServices].sort(
        (a, b) =>
          Number(isPromotionRelevant(b)) - Number(isPromotionRelevant(a))
      );
    }
    return filteredServices;
  }, [filteredServices, activePromotionMap, isPromotionRelevant]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, activeGroup, activeArea, search, sortBy]);

  // Paginated slice of filtered services
  const visibleServices = useMemo(() => {
    return sortedWithBoosts.slice(0, visibleCount);
  }, [sortedWithBoosts, visibleCount]);

  const hasMore = visibleCount < sortedWithBoosts.length;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || viewMode !== "list") return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev =>
            Math.min(prev + PAGE_SIZE, sortedWithBoosts.length)
          );
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, viewMode, filteredServices.length]);

  // Map initialization callback. A remount always gets a new generation so
  // stale effects cannot mutate the replacement map instance.
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    const generation = markerGenerationRef.current.attach(map);
    setMapGeneration(generation);
    setMapReady(true);
  }, []);

  // Update markers only for the map instance/generation captured by the effect.
  const updateMapMarkers = useCallback((
    services: typeof SERVICES,
    map: google.maps.Map,
    generation: number
  ) => {
    if (
      !window.google ||
      !markerGenerationRef.current.isCurrent(map, generation)
    ) return;

    markerGenerationRef.current.clear(map, generation);
    const nextMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

    // Group services by area for clustering
    const areaGroups: Record<string, typeof SERVICES> = {};
    services.forEach(s => {
      if (!areaGroups[s.area]) areaGroups[s.area] = [];
      areaGroups[s.area].push(s);
    });

    Object.entries(areaGroups).forEach(([area, areaServices]) => {
      const coords = AREA_COORDS[area];
      if (!coords) return;

      areaServices.slice(0, 20).forEach((s, i) => {
        const cat = SERVICE_CATEGORIES.find(c => c.id === s.category);
        const groupColor = cat
          ? GROUP_COLORS[cat.group] || "#6B7280"
          : "#6B7280";

        const offset = i * 0.001;
        const angle = i * 137.5 * (Math.PI / 180);
        const pos = {
          lat: coords.lat + offset * Math.cos(angle),
          lng: coords.lng + offset * Math.sin(angle),
        };

        const markerDiv = document.createElement("div");
        markerDiv.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          background: ${groupColor}; border: 2px solid white;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        `;
        markerDiv.textContent = cat?.icon || "📍";
        markerDiv.addEventListener("mouseenter", () => {
          markerDiv.style.transform = "scale(1.3)";
        });
        markerDiv.addEventListener("mouseleave", () => {
          markerDiv.style.transform = "scale(1)";
        });

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: pos,
          title: `${s.name} — ${s.area}`,
          content: markerDiv,
        });
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="max-width:220px;font-family:system-ui,sans-serif;">
              <strong style="font-size:13px;">${s.name}</strong>
              <p style="font-size:11px;color:#666;margin:4px 0;">${s.description}</p>
              <p style="font-size:11px;color:#888;margin:2px 0;">📍 ${s.area}</p>
              ${s.phone ? `<p style="font-size:11px;margin:2px 0;">📞 ${s.phone}</p>` : ""}
              ${s.website ? `<a href="${s.website}" target="_blank" style="font-size:11px;color:#0066cc;">${t("directory.visitWebsite")}</a>` : ""}
            </div>
          `,
        });
        marker.addListener("click", () => {
          if (markerGenerationRef.current.isCurrent(map, generation)) {
            infoWindow.open({ anchor: marker, map });
          }
        });
        nextMarkers.push(marker);
      });
    });

    if (!markerGenerationRef.current.replace(map, generation, nextMarkers)) {
      return;
    }
    if (nextMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      nextMarkers.forEach(marker => {
        if (marker.position) bounds.extend(marker.position as google.maps.LatLng);
      });
      map.fitBounds(bounds, 50);
    }
  }, [t]);

  useEffect(() => {
    if (viewMode !== "map" || !mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const generation = mapGeneration;
    updateMapMarkers(filteredServices, map, generation);
    return () => {
      markerGenerationRef.current.clear(map, generation);
    };
  }, [filteredServices, viewMode, updateMapMarkers, mapReady, mapGeneration]);

  useEffect(() => () => {
    markerGenerationRef.current.unmount();
    mapRef.current = null;
  }, []);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-clt-navy to-clt-teal-dark py-10 md:py-14">
        <div className="container">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white">
                {t("directory.title")}
              </h1>
              <p className="mt-2 text-white/70">
                {t("directory.countsSubtitle", {
                  businesses: SERVICES.length,
                  categories: SERVICE_CATEGORIES.length,
                })}
              </p>
            </div>
            <ShareButtons
              compact
              title="Charlotte Services Directory - Settle CLT"
              description="Discover 700+ local businesses in Charlotte"
              className="text-white hover:text-white/80"
            />
          </div>

          {/* Neighborhood banner */}
          {urlParams.neighborhood && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {t("directory.neighborhoodResults", { name: urlParams.neighborhood })}
            </div>
          )}

          {/* My neighborhood banner */}
          {myNeighborhoodData && !urlParams.neighborhood && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-clt-gold/20 text-clt-gold text-sm">
              <Star className="w-3.5 h-3.5" />
              {t("directory.prioritizing", { name: myNeighborhoodData.name })}
            </div>
          )}
        </div>
      </section>

      {/* New This Week Section */}
      {!activeCategory && !activeGroup && !activeArea && !search && (
        <section className="py-6 md:py-8 bg-gradient-to-b from-amber-50/50 to-background border-b border-border">
          <div className="container">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-foreground">
                  {t("directory.newThisWeek")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("directory.recentlyAdded")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {SERVICES.slice(-12)
                .reverse()
                .slice(0, 6)
                .map((s, i) => {
                  const cat = SERVICE_CATEGORIES.find(c => c.id === s.category);
                  const sSlug = toSlug(s.name);
                  return (
                    <Link key={`new-${i}`} href={`/directory/${sSlug}`}>
                      <div className="group relative p-3 rounded-xl border border-amber-200/60 bg-white hover:shadow-md hover:border-amber-300 transition-all cursor-pointer">
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider">
                          {t("directory.newBadge")}
                        </span>
                        <span className="text-xl mb-1.5 block">
                          {cat?.icon || "📍"}
                        </span>
                        <h3 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                          {s.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {s.area}
                        </p>
                      </div>
                    </Link>
                  );
                })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {t("directory.growing", { count: SERVICES.length })}{" "}
                <Link
                  href="/list-your-business"
                  className="text-primary hover:underline"
                >
                  {t("directory.addYours")}
                </Link>
              </span>
            </div>
          </div>
        </section>
      )}

      <section className="py-8 md:py-10">
        <div className="container">
          {/* Search bar + view toggle + sort */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                aria-label={t("directory.searchAria")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t("directory.searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex rounded-lg border border-input overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <List className="w-4 h-4" /> {t("directory.list")}
              </button>
              <button
                onClick={() => setViewMode("map")}
                aria-pressed={viewMode === "map"}
                className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${
                  viewMode === "map"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Map className="w-4 h-4" /> {t("directory.map")}
              </button>
            </div>
            {/* Sort dropdown */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select
                aria-label={t("directory.sortAria")}
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className={`pl-9 pr-8 py-2.5 rounded-lg border text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${
                  sortBy !== "default"
                    ? "border-primary/40 bg-primary/5 text-primary font-medium"
                    : "border-input bg-background text-foreground"
                }`}
              >
                <option value="default">{t("directory.sortRecommended")}</option>
                <option value="top-rated">{t("directory.topRated")}</option>
                <option value="most-reviewed">
                  {t("directory.mostReviewed")}
                </option>
                <option value="newest">{t("directory.newestFirst")}</option>
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              className={showFilters ? "bg-primary/10 border-primary/30" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              {t("directory.filters")}{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </Button>
            {hasFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-1" /> {t("directory.clear")}
              </Button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mb-6 p-5 rounded-xl bg-card border border-border space-y-4">
              {/* Super groups */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  {t("directory.categoryGroup")}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setActiveGroup("");
                      setActiveCategory("");
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      !activeGroup
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t("directory.all")}
                  </button>
                  {SERVICE_SUPER_GROUPS.map(sg => (
                    <button
                      key={sg.id}
                      onClick={() => {
                        setActiveGroup(sg.id);
                        setActiveCategory("");
                        trackClickByName(sg.id, "directory-group");
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        activeGroup === sg.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {sg.icon} {getServiceSuperGroupLabel(sg.id, locale)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  {t("directory.category")}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setActiveCategory("")}
                    className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                      !activeCategory
                        ? "bg-primary/10 text-primary font-medium"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t("directory.all")}
                  </button>
                  {visibleCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        trackClickByName(cat.id, "directory-category");
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                        activeCategory === cat.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {cat.icon} {getServiceCategoryLabel(cat.id, locale)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area filter — grouped */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  {t("directory.area")}
                </label>
                <select
                  aria-label={t("directory.area")}
                  value={activeArea}
                  onChange={e => {
                    setActiveArea(e.target.value);
                    if (e.target.value)
                      trackClickByName(e.target.value, "directory-area");
                  }}
                  className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
                >
                  <option value="">{t("directory.allAreas")}</option>
                  <optgroup label={`── ${t("directory.coreNeighborhoods")} ──`}>
                    {coreAreas.map(area => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={`── ${t("directory.metroCharlotte")} ──`}>
                    {metroAreas.map(area => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-4">
            {viewMode === "map"
              ? t("directory.showingMap", {
                  total: filteredServices.length,
                  businesses: t(filteredServices.length === 1 ? "directory.businessSingular" : "directory.businessPlural"),
                })
              : t("directory.showingList", {
                  visible: Math.min(visibleCount, filteredServices.length),
                  total: filteredServices.length,
                  businesses: t(filteredServices.length === 1 ? "directory.businessSingular" : "directory.businessPlural"),
                })}
            {activeCategory &&
              ` ${t("directory.inCategory", { category: (() => {
                const category = SERVICE_CATEGORIES.find(c => c.id === activeCategory);
                return category ? getServiceCategoryLabel(category.id, locale) : activeCategory;
              })() })}`}
            {activeArea && ` ${t("directory.nearArea", { area: activeArea })}`}
          </p>

          {/* Map View */}
          {viewMode === "map" && (
            <div className="mb-6 rounded-xl overflow-hidden border border-border">
              <MapView
                className="h-[500px] md:h-[600px]"
                initialCenter={CLT_CENTER}
                initialZoom={11}
                onMapReady={handleMapReady}
              />
              {/* Map legend */}
              <div className="p-3 bg-card border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {t("directory.legendByCategoryGroup")}
                </p>
                <div className="flex flex-wrap gap-3">
                  {SERVICE_SUPER_GROUPS.map(sg => (
                    <span
                      key={sg.id}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span
                        className="w-3 h-3 rounded-full inline-block border border-white shadow-sm"
                        style={{ background: GROUP_COLORS[sg.id] || "#6B7280" }}
                      />
                      {getServiceSuperGroupLabel(sg.id, locale)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleServices.map((s, i) => {
                  const cat = SERVICE_CATEGORIES.find(c => c.id === s.category);
                  const isLocal =
                    myNeighborhoodData &&
                    s.area.includes(myNeighborhoodData.name);
                  const sSlug = toSlug(s.name);
                  const premiumTier = premiumMap[sSlug];
                  return (
                    <div
                      key={`${s.name}-${i}`}
                      className={`p-4 rounded-xl border bg-card transition-all hover:shadow-md ${
                        premiumTier === "premium"
                          ? "border-purple-300 ring-1 ring-purple-100 bg-gradient-to-br from-purple-50/30 to-card"
                          : premiumTier === "featured"
                            ? "border-amber-300 ring-1 ring-amber-100 bg-gradient-to-br from-amber-50/30 to-card"
                            : isLocal
                              ? "border-primary/30 ring-1 ring-primary/10"
                              : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/directory/${sSlug}`}>
                              <h3 className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer">
                                {s.name}
                              </h3>
                            </Link>
                            {premiumTier === "premium" && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold uppercase">
                                <Crown className="w-2.5 h-2.5" /> {t("directory.premium")}
                              </span>
                            )}
                            {premiumTier === "featured" && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">
                                <Award className="w-2.5 h-2.5" /> {t("directory.featured")}
                              </span>
                            )}
                            {boostedKeys.has(sSlug) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                                {t("directory.promoted")}
                              </span>
                            )}
                          </div>
                          {boostedKeys.has(sSlug) &&
                            activePromotionMap[sSlug]?.headline && (
                              <p className="text-xs font-medium text-blue-600 mt-0.5">
                                {activePromotionMap[sSlug].headline}
                              </p>
                            )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {s.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <QuickStampButton serviceKey={sSlug} area={s.area} />
                          <WishlistButton serviceKey={sSlug} />
                          {cat && <span className="text-lg">{cat.icon}</span>}
                        </div>
                      </div>
                      {/* Enrichment data: rating + reviews */}
                      {(() => {
                        const enriched = enrichmentMap[sSlug];
                        if (!enriched?.googleRating) return null;
                        return (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-semibold text-foreground">
                                {enriched.googleRating}
                              </span>
                            </div>
                            {enriched.reviewCount && (
                              <span className="text-xs text-muted-foreground">
                                ({enriched.reviewCount.toLocaleString()}{" "}
                                {t("directory.reviews")})
                              </span>
                            )}
                            {enriched.priceLevel != null &&
                              enriched.priceLevel > 0 && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {"$".repeat(enriched.priceLevel)}
                                </span>
                              )}
                          </div>
                        );
                      })()}
                      {reviewStatsMap[sSlug] &&
                        reviewStatsMap[sSlug].count > 0 && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${star <= Math.round(reviewStatsMap[sSlug].avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {reviewStatsMap[sSlug].avgRating.toFixed(1)} (
                              {reviewStatsMap[sSlug].count})
                            </span>
                          </div>
                        )}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {s.area}
                        </span>
                        {isLocal && (
                          <span className="text-xs text-primary font-medium">
                            {t("directory.nearYou")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {(() => {
                          const enriched = enrichmentMap[sSlug];
                          const addr =
                            enriched?.verifiedAddress ||
                            s.name + ", " + s.area + ", Charlotte, NC";
                          return (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium no-underline transition-colors"
                              onClick={() =>
                                trackBusinessAction("directions_click", {
                                  service_key: sSlug,
                                  business_name: s.name,
                                  category: cat?.name || s.category,
                                  area: s.area,
                                  surface: "directory_card",
                                })
                              }
                            >
                              <Map className="w-3 h-3" /> {t("directory.getDirections")}
                            </a>
                          );
                        })()}
                        {s.phone && (
                          <a
                            href={`tel:${s.phone}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground text-xs font-medium no-underline transition-colors"
                            onClick={() =>
                              trackBusinessAction("phone_click", {
                                service_key: sSlug,
                                business_name: s.name,
                                category: cat?.name || s.category,
                                area: s.area,
                                surface: "directory_card",
                              })
                            }
                          >
                            <Phone className="w-3 h-3" /> {s.phone}
                          </a>
                        )}
                        {s.website && (
                          <a
                            href={s.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-primary hover:bg-primary/10 text-xs font-medium no-underline transition-colors"
                            onClick={() =>
                              trackBusinessAction("website_click", {
                                service_key: sSlug,
                                business_name: s.name,
                                category: cat?.name || s.category,
                                area: s.area,
                                surface: "directory_card",
                              })
                            }
                          >
                            {t("directory.visit")} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <ClaimBusinessDialog
                          serviceKey={sSlug}
                          businessName={s.name}
                        >
                          <button
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-[11px] transition-colors ml-auto"
                            onClick={() =>
                              trackBusinessAction("claim_click", {
                                service_key: sSlug,
                                business_name: s.name,
                                category: cat?.name || s.category,
                                area: s.area,
                                surface: "directory_card",
                              })
                            }
                          >
                            <Building2 className="w-3 h-3" /> {t("directory.claim")}
                          </button>
                        </ClaimBusinessDialog>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* {t("directory.loadMore")} / Infinite Scroll Trigger */}
              {hasMore && (
                <div
                  ref={loadMoreRef}
                  className="flex flex-col items-center justify-center py-8 gap-3"
                >
                  <p className="text-sm text-muted-foreground">
                    {t("directory.loadingMore", {
                      visible: visibleCount,
                      total: filteredServices.length,
                    })}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setVisibleCount(prev =>
                        Math.min(prev + PAGE_SIZE, filteredServices.length)
                      )
                    }
                    className="gap-2"
                  >
                    {t("directory.loadMore")}
                  </Button>
                </div>
              )}

              {!hasMore && filteredServices.length > PAGE_SIZE && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  {t("directory.showingAll", { total: filteredServices.length })}
                </p>
              )}

              {/* Real Estate Help CTA Banner */}
              <div className="mt-6 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 shrink-0">
                    <Home className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-foreground text-sm">
                      {t("directory.homeCtaTitle")}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("directory.homeCtaDescription")}
                    </p>
                  </div>
                  <Link href="/find-your-home?source=directory">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0"
                      onClick={() =>
                        trackFindHomeIntent({
                          surface: "directory_banner",
                          source: "directory",
                        })
                      }
                    >
                      {t("directory.homeCtaButton")} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {filteredServices.length === 0 && (
                <div className="text-center py-16">
                  <Search className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display font-semibold text-foreground">
                    {t("directory.noResults")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("directory.tryAdjusting")}
                  </p>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    {t("directory.clearAllFilters")}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
