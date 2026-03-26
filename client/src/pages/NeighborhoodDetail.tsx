import PageLayout from "@/components/PageLayout";
import { Link, useParams, useLocation } from "wouter";
import { allNeighborhoods } from "@shared/neighborhoods";
import { SERVICES, SERVICE_CATEGORIES, type Service } from "@shared/services";
import { useMyNeighborhood } from "@/hooks/useMyNeighborhood";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MapPin, Home, TrendingUp, Train, Shield, Dog, Moon, Baby, GraduationCap,
  ArrowRight, ChevronRight, ChevronLeft, Heart, Clock, DollarSign, Users,
  Calendar, Plane, ThumbsUp, ThumbsDown, Gem, Map as MapIcon,
  CheckCircle2, GitCompare, Zap, AlertTriangle, Trophy, TreePine, Dumbbell, Bike
} from "lucide-react";
import { NEIGHBORHOOD_SPORTS_REC, CHARLOTTE_VENUES, type SportsRec } from "@shared/sportsRec";
import CommentSection from "@/components/CommentSection";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer
} from "recharts";

const CITY_LABELS: Record<string, string> = {
  nyc: "New York City", chicago: "Chicago", atlanta: "Atlanta", dc: "Washington DC", houston: "Houston",
};

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "vibe-check", label: "Vibe Check" },
  { id: "day-in-life", label: "Day in Life" },
  { id: "costs", label: "Costs" },
  { id: "hidden-gems", label: "Hidden Gems" },
  { id: "settling", label: "Get Settled" },
  { id: "moving-from", label: "Moving From" },
  { id: "sports-rec", label: "Sports & Rec" },
  { id: "map", label: "Map" },
  { id: "services", label: "Services" },
  { id: "community", label: "Community" },
];

// Map pin colors by type
const PIN_COLORS: Record<string, string> = {
  brewery: "#F59E0B",
  coffee: "#8B5CF6",
  transit: "#3B82F6",
  shopping: "#EC4899",
  park: "#10B981",
  restaurant: "#EF4444",
  entertainment: "#F97316",
  grocery: "#14B8A6",
  recreation: "#6366F1",
  office: "#6B7280",
};

