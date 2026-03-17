import PageLayout from "@/components/PageLayout";
import { Link, useParams, useLocation } from "wouter";
import { neighborhoods } from "@shared/neighborhoods";
import { useMyNeighborhood } from "@/hooks/useMyNeighborhood";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MapPin, Home, TrendingUp, Train, Shield, Dog, Moon, Baby, GraduationCap,
  ArrowRight, ChevronRight, Heart, Clock, DollarSign, Users, AlertTriangle,
  Calendar, Plane
} from "lucide-react";
import { useState } from "react";

const CITY_LABELS: Record<string, string> = {
  nyc: "New York City",
  chicago: "Chicago",
  atlanta: "Atlanta",
  dc: "Washington DC",
  houston: "Houston",
};

export default function NeighborhoodDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const n = neighborhoods.find((nb) => nb.id === params.id);
  const { myNeighborhood, setMyNeighborhood } = useMyNeighborhood();
  const [selectedCity, setSelectedCity] = useState<string>("nyc");

  if (!n) {
    setLocation("/404");
    return null;
  }

  const isMyNeighborhood = myNeighborhood === n.id;

  const handleSetMyNeighborhood = () => {
    setMyNeighborhood(n.id);
    toast.success(`${n.name} is now your neighborhood! Directory results will be personalized.`);
  };

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28" style={{ background: n.gradient }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="container relative z-10">
          <Link href="/neighborhoods" className="inline-flex items-center gap-1 text-white/60 text-sm hover:text-white/80 no-underline mb-4">
            <ChevronRight className="w-3 h-3 rotate-180" /> All Neighborhoods
          </Link>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-white">{n.name}</h1>
          <p className="mt-3 text-xl text-white/80">{n.vibe}</p>
          <div className="flex flex-wrap gap-2 mt-5">
            {n.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/15 text-white text-sm">{tag}</span>
            ))}
          </div>
          <div className="mt-6">
            {isMyNeighborhood ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 text-white text-sm font-medium">
                <Heart className="w-4 h-4 fill-current" /> This is your neighborhood
              </span>
            ) : (
              <Button onClick={handleSetMyNeighborhood} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Heart className="w-4 h-4 mr-2" /> I'm moving here
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-card border-b border-border">
        <div className="container py-4 overflow-x-auto">
          <div className="flex items-center gap-6 min-w-max">
            <StatItem icon={<DollarSign className="w-4 h-4" />} label="Avg Rent" value={n.stats.avgRent} />
            <StatItem icon={<Home className="w-4 h-4" />} label="Home Price" value={n.stats.medianHomePrice} />
            <StatItem icon={<TrendingUp className="w-4 h-4" />} label="Walk Score" value={String(n.stats.walkScore)} />
            <StatItem icon={<Train className="w-4 h-4" />} label="To Uptown" value={n.stats.commuteToUptown} />
            <StatItem icon={<GraduationCap className="w-4 h-4" />} label="Schools" value={n.stats.schoolTier} />
            <StatItem icon={<Shield className="w-4 h-4" />} label="Crime" value={n.stats.crimeLevel} />
            <StatItem icon={<Moon className="w-4 h-4" />} label="Nightlife" value={n.stats.nightlifeLevel} />
            <StatItem icon={<Dog className="w-4 h-4" />} label="Pet Score" value={`${n.stats.petFriendly}/5`} />
            <StatItem icon={<Baby className="w-4 h-4" />} label="Family" value={`${n.stats.familyScore}/5`} />
          </div>
        </div>
      </section>

      {/* Content sections */}
      <div className="container py-12 md:py-16 space-y-16">
        {/* Day in the Life */}
        <ContentSection icon={<Clock className="w-5 h-5" />} title="A Day in the Life">
          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
            {n.dayInTheLife.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </ContentSection>

        {/* Cost Reality */}
        <ContentSection icon={<DollarSign className="w-5 h-5" />} title="Cost Reality">
          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
            {n.costReality.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </ContentSection>

        {/* Who Lives Here */}
        <ContentSection icon={<Users className="w-5 h-5" />} title="Who Lives Here">
          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
            {n.whoLivesHere.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </ContentSection>

        {/* Honest Truth */}
        <ContentSection icon={<AlertTriangle className="w-5 h-5" />} title="The Honest Truth">
          <div className="p-5 rounded-xl bg-destructive/5 border border-destructive/10">
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
              {n.honestTruth.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </ContentSection>

        {/* First Weekend */}
        <ContentSection icon={<Calendar className="w-5 h-5" />} title="Your First 48 Hours">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {n.firstWeekend.map((tip, i) => (
              <div key={i} className="p-5 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold">{i + 1}</span>
                  <h4 className="font-display font-semibold text-sm text-foreground">{tip.action}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{tip.why}</p>
                <p className="mt-3 text-xs text-primary font-medium">Tip: {tip.tip}</p>
              </div>
            ))}
          </div>
        </ContentSection>

        {/* Moving From */}
        <ContentSection icon={<Plane className="w-5 h-5" />} title="If You're Moving From...">
          <div className="flex flex-wrap gap-2 mb-5">
            {Object.keys(n.movingFrom).map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCity === city
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {CITY_LABELS[city] || city}
              </button>
            ))}
          </div>
          <div className="p-5 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">{n.movingFrom[selectedCity]}</p>
          </div>
        </ContentSection>

        {/* Directory CTAs */}
        <ContentSection icon={<MapPin className="w-5 h-5" />} title={`Services in ${n.name}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {n.directoryCtaLinks.map((cta) => (
              <Link
                key={cta.label}
                href={`/directory?category=${encodeURIComponent(cta.category)}&area=${encodeURIComponent(cta.area)}&neighborhood=${encodeURIComponent(n.name)}`}
                className="no-underline"
              >
                <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all group">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{cta.label}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </ContentSection>
      </div>
    </PageLayout>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ContentSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-primary">{icon}</span>
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}
