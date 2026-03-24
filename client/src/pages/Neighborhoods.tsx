import PageLayout from "@/components/PageLayout";
import { Link, useLocation } from "wouter";
import { neighborhoods, type Neighborhood } from "@shared/neighborhoods";
import {
  MapPin, ArrowRight, Home, TrendingUp, Train, DollarSign,
  GraduationCap, Moon, Heart, Baby, GitCompare, SlidersHorizontal, X
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

type FilterKey = "all" | "budget" | "walkable" | "family" | "nightlife" | "transit";

const FILTERS: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
  { key: "budget", label: "Budget-Friendly", icon: <DollarSign className="w-3.5 h-3.5" /> },
  { key: "walkable", label: "Most Walkable", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: "family", label: "Family-Friendly", icon: <Baby className="w-3.5 h-3.5" /> },
  { key: "nightlife", label: "Best Nightlife", icon: <Moon className="w-3.5 h-3.5" /> },
  { key: "transit", label: "Transit Access", icon: <Train className="w-3.5 h-3.5" /> },
];

function filterNeighborhoods(list: Neighborhood[], filter: FilterKey): Neighborhood[] {
  if (filter === "all") return list;
  const sorted = [...list];
  switch (filter) {
    case "budget":
      return sorted.sort((a, b) => a.monthlyCosts.rent1br - b.monthlyCosts.rent1br);
    case "walkable":
      return sorted.sort((a, b) => b.stats.walkScore - a.stats.walkScore);
    case "family":
      return sorted.sort((a, b) => b.stats.familyScore - a.stats.familyScore);
    case "nightlife":
      return sorted.filter(n => n.stats.nightlifeLevel === "active" || n.stats.nightlifeLevel === "moderate");
    case "transit":
      return sorted.sort((a, b) => b.stats.transitScore - a.stats.transitScore);
    default:
      return sorted;
  }
}

function StatCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-1 text-muted-foreground">{icon}</div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-foreground">{String(value)}</p>
    </div>
  );
}

export default function Neighborhoods() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [, navigate] = useLocation();

  const filtered = useMemo(() => filterNeighborhoods(neighborhoods, filter), [filter]);

  function toggleCompare(id: string) {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  }

  function goCompare() {
    if (compareIds.length >= 2) {
      navigate(`/compare?ids=${compareIds.join(",")}`);
    }
  }

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-clt-navy via-clt-navy/95 to-clt-teal-dark py-14 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="container relative">
          <div className="max-w-2xl">
            <h1 className="font-display font-extrabold text-3xl md:text-4xl lg:text-5xl text-white">
              Charlotte Neighborhoods
            </h1>
            <p className="mt-4 text-lg text-white/70 leading-relaxed">
              Eight neighborhoods, eight completely different vibes. Filter by what matters to you, compare side-by-side, and find your fit.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Compare Bar (sticky bottom) */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-clt-navy border-t border-clt-gold/30 shadow-2xl">
          <div className="container py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <GitCompare className="w-5 h-5 text-clt-gold shrink-0" />
              <div className="flex gap-2 overflow-x-auto">
                {compareIds.map(id => {
                  const n = neighborhoods.find(x => x.id === id);
                  return (
                    <span key={id} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-sm whitespace-nowrap">
                      {n?.name}
                      <button onClick={() => toggleCompare(id)} className="hover:text-clt-gold">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
              <span className="text-white/50 text-xs shrink-0">{compareIds.length}/3</span>
            </div>
            <Button
              onClick={goCompare}
              disabled={compareIds.length < 2}
              className="bg-clt-gold text-clt-navy hover:bg-clt-gold/90 font-bold shrink-0"
            >
              Compare {compareIds.length >= 2 ? `(${compareIds.length})` : ""}
            </Button>
          </div>
        </div>
      )}

      {/* Grid */}
      <section className={`py-10 md:py-14 ${compareIds.length > 0 ? "pb-28" : ""}`}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((n) => {
              const isComparing = compareIds.includes(n.id);
              return (
                <div key={n.id} className={`relative rounded-xl overflow-hidden border bg-card hover:shadow-xl transition-all h-full ${isComparing ? "border-clt-gold ring-2 ring-clt-gold/30" : "border-border"}`}>
                  {/* Compare checkbox */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(n.id); }}
                    className={`absolute top-4 left-4 z-20 w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                      isComparing
                        ? "bg-clt-gold text-clt-navy"
                        : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
                    }`}
                    title={isComparing ? "Remove from comparison" : "Add to comparison"}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                  </button>

                  <Link href={`/neighborhood/${n.id}`} className="no-underline group block">
                    {/* Image */}
                    <div className="h-48 relative">
                      <img src={n.photoUrls[0]} alt={n.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-5 right-5">
                        <h2 className="font-display font-bold text-xl text-white group-hover:text-clt-gold transition-colors">{n.name}</h2>
                        <p className="text-sm text-white/80 mt-0.5">{n.vibe}</p>
                      </div>
                      {n.featured && (
                        <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-clt-gold/90 text-clt-navy text-xs font-bold">Popular</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{n.description}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {n.tags.map((tag) => (
                          <span key={tag} className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">{tag}</span>
                        ))}
                      </div>

                      {/* Stats Grid — 6 stats */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-5 pt-4 border-t border-border">
                        <StatCell icon={<Home className="w-3.5 h-3.5" />} label="Rent" value={n.stats.avgRent} />
                        <StatCell icon={<TrendingUp className="w-3.5 h-3.5" />} label="Walk" value={n.stats.walkScore} />
                        <StatCell icon={<Train className="w-3.5 h-3.5" />} label="Uptown" value={n.stats.commuteToUptown} />
                        <StatCell icon={<GraduationCap className="w-3.5 h-3.5" />} label="Schools" value={n.stats.schoolTier} />
                        <StatCell icon={<Moon className="w-3.5 h-3.5" />} label="Nightlife" value={n.stats.nightlifeLevel} />
                        <StatCell icon={<Heart className="w-3.5 h-3.5" />} label="Family" value={`${n.stats.familyScore}/5`} />
                      </div>

                      {/* CTA */}
                      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                        View full guide <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