export default function NeighborhoodDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const n = allNeighborhoods.find((nb) => nb.id === params.id);
  const { myNeighborhood, setMyNeighborhood, clearMyNeighborhood } = useMyNeighborhood();
  const [selectedCity, setSelectedCity] = useState<string>("nyc");
  const [activeSection, setActiveSection] = useState("overview");
  const [heroIdx, setHeroIdx] = useState(0);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [n]);

  if (!n) { setLocation("/404"); return null; }

  const isMyNeighborhood = myNeighborhood === n.id;
  const handleSetMyNeighborhood = () => {
    setMyNeighborhood(n.id);
    toast.success(`${n.name} is now your neighborhood! Directory results will be personalized.`);
  };

  // Get real services for this neighborhood
  const areaServices = useMemo(() => SERVICES.filter((s: Service) =>
    s.area.toLowerCase().includes(n.name.toLowerCase()) || n.name.toLowerCase().includes(s.area.toLowerCase())
  ), [n.name]);

  // Enrichment data for ratings
  const enrichmentQuery = trpc.enrichment.getAll.useQuery();
  const enrichmentMap = useMemo(() => {
    const m: Record<string, { googleRating: string | null; reviewCount: number | null; priceLevel: number | null }> = {};
    if (enrichmentQuery.data) {
      for (const e of enrichmentQuery.data) {
        m[e.serviceKey] = e;
      }
    }
    return m;
  }, [enrichmentQuery.data]);

  // Group services by category for the neighborhood
  const servicesByCategory = useMemo(() => {
    const groups: Record<string, { catName: string; catIcon: string; services: Service[] }> = {};
    for (const s of areaServices) {
      const cat = SERVICE_CATEGORIES.find(c => c.id === s.category);
      const key = s.category;
      if (!groups[key]) groups[key] = { catName: cat?.name ?? s.category, catIcon: cat?.icon ?? '📍', services: [] };
      groups[key].services.push(s);
    }
    // Sort by number of services descending
    return Object.entries(groups).sort((a, b) => b[1].services.length - a[1].services.length);
  }, [areaServices]);

  function toSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const totalMonthlyCost = Object.values(n.monthlyCosts).reduce((a, b) => a + b, 0);

  function scrollToSection(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Radar chart data — normalize scores to 0-100 scale
  const radarData = useMemo(() => [
    { stat: "Walk", value: n.stats.walkScore, fullMark: 100 },
    { stat: "Nightlife", value: n.stats.nightlifeLevel === "active" ? 90 : n.stats.nightlifeLevel === "moderate" ? 60 : 30, fullMark: 100 },
    { stat: "Family", value: n.stats.familyScore * 20, fullMark: 100 },
    { stat: "Pet", value: n.stats.petFriendly * 20, fullMark: 100 },
    { stat: "Schools", value: n.stats.schoolTier === "A+" ? 100 : n.stats.schoolTier === "A" ? 90 : n.stats.schoolTier === "B+" ? 80 : n.stats.schoolTier === "B" ? 70 : 60, fullMark: 100 },
    { stat: "Safety", value: n.stats.crimeLevel === "low" ? 90 : n.stats.crimeLevel === "medium" ? 60 : 30, fullMark: 100 },
  ], [n]);

  // Map center from keyPlaces average
  const mapCenter = useMemo(() => {
    if (!n.keyPlaces?.length) return { lat: 35.2271, lng: -80.8431 }; // Charlotte default
    const avgLat = n.keyPlaces.reduce((s, p) => s + p.lat, 0) / n.keyPlaces.length;
    const avgLng = n.keyPlaces.reduce((s, p) => s + p.lng, 0) / n.keyPlaces.length;
    return { lat: avgLat, lng: avgLng };
  }, [n]);

  return (
    <PageLayout>
      {/* Hero with Photo Carousel */}
      <section className="relative overflow-hidden h-[50vh] md:h-[60vh]">
        {n.photoUrls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`${n.name} ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === heroIdx ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Carousel controls */}
        {n.photoUrls.length > 1 && (
          <>
            <button onClick={() => setHeroIdx(i => (i - 1 + n.photoUrls.length) % n.photoUrls.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setHeroIdx(i => (i + 1) % n.photoUrls.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {n.photoUrls.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)} className={`w-2.5 h-2.5 rounded-full transition ${i === heroIdx ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          </>
        )}

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
          <div className="container">
            <Link href="/neighborhoods" className="inline-flex items-center gap-1 text-white/60 text-sm hover:text-white/80 no-underline mb-3">
              <ChevronRight className="w-3 h-3 rotate-180" /> All Neighborhoods
            </Link>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-white">{n.name}</h1>
            <p className="mt-2 text-xl text-white/80">{n.vibe}</p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {n.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-white/15 text-white text-sm">{tag}</span>
              ))}
              <Button
                onClick={() => {
                  if (isMyNeighborhood) {
                    clearMyNeighborhood();
                    toast.success('Neighborhood preference cleared.');
                  } else {
                    setMyNeighborhood(n.id);
                    toast.success(`${n.name} is now your neighborhood! Directory results will be personalized.`);
                  }
                }}
                size="sm"
                variant="outline"
                className={isMyNeighborhood
                  ? "border-clt-gold/50 bg-clt-gold/20 text-clt-gold hover:bg-red-500/20 hover:text-red-400 hover:border-red-400/50 rounded-full"
                  : "border-white/30 text-white hover:bg-white/10 rounded-full"
                }
              >
                <Heart className={`w-3.5 h-3.5 mr-1.5 ${isMyNeighborhood ? 'fill-current' : ''}`} />
                {isMyNeighborhood ? 'Your neighborhood ✕' : 'Set as my neighborhood'}
              </Button>
              <Link href={`/compare?ids=${n.id}`}>
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full">
                  <GitCompare className="w-3.5 h-3.5 mr-1.5" /> Compare
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Settle Score — Visual Radar Chart + Key Stats */}
      <section className="bg-card border-b border-border">
        <div className="container py-6">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-center">
            {/* Radar Chart */}
            <div className="mx-auto md:mx-0 w-[260px] h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis
                    dataKey="stat"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="oklch(0.75 0.18 85)"
                    fill="oklch(0.75 0.18 85)"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Key stats grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              <StatCard icon={<DollarSign className="w-4 h-4" />} label="Avg Rent" value={n.stats.avgRent} />
              <StatCard icon={<Home className="w-4 h-4" />} label="Home Price" value={n.stats.medianHomePrice} />
              <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Walk Score" value={String(n.stats.walkScore)} highlight />
              <StatCard icon={<Train className="w-4 h-4" />} label="To Uptown" value={n.stats.commuteToUptown} />
              <StatCard icon={<GraduationCap className="w-4 h-4" />} label="Schools" value={n.stats.schoolTier} />
              <StatCard icon={<Shield className="w-4 h-4" />} label="Crime" value={n.stats.crimeLevel} />
              <StatCard icon={<Moon className="w-4 h-4" />} label="Nightlife" value={n.stats.nightlifeLevel} />
              <StatCard icon={<Dog className="w-4 h-4" />} label="Pet Score" value={`${n.stats.petFriendly}/5`} />
              <StatCard icon={<Baby className="w-4 h-4" />} label="Family" value={`${n.stats.familyScore}/5`} />
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Section Nav */}
      <nav className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container py-10 md:py-14 space-y-16">

        {/* Overview */}
        <section id="overview" ref={el => { sectionRefs.current["overview"] = el; }}>
          <SectionHeader icon={<MapPin className="w-5 h-5" />} title={`About ${n.name}`} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <p className="text-muted-foreground leading-relaxed">{n.description}</p>
              <blockquote className="mt-6 pl-4 border-l-4 border-clt-gold italic text-foreground/80">
                Best for: {n.bestFor}
              </blockquote>
            </div>
            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-display font-semibold text-sm text-foreground mb-3">Who Lives Here</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{n.whoLivesHere.split("\n\n")[0]?.slice(0, 300)}...</p>
            </div>
          </div>
        </section>

        {/* Vibe Check — Locals Love / Don't Love */}
        <section id="vibe-check" ref={el => { sectionRefs.current["vibe-check"] = el; }}>
          <SectionHeader icon={<Zap className="w-5 h-5" />} title="Vibe Check" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-4">
                <ThumbsUp className="w-5 h-5 text-emerald-500" />
                <h3 className="font-display font-semibold text-foreground">Locals Love</h3>
              </div>
              <ul className="space-y-3">
                {n.localsLove.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-4">
                <ThumbsDown className="w-5 h-5 text-red-500" />
                <h3 className="font-display font-semibold text-foreground">Locals Don't Love</h3>
              </div>
              <ul className="space-y-3">
                {n.localsDontLove.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Day in the Life */}
        <section id="day-in-life" ref={el => { sectionRefs.current["day-in-life"] = el; }}>
          <SectionHeader icon={<Clock className="w-5 h-5" />} title="A Day in the Life" />
          <div className="max-w-3xl">
            {n.dayInTheLife.split("\n\n").map((p, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed mb-4">{p}</p>
            ))}
          </div>
        </section>

        {/* Monthly Costs */}
        <section id="costs" ref={el => { sectionRefs.current["costs"] = el; }}>
          <SectionHeader icon={<DollarSign className="w-5 h-5" />} title="Monthly Cost Breakdown" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "1BR Rent", value: n.monthlyCosts.rent1br },
                  { label: "2BR Rent", value: n.monthlyCosts.rent2br },
                  { label: "Utilities", value: n.monthlyCosts.utilities },
                  { label: "Groceries", value: n.monthlyCosts.groceries },
                  { label: "Dining Out", value: n.monthlyCosts.dining },
                  { label: "Transit", value: n.monthlyCosts.transit },
                  { label: "Entertainment", value: n.monthlyCosts.entertainment },
                  { label: "Total (1BR)", value: totalMonthlyCost - n.monthlyCosts.rent2br + n.monthlyCosts.rent1br },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-card border border-border text-center">
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-lg font-bold text-foreground">${item.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <h3 className="font-display font-semibold text-sm text-foreground mb-3">Cost Reality</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{n.costReality.split("\n\n")[0]}</p>
              </div>
            </div>
            <div className="p-5 rounded-xl bg-clt-navy/5 border border-clt-navy/10 dark:bg-clt-gold/5 dark:border-clt-gold/10">
              <h3 className="font-display font-semibold text-sm text-foreground mb-3">Monthly Budget Estimate</h3>
              <div className="space-y-2">
                {Object.entries(n.monthlyCosts).filter(([k]) => k !== "rent2br").map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").replace("rent1br", "Rent (1BR)")}</span>
                    <span className="font-medium text-foreground">${val.toLocaleString()}</span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-border flex justify-between text-sm font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">${(totalMonthlyCost - n.monthlyCosts.rent2br).toLocaleString()}/mo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hidden Gems */}
        <section id="hidden-gems" ref={el => { sectionRefs.current["hidden-gems"] = el; }}>
          <SectionHeader icon={<Gem className="w-5 h-5" />} title="Hidden Gems" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {n.hiddenGems.map((gem, i) => (
              <div key={i} className="p-5 rounded-xl bg-card border border-border hover:border-clt-gold/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-clt-gold/10 text-clt-gold text-[10px] font-bold uppercase">{gem.type}</span>
                </div>
                <h4 className="font-display font-semibold text-foreground">{gem.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{gem.description}</p>
                <p className="text-xs text-primary font-medium mt-3">Tip: {gem.tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Settling Timeline */}
        <section id="settling" ref={el => { sectionRefs.current["settling"] = el; }}>
          <SectionHeader icon={<CheckCircle2 className="w-5 h-5" />} title="Timeline to Settled" />
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
            <div className="space-y-6">
              {n.settlingTimeline.map((step, i) => (
                <div key={i} className="flex gap-4 md:gap-6">
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 p-4 rounded-xl bg-card border border-border">
                    <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">{step.week}</p>
                    <p className="text-sm text-foreground">{step.milestone}</p>
                    {step.directoryCta && (
                      <Link href={`/directory?category=${encodeURIComponent(step.directoryCta)}&area=${encodeURIComponent(n.name)}`} className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2 no-underline hover:gap-2 transition-all">
                        Browse {step.directoryCta.replace(/-/g, " ")} <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Moving From */}
        <section id="moving-from" ref={el => { sectionRefs.current["moving-from"] = el; }}>
          <SectionHeader icon={<Plane className="w-5 h-5" />} title="If You're Moving From..." />
          <div className="flex flex-wrap gap-2 mb-5">
            {Object.keys(n.movingFrom).map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCity === city ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {CITY_LABELS[city] || city}
              </button>
            ))}
          </div>
          <div className="p-5 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">{n.movingFrom[selectedCity]}</p>
          </div>
        </section>

        {/* Sports & Recreation */}
        {(() => {
          const sportsData = NEIGHBORHOOD_SPORTS_REC[n.id];
          if (!sportsData) return null;
          return (
            <section id="sports-rec" ref={el => { sectionRefs.current["sports-rec"] = el; }}>
              <SectionHeader icon={<Trophy className="w-5 h-5" />} title="Sports & Recreation" />

              {/* Fan Culture */}
              <div className="p-5 rounded-xl bg-card border border-border mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🏟️</span>
                  <h3 className="font-semibold text-foreground">Game Day Culture</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{sportsData.fanCulture}</p>
              </div>

              {/* Nearby Venues */}
              {sportsData.nearbyVenues.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Nearby Venues
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sportsData.nearbyVenues.map((venue) => {
                      const venueInfo = CHARLOTTE_VENUES.find(v => v.name === venue.venueName);
                      return (
                        <div key={venue.venueName + venue.distance} className="p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors">
                          <h4 className="font-semibold text-sm text-foreground">{venue.venueName}</h4>
                          {venueInfo && (
                            <p className="text-xs text-primary mt-0.5">
                              {venueInfo.team} · {venueInfo.league}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {venue.distance}
                            </span>
                            <span className="flex items-center gap-1">
                              <Train className="w-3 h-3" /> {venue.access}
                            </span>
                          </div>
                          {venueInfo && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>🎟️ {venueInfo.avgTicket}</span>
                              <span>📅 {venueInfo.season}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recreation & Fitness - Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Fitness Scene */}
                <div className="p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Fitness Scene</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{sportsData.fitnessScene}</p>
                </div>

                {/* Youth Sports */}
                <div className="p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Youth Sports</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{sportsData.youthSports}</p>
                </div>
              </div>

              {/* Recreation Highlights */}
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Bike className="w-4 h-4 text-primary" /> Recreation Highlights
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sportsData.recHighlights.map((highlight, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parks & Trails */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TreePine className="w-4 h-4 text-primary" /> Parks & Trails
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sportsData.parkTrails.map((park) => (
                    <span key={park} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {park}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

        {/* Interactive Map */}
        <section id="map" ref={el => { sectionRefs.current["map"] = el; }}>
          <SectionHeader icon={<MapIcon className="w-5 h-5" />} title={`Explore ${n.name}`} />
          <div className="rounded-xl overflow-hidden border border-border">
            <MapView
              className="h-[400px] md:h-[500px]"
              initialCenter={mapCenter}
              initialZoom={15}
              onMapReady={(map) => {
                // Add markers for each key place
                n.keyPlaces.forEach((place) => {
                  const pinColor = PIN_COLORS[place.type] || "#6B7280";

                  // Create custom pin element
                  const pinEl = document.createElement("div");
                  pinEl.style.cssText = `
                    width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
                    background: ${pinColor}; transform: rotate(-45deg);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid white;
                    cursor: pointer;
                  `;
                  const inner = document.createElement("div");
                  inner.style.cssText = `
                    transform: rotate(45deg); font-size: 12px; color: white; font-weight: bold;
                  `;
                  inner.textContent = place.type.charAt(0).toUpperCase();
                  pinEl.appendChild(inner);

                  const marker = new google.maps.marker.AdvancedMarkerElement({
                    map,
                    position: { lat: place.lat, lng: place.lng },
                    title: `${place.name} (${place.type})`,
                    content: pinEl,
                  });

                  // Info window on click
                  const infoWindow = new google.maps.InfoWindow({
                    content: `
                      <div style="padding: 8px; font-family: system-ui, sans-serif;">
                        <strong style="font-size: 14px;">${place.name}</strong>
                        <br/>
                        <span style="color: ${pinColor}; font-size: 12px; text-transform: capitalize;">${place.type}</span>
                      </div>
                    `,
                  });
                  marker.addListener("click", () => {
                    infoWindow.open({ anchor: marker, map });
                  });
                });

                // Add transit layer
                new google.maps.TransitLayer().setMap(map);
              }}
            />
          </div>
          {/* Map legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(PIN_COLORS).map(([type, color]) => {
              const hasType = n.keyPlaces.some(p => p.type === type);
              if (!hasType) return null;
              return (
                <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="capitalize">{type}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Local Businesses */}
        <section id="services" ref={el => { sectionRefs.current["services"] = el; }}>
          <SectionHeader icon={<MapPin className="w-5 h-5" />} title={`Local Businesses in ${n.name}`} />
          <p className="text-sm text-muted-foreground mb-6 -mt-3">
            {areaServices.length} businesses serving the {n.name} area
          </p>

          {servicesByCategory.slice(0, 4).map(([catId, group]) => (
            <div key={catId} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>{group.catIcon}</span> {group.catName}
                  <span className="text-xs font-normal text-muted-foreground">({group.services.length})</span>
                </h4>
                <Link
                  href={`/directory?category=${encodeURIComponent(catId)}&area=${encodeURIComponent(n.name)}`}
                  className="text-xs text-primary font-medium no-underline hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.services.slice(0, 6).map((s: Service) => {
                  const enriched = enrichmentMap[toSlug(s.name)];
                  return (
                    <div key={s.name} className="p-4 rounded-xl bg-card border border-border hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-semibold text-sm text-foreground leading-tight">{s.name}</h5>
                        {s.featured && (
                          <span className="px-1.5 py-0.5 rounded bg-clt-gold/20 text-clt-gold text-[10px] font-bold uppercase shrink-0">Featured</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                      {enriched?.googleRating && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <span className="text-amber-400 text-xs">★</span>
                            <span className="text-xs font-semibold text-foreground">{enriched.googleRating}</span>
                          </div>
                          {enriched.reviewCount && (
                            <span className="text-xs text-muted-foreground">({enriched.reviewCount.toLocaleString()} reviews)</span>
                          )}
                          {enriched.priceLevel != null && enriched.priceLevel > 0 && (
                            <span className="text-xs text-muted-foreground ml-auto">{'$'.repeat(enriched.priceLevel)}</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                        {s.phone && (
                          <a href={`tel:${s.phone}`} className="text-xs text-muted-foreground hover:text-foreground no-underline">{s.phone}</a>
                        )}
                        {s.website && (
                          <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline no-underline ml-auto">Visit →</a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {servicesByCategory.length > 4 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {servicesByCategory.slice(4).map(([catId, group]) => (
                <Link
                  key={catId}
                  href={`/directory?category=${encodeURIComponent(catId)}&area=${encodeURIComponent(n.name)}`}
                  className="no-underline"
                >
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all group">
                    <span>{group.catIcon}</span>
                    <div>
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{group.catName}</span>
                      <span className="text-xs text-muted-foreground block">{group.services.length} listings</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Link
              href={`/directory?area=${encodeURIComponent(n.name)}`}
              className="no-underline"
            >
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all group">
                <span className="text-sm font-semibold text-primary">Browse all businesses in {n.name}</span>
                <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* Community Experiences */}
        <section id="community" ref={el => { sectionRefs.current["community"] = el; }}>
          <CommentSection targetType="neighborhood" targetId={n.id} />
        </section>
      </div>
    </PageLayout>
  );
}

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border text-center ${highlight ? "bg-primary/5 border-primary/20" : "bg-background border-border"}`}>
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-sm font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-primary">{icon}</span>
      <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">{title}</h2>
    </div>
  );
}
