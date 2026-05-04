import PageLayout from "@/components/PageLayout";
import { allNeighborhoods, type Neighborhood } from "@shared/neighborhoods";
import { useLocation, useSearch, Link } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  GitCompare, Plus, X, DollarSign, TrendingUp, Train, GraduationCap,
  Moon, Heart, Dog, Baby, Shield, Home, CheckCircle2, AlertTriangle,
  ThumbsUp, ThumbsDown, ArrowRight
} from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import { useSEO } from "@/hooks/useSEO";

const STAT_ROWS: { key: string; label: string; icon: React.ReactNode; format: (n: Neighborhood) => string; higher: "better" | "worse" | "neutral" }[] = [
  { key: "avgRent", label: "Avg Rent (1BR)", icon: <DollarSign className="w-4 h-4" />, format: n => n.stats.avgRent, higher: "worse" },
  { key: "medianHomePrice", label: "Median Home Price", icon: <Home className="w-4 h-4" />, format: n => n.stats.medianHomePrice, higher: "neutral" },
  { key: "walkScore", label: "Walk Score", icon: <TrendingUp className="w-4 h-4" />, format: n => String(n.stats.walkScore), higher: "better" },
  { key: "transitScore", label: "Transit Score", icon: <Train className="w-4 h-4" />, format: n => String(n.stats.transitScore), higher: "better" },
  { key: "commuteToUptown", label: "Commute to Uptown", icon: <Train className="w-4 h-4" />, format: n => n.stats.commuteToUptown, higher: "neutral" },
  { key: "schoolTier", label: "School Tier", icon: <GraduationCap className="w-4 h-4" />, format: n => n.stats.schoolTier, higher: "neutral" },
  { key: "crimeLevel", label: "Crime Level", icon: <Shield className="w-4 h-4" />, format: n => n.stats.crimeLevel, higher: "neutral" },
  { key: "nightlifeLevel", label: "Nightlife", icon: <Moon className="w-4 h-4" />, format: n => n.stats.nightlifeLevel, higher: "neutral" },
  { key: "petFriendly", label: "Pet Score", icon: <Dog className="w-4 h-4" />, format: n => `${n.stats.petFriendly}/5`, higher: "better" },
  { key: "familyScore", label: "Family Score", icon: <Baby className="w-4 h-4" />, format: n => `${n.stats.familyScore}/5`, higher: "better" },
];

const COST_ROWS: { key: keyof Neighborhood["monthlyCosts"]; label: string }[] = [
  { key: "rent1br", label: "1BR Rent" },
  { key: "rent2br", label: "2BR Rent" },
  { key: "utilities", label: "Utilities" },
  { key: "groceries", label: "Groceries" },
  { key: "dining", label: "Dining Out" },
  { key: "transit", label: "Transit" },
  { key: "entertainment", label: "Entertainment" },
];

