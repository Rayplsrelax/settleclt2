import PageLayout from "@/components/PageLayout";
import { SERVICE_SUPER_GROUPS, SERVICE_CATEGORIES, SERVICES } from "@shared/services";
import { neighborhoods } from "@shared/neighborhoods";
import { CORE_NEIGHBORHOOD_NAMES } from "@shared/metroAreas";
import { useMyNeighborhood } from "@/hooks/useMyNeighborhood";
import { MapView } from "@/components/Map";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Search, ExternalLink, Phone, X, MapPin, Star, Filter, Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import WishlistButton from "@/components/WishlistButton";
import ShareButtons from "@/components/ShareButtons";
import { useTagTrackingWithLookup } from "@/hooks/useTagTracking";
import { ReviewStars } from "@/components/ReviewSection";

// Generate a slug key from service name
function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
  "South End": { lat: 35.2100, lng: -80.8570 },
  "NoDa": { lat: 35.2500, lng: -80.8150 },
  "Plaza Midwood": { lat: 35.2200, lng: -80.8100 },
  "Dilworth": { lat: 35.2050, lng: -80.8500 },
  "Myers Park": { lat: 35.1900, lng: -80.8350 },
  "Uptown": { lat: 35.2271, lng: -80.8431 },
  "Ballantyne": { lat: 35.0550, lng: -80.8500 },
  "Camp North End": { lat: 35.2450, lng: -80.8550 },
  "SouthPark": { lat: 35.1550, lng: -80.8300 },
  "Elizabeth": { lat: 35.2150, lng: -80.8250 },
  "LoSo": { lat: 35.2000, lng: -80.8600 },
  "East Charlotte": { lat: 35.2100, lng: -80.7700 },
  "South Charlotte": { lat: 35.1200, lng: -80.8500 },
  "West Charlotte": { lat: 35.2300, lng: -80.8800 },
  "University Area": { lat: 35.3100, lng: -80.7400 },
  "Huntersville": { lat: 35.4100, lng: -80.8400 },
  "Lake Norman": { lat: 35.4500, lng: -80.8700 },
  "Matthews": { lat: 35.1200, lng: -80.7200 },
  "Concord": { lat: 35.4100, lng: -80.5800 },
  "Fort Mill": { lat: 35.0100, lng: -80.9400 },
  "Pineville": { lat: 35.0800, lng: -80.8900 },
  "Charlotte Metro": { lat: 35.2271, lng: -80.8431 },
  "Charlotte": { lat: 35.2271, lng: -80.8431 },
  "Mecklenburg County": { lat: 35.2500, lng: -80.8300 },
  "North End": { lat: 35.2450, lng: -80.8550 },
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
  const urlParams = getUrlParams();
  const { myNeighborhood } = useMyNeighborhood();
  const myNeighborhoodData = neighborhoods.find((n) => n.id === myNeighborhood);

  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState(urlParams.group || "");
  const [activeCategory, setActiveCategory] = useState(urlParams.category || "");
  const [activeArea, setActiveArea] = useState(urlParams.area || "");
  const { trackClickByName } = useTagTrackingWithLookup();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Fetch enrichment data for all services
  const enrichmentQuery = trpc.enrichment.getAll.useQuery();
  const enrichmentMap = useMemo(() => {
    const m: Record<string, { googleRating: string | null; reviewCount: number | null; verifiedAddress: string | null; verifiedPhone: string | null; hoursJson: string | null; priceLevel: number | null }> = {};
    if (enrichmentQuery.data) {
      for (const e of enrichmentQuery.data) {
        m[e.serviceKey] = e;
      }
    }
    return m;
  }, [enrichmentQuery.data]);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  // Derive unique areas from services, split into core and metro
  const EXCLUDED_AREAS = new Set([
    "Anywhere", "Online", "Expanding", "Select Areas", "Rural Areas",
    "North Carolina", "Yorkmont Rd", "Suburbs", "SouthPark Mall", "Shalom Park"
  ]);
  const { coreAreas, metroAreas } = useMemo(() => {
    const areas = new Set(SERVICES.map((s) => s.area));
    const all = Array.from(areas).filter(a => !EXCLUDED_AREAS.has(a)).sort();
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
    return SERVICE_CATEGORIES.filter((c) => c.group === activeGroup);
  }, [activeGroup]);

  // Filter services
  const filteredServices = useMemo(() => {
    let result = [...SERVICES];

    if (activeCategory) {
      result = result.filter((s) => s.category === activeCategory);
    } else if (activeGroup) {
      const groupCats = SERVICE_CATEGORIES.filter((c) => c.group === activeGroup).map((c) => c.id);
      result = result.filter((s) => groupCats.includes(s.category));
    }

    if (activeArea) {
      result = result.filter((s) => s.area.toLowerCase().includes(activeArea.toLowerCase()));
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    // Personalization: boost services in user's neighborhood
    if (myNeighborhoodData) {
      const myArea = myNeighborhoodData.name;
      result.sort((a, b) => {
        const aLocal = a.area.includes(myArea) ? 0 : 1;
        const bLocal = b.area.includes(myArea) ? 0 : 1;
        if (aLocal !== bLocal) return aLocal - bLocal;
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
    } else {
      result.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
    }

    return result;
  }, [activeCategory, activeGroup, activeArea, search, myNeighborhoodData]);

  const clearFilters = () => {
    setSearch("");
    setActiveGroup("");
    setActiveCategory("");
    setActiveArea("");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/directory");
    }
  };

  const hasFilters = search || activeGroup || activeCategory || activeArea;

  // Map initialization callback
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    updateMapMarkers(filteredServices);
  }, []);

  // Update markers when filtered services change
  const updateMapMarkers = useCallback((services: typeof SERVICES) => {
    if (!mapRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.map = null);
    markersRef.current = [];

    // Group services by area for clustering
    const areaGroups: Record<string, typeof SERVICES> = {};
    services.forEach(s => {
      if (!areaGroups[s.area]) areaGroups[s.area] = [];
      areaGroups[s.area].push(s);
    });

    Object.entries(areaGroups).forEach(([area, areaServices]) => {
      const coords = AREA_COORDS[area];
      if (!coords) return;

      // Add slight random offset for each service so they don't stack
      areaServices.slice(0, 20).forEach((s, i) => {
        const cat = SERVICE_CATEGORIES.find(c => c.id === s.category);
        const groupColor = cat ? (GROUP_COLORS[cat.group] || "#6B7280") : "#6B7280";

        const offset = i * 0.001;
        const angle = (i * 137.5) * (Math.PI / 180); // golden angle spread
        const pos = {
          lat: coords.lat + offset * Math.cos(angle),
          lng: coords.lng + offset * Math.sin(angle),
        };

        // Create custom marker content
        const markerDiv = document.createElement("div");
        markerDiv.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          background: ${groupColor}; border: 2px solid white;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        `;
        markerDiv.textContent = cat?.icon || "📍";
        markerDiv.addEventListener("mouseenter", () => { markerDiv.style.transform = "scale(1.3)"; });
        markerDiv.addEventListener("mouseleave", () => { markerDiv.style.transform = "scale(1)"; });

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current!,
          position: pos,
          title: `${s.name} — ${s.area}`,
          content: markerDiv,
        });

        // Info window on click
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="max-width:220px;font-family:system-ui,sans-serif;">
              <strong style="font-size:13px;">${s.name}</strong>
              <p style="font-size:11px;color:#666;margin:4px 0;">${s.description}</p>
              <p style="font-size:11px;color:#888;margin:2px 0;">📍 ${s.area}</p>
              ${s.phone ? `<p style="font-size:11px;margin:2px 0;">📞 ${s.phone}</p>` : ""}
              ${s.website ? `<a href="${s.website}" target="_blank" style="font-size:11px;color:#0066cc;">Visit website →</a>` : ""}
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open({ anchor: marker, map: mapRef.current! });
        });

        markersRef.current.push(marker);
      });
    });

    // Fit bounds to markers
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(m => {
        if (m.position) {
          bounds.extend(m.position as google.maps.LatLng);
        }
      });
      mapRef.current.fitBounds(bounds, 50);
    }
  }, []);

  // Update markers when view switches to map or filters change
  useMemo(() => {
    if (viewMode === "map" && mapRef.current) {
      updateMapMarkers(filteredServices);
    }
  }, [filteredServices, viewMode, updateMapMarkers]);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-clt-navy to-clt-teal-dark py-10 md:py-14">
        <div className="container">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white">Services Directory</h1>
              <p className="mt-2 text-white/70">{SERVICES.length}+ Charlotte businesses across {SERVICE_CATEGORIES.length} categories</p>
            </div>
            <ShareButtons compact title="Charlotte Services Directory - Settle CLT" description="Discover 400+ local businesses in Charlotte" className="text-white hover:text-white/80" />
          </div>

          {/* Neighborhood banner */}
          {urlParams.neighborhood && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm">
              <MapPin className="w-3.5 h-3.5" />
              Showing services near {urlParams.neighborhood}
            </div>
          )}

          {/* My neighborhood banner */}
          {myNeighborhoodData && !urlParams.neighborhood && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-clt-gold/20 text-clt-gold text-sm">
              <Star className="w-3.5 h-3.5" />
              Prioritizing results near {myNeighborhoodData.name}
            </div>
          )}
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="container">
          {/* Search bar + view toggle */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search businesses, categories..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex rounded-lg border border-input overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <List className="w-4 h-4" /> List
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-2 flex items-center gap-1.5 text-sm transition-colors ${
                  viewMode === "map" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Map className="w-4 h-4" /> Map
              </button>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-primary/10 border-primary/30" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mb-6 p-5 rounded-xl bg-card border border-border space-y-4">
              {/* Super groups */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Category Group</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setActiveGroup(""); setActiveCategory(""); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      !activeGroup ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    All
                  </button>
                  {SERVICE_SUPER_GROUPS.map((sg) => (
                    <button
                      key={sg.id}
                      onClick={() => { setActiveGroup(sg.id); setActiveCategory(""); trackClickByName(sg.id, 'directory-group'); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        activeGroup === sg.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {sg.icon} {sg.label.replace(sg.icon + " ", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setActiveCategory("")}
                    className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                      !activeCategory ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    All
                  </button>
                  {visibleCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCategory(cat.id); trackClickByName(cat.id, 'directory-category'); }}
                      className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                        activeCategory === cat.id ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area filter — grouped */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Area</label>
                <select
                  value={activeArea}
                  onChange={(e) => { setActiveArea(e.target.value); if (e.target.value) trackClickByName(e.target.value, 'directory-area'); }}
                  className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
                >
                  <option value="">All Areas</option>
                  <optgroup label="── Core Neighborhoods ──">
                    {coreAreas.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── Metro Charlotte ──">
                    {metroAreas.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-4">
            {filteredServices.length} {filteredServices.length === 1 ? "business" : "businesses"} found
            {activeCategory && ` in ${SERVICE_CATEGORIES.find((c) => c.id === activeCategory)?.name || activeCategory}`}
            {activeArea && ` near ${activeArea}`}
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
                <p className="text-xs font-medium text-muted-foreground mb-2">Legend by category group</p>
                <div className="flex flex-wrap gap-3">
                  {SERVICE_SUPER_GROUPS.map(sg => (
                    <span key={sg.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className="w-3 h-3 rounded-full inline-block border border-white shadow-sm"
                        style={{ background: GROUP_COLORS[sg.id] || "#6B7280" }}
                      />
                      {sg.label}
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
                {filteredServices.map((s, i) => {
                  const cat = SERVICE_CATEGORIES.find((c) => c.id === s.category);
                  const isLocal = myNeighborhoodData && s.area.includes(myNeighborhoodData.name);
                  return (
                    <div
                      key={`${s.name}-${i}`}
                      className={`p-4 rounded-xl border bg-card transition-all hover:shadow-md ${
                        isLocal ? "border-primary/30 ring-1 ring-primary/10" : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-foreground">{s.name}</h3>
                            {s.featured && (
                              <span className="px-1.5 py-0.5 rounded bg-clt-gold/20 text-clt-gold text-[10px] font-bold uppercase">Featured</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <WishlistButton serviceKey={toSlug(s.name)} />
                          {cat && <span className="text-lg">{cat.icon}</span>}
                        </div>
                      </div>
                      {/* Enrichment data: rating + reviews */}
                      {(() => {
                        const enriched = enrichmentMap[toSlug(s.name)];
                        if (!enriched?.googleRating) return null;
                        return (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-semibold text-foreground">{enriched.googleRating}</span>
                            </div>
                            {enriched.reviewCount && (
                              <span className="text-xs text-muted-foreground">
                                ({enriched.reviewCount.toLocaleString()} reviews)
                              </span>
                            )}
                            {enriched.priceLevel != null && enriched.priceLevel > 0 && (
                              <span className="text-xs text-muted-foreground ml-auto">
                                {'$'.repeat(enriched.priceLevel)}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      <div className="mt-2">
                        <ReviewStars targetType="directory" targetId={toSlug(s.name)} />
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {s.area}
                        </span>
                        {isLocal && (
                          <span className="text-xs text-primary font-medium">Near you</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {s.phone && (
                          <a href={`tel:${s.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground no-underline">
                            <Phone className="w-3 h-3" /> {s.phone}
                          </a>
                        )}
                        {s.website && (
                          <a
                            href={s.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline no-underline ml-auto"
                          >
                            Visit <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredServices.length === 0 && (
                <div className="text-center py-16">
                  <Search className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display font-semibold text-foreground">No results found</h3>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear all filters
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
