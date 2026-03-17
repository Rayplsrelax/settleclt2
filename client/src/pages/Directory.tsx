import PageLayout from "@/components/PageLayout";
import { Link } from "wouter";
import { SERVICE_SUPER_GROUPS, SERVICE_CATEGORIES, SERVICES } from "@shared/services";
import { neighborhoods } from "@shared/neighborhoods";
import { useMyNeighborhood } from "@/hooks/useMyNeighborhood";
import { useState, useMemo } from "react";
import { Search, ExternalLink, Phone, X, MapPin, Star, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function Directory() {
  const urlParams = getUrlParams();
  const { myNeighborhood } = useMyNeighborhood();
  const myNeighborhoodData = neighborhoods.find((n) => n.id === myNeighborhood);

  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState(urlParams.group || "");
  const [activeCategory, setActiveCategory] = useState(urlParams.category || "");
  const [activeArea, setActiveArea] = useState(urlParams.area || "");
  const [showFilters, setShowFilters] = useState(false);

  // Derive unique areas from services
  const allAreas = useMemo(() => {
    const areas = new Set(SERVICES.map((s) => s.area));
    return Array.from(areas).sort();
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
        // Then featured first
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
    // Clear URL params
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/directory");
    }
  };

  const hasFilters = search || activeGroup || activeCategory || activeArea;

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-clt-navy to-clt-teal-dark py-10 md:py-14">
        <div className="container">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white">Services Directory</h1>
          <p className="mt-2 text-white/70">400+ Charlotte businesses across 40 categories</p>

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
          {/* Search bar */}
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
                      onClick={() => { setActiveGroup(sg.id); setActiveCategory(""); }}
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
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                        activeCategory === cat.id ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area filter */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Area</label>
                <select
                  value={activeArea}
                  onChange={(e) => setActiveArea(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Areas</option>
                  {allAreas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
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

          {/* Results grid */}
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
                    {cat && <span className="text-lg flex-shrink-0">{cat.icon}</span>}
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
        </div>
      </section>
    </PageLayout>
  );
}