export default function Compare() {
  useSEO({
    title: "Compare Charlotte Neighborhoods Side by Side",
    description: "Compare up to 3 Charlotte neighborhoods side by side. See rent, walkability, schools, nightlife, transit, and more to find the best fit for your lifestyle.",
    keywords: "compare Charlotte neighborhoods, Charlotte neighborhood comparison, best neighborhood Charlotte, Charlotte cost of living comparison",
    path: "/compare",
  });

  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const initialIds = (params.get("ids") || "").split(",").filter(Boolean);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds.slice(0, 3));
  const [showPicker, setShowPicker] = useState(initialIds.length < 2);

  const selected = useMemo(() =>
    selectedIds.map(id => allNeighborhoods.find(n => n.id === id)).filter(Boolean) as Neighborhood[],
    [selectedIds]
  );

  function addNeighborhood(id: string) {
    if (selectedIds.length >= 3 || selectedIds.includes(id)) return;
    const next = [...selectedIds, id];
    setSelectedIds(next);
    navigate(`/compare?ids=${next.join(",")}`, { replace: true });
    if (next.length >= 2) setShowPicker(false);
  }

  function removeNeighborhood(id: string) {
    const next = selectedIds.filter(x => x !== id);
    setSelectedIds(next);
    navigate(`/compare?ids=${next.join(",")}`, { replace: true });
  }

  const available = allNeighborhoods.filter(n => !selectedIds.includes(n.id));

  // Find the lowest cost for highlighting
  function lowestCost(key: keyof Neighborhood["monthlyCosts"]): number {
    if (selected.length === 0) return 0;
    return Math.min(...selected.map(n => n.monthlyCosts[key]));
  }

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-clt-navy via-clt-navy/95 to-clt-teal-dark py-12 md:py-16">
        <div className="container">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <GitCompare className="w-8 h-8 text-clt-gold" />
                <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white">Compare Neighborhoods</h1>
              </div>
              <p className="text-white/70 max-w-2xl">
                Select up to 3 neighborhoods to compare side-by-side across stats, costs, vibes, and more.
              </p>
            </div>
            <ShareButtons compact title="Compare Charlotte Neighborhoods - Settle CLT" className="text-white hover:text-white/80" />
          </div>
        </div>
      </section>

      {/* Selection Bar */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {selected.map(n => (
              <div key={n.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <img loading="lazy" src={n.photoUrls[0]} alt={`${n.name} neighborhood`} className="w-6 h-6 rounded-full object-cover" />
                <span className="text-sm font-medium text-foreground">{n.name}</span>
                <button onClick={() => removeNeighborhood(n.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {selectedIds.length < 3 && (
              <button
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add neighborhood
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="container py-10 md:py-14">
        {/* Picker */}
        {showPicker && (
          <div className="mb-10 p-6 rounded-xl bg-card border border-border">
            <h2 className="font-display font-bold text-lg text-foreground mb-4">Select neighborhoods to compare</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {available.map(n => (
                <button
                  key={n.id}
                  onClick={() => addNeighborhood(n.id)}
                  className="relative rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all group"
                >
                  <img loading="lazy" src={n.photoUrls[0]} alt={`${n.name} - Charlotte NC neighborhood`} className="w-full h-24 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-sm font-semibold text-white group-hover:text-clt-gold transition">{n.name}</p>
                    <p className="text-[10px] text-white/60">{n.vibe}</p>
                  </div>
                </button>
              ))}
            </div>
            {selected.length >= 2 && (
              <Button onClick={() => setShowPicker(false)} className="mt-4" size="sm">
                Done selecting
              </Button>
            )}
          </div>
        )}

        {selected.length < 2 ? (
          <div className="text-center py-20">
            <GitCompare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-foreground mb-2">Select at least 2 neighborhoods</h2>
            <p className="text-muted-foreground">Choose neighborhoods above to start comparing.</p>
          </div>
        ) : (
          <div className="space-y-12">

            {/* Photo + Vibe Overview */}
            <div className={`grid gap-6 ${selected.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {selected.map(n => (
                <div key={n.id} className="rounded-xl overflow-hidden border border-border">
                  <img loading="lazy" src={n.photoUrls[0]} alt={`${n.name} - Charlotte NC neighborhood comparison`} className="w-full h-36 md:h-48 object-cover" />
                  <div className="p-4">
                    <Link href={`/neighborhood/${n.id}`} className="no-underline">
                      <h3 className="font-display font-bold text-lg text-foreground hover:text-primary transition">{n.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">{n.vibe}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{n.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Comparison Table */}
            <div>
              <h2 className="font-display font-bold text-xl text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Stats Comparison
              </h2>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3 w-1/4">Metric</th>
                      {selected.map(n => (
                        <th key={n.id} className="text-center text-xs font-semibold text-foreground p-3">{n.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {STAT_ROWS.map((row, i) => (
                      <tr key={row.key} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                          {row.icon} {row.label}
                        </td>
                        {selected.map(n => (
                          <td key={n.id} className="p-3 text-center text-sm font-semibold text-foreground">
                            {row.format(n)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Cost Comparison */}
            <div>
              <h2 className="font-display font-bold text-xl text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Monthly Cost Comparison
              </h2>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground p-3 w-1/4">Expense</th>
                      {selected.map(n => (
                        <th key={n.id} className="text-center text-xs font-semibold text-foreground p-3">{n.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COST_ROWS.map((row, i) => {
                      const lowest = lowestCost(row.key);
                      return (
                        <tr key={row.key} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <td className="p-3 text-sm text-muted-foreground">{row.label}</td>
                          {selected.map(n => {
                            const val = n.monthlyCosts[row.key];
                            const isLowest = val === lowest && selected.length > 1;
                            return (
                              <td key={n.id} className={`p-3 text-center text-sm font-semibold ${isLowest ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                                ${val.toLocaleString()}
                                {isLowest && <span className="text-[10px] ml-1">✓</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    <tr className="bg-primary/5 border-t-2 border-primary/20">
                      <td className="p-3 text-sm font-bold text-foreground">Total (1BR)</td>
                      {selected.map(n => {
                        const total = Object.entries(n.monthlyCosts)
                          .filter(([k]) => k !== "rent2br")
                          .reduce((sum, [, v]) => sum + v, 0);
                        return (
                          <td key={n.id} className="p-3 text-center text-sm font-bold text-primary">
                            ${total.toLocaleString()}/mo
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vibe Check Side-by-Side */}
            <div>
              <h2 className="font-display font-bold text-xl text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" /> Vibe Check
              </h2>
              <div className={`grid gap-6 ${selected.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {selected.map(n => (
                  <div key={n.id} className="space-y-4">
                    <h3 className="font-display font-semibold text-foreground text-center pb-2 border-b border-border">{n.name}</h3>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <div className="flex items-center gap-1.5 mb-3">
                        <ThumbsUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Love</span>
                      </div>
                      <ul className="space-y-2">
                        {n.localsLove.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                      <div className="flex items-center gap-1.5 mb-3">
                        <ThumbsDown className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-semibold text-red-500">Don't Love</span>
                      </div>
                      <ul className="space-y-2">
                        {n.localsDontLove.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best For */}
            <div>
              <h2 className="font-display font-bold text-xl text-foreground mb-4">Best For</h2>
              <div className={`grid gap-4 ${selected.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {selected.map(n => (
                  <div key={n.id} className="p-4 rounded-xl bg-card border border-border text-center">
                    <h3 className="font-display font-semibold text-sm text-foreground mb-2">{n.name}</h3>
                    <p className="text-sm text-muted-foreground">{n.bestFor}</p>
                    <Link href={`/neighborhood/${n.id}`} className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-3 no-underline hover:gap-2 transition-all">
                      Full guide <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </PageLayout>
  );
}
