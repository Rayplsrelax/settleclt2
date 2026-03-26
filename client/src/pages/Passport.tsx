import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Stamp, MapPin, Plus, Trash2, Calendar, StickyNote,
  Trophy, Map, Star, ChevronDown, ChevronUp, X, LogIn,
  Grid3X3, Award, Target, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SERVICES, type Service } from "@shared/services";
import { allNeighborhoods } from "@shared/neighborhoods";
import { toast } from "sonner";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function PassportContent() {
  const utils = trpc.useUtils();
  const { data: entries = [], isLoading } = trpc.passport.getEntries.useQuery();
  const addEntry = trpc.passport.addEntry.useMutation({
    onSuccess: () => {
      utils.passport.getEntries.invalidate();
      setShowAdd(false);
      setSelectedService("");
      setCustomPlace("");
      setNotes("");
      toast.success("Stamp collected! Added to your CLT Passport.");
    },
  });
  const deleteEntry = trpc.passport.deleteEntry.useMutation({
    onSuccess: () => {
      utils.passport.getEntries.invalidate();
      toast.success("Entry removed");
    },
  });

  const [showAdd, setShowAdd] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [customPlace, setCustomPlace] = useState("");
  const [notes, setNotes] = useState("");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Stats
  const uniqueNeighborhoods = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => { if (e.neighborhoodId) set.add(e.neighborhoodId); });
    return set.size;
  }, [entries]);

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return entries.filter(e => {
      const d = new Date(e.visitedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [entries]);

  // Service lookup
  const serviceMap = useMemo(() => {
    const m: Record<string, Service> = {};
    SERVICES.forEach(s => { m[slugify(s.name)] = s; });
    return m;
  }, []);

  const neighborhoodMap = useMemo(() => {
    const m: Record<string, string> = {};
    allNeighborhoods.forEach(n => { m[n.id] = n.name; });
    return m;
  }, []);

  function handleAdd() {
    const serviceKey = selectedService || undefined;
    const svc = serviceKey ? serviceMap[serviceKey] : undefined;
    const neighborhoodId = svc
      ? allNeighborhoods.find(n => n.name === svc.area)?.id
      : undefined;

    addEntry.mutate({
      serviceKey,
      customPlaceName: customPlace || undefined,
      neighborhoodId,
      notes: notes || undefined,
      visitedAt: new Date(visitDate),
    });
  }

  if (isLoading) {
    return (
      <div className="container py-12 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Stamp className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              CLT Passport
            </h1>
          </div>
          <p className="text-muted-foreground max-w-xl">
            Collect stamps for every place you visit in Charlotte. Track your exploration journey.
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? "Cancel" : "Add Stamp"}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="py-4 text-center">
            <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{entries.length}</div>
            <div className="text-xs text-muted-foreground">Total Stamps</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Map className="w-6 h-6 text-teal-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{uniqueNeighborhoods}</div>
            <div className="text-xs text-muted-foreground">Neighborhoods</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Star className="w-6 h-6 text-purple-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{thisMonthCount}</div>
            <div className="text-xs text-muted-foreground">This Month</div>
          </CardContent>
        </Card>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="mb-8 border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-lg">Add a Stamp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Select from Directory
              </label>
              <select
                value={selectedService}
                onChange={e => setSelectedService(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">-- Choose a place --</option>
                {SERVICES.map(s => (
                  <option key={slugify(s.name)} value={slugify(s.name)}>
                    {s.name} ({s.area})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-center text-xs text-muted-foreground">— or —</div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Custom Place Name
              </label>
              <input
                type="text"
                value={customPlace}
                onChange={e => setCustomPlace(e.target.value)}
                placeholder="e.g., That amazing taco truck on Trade St"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Date Visited
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={e => setVisitDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="What did you think?"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>
            <Button
              onClick={handleAdd}
              disabled={(!selectedService && !customPlace) || addEntry.isPending}
              className="w-full"
            >
              {addEntry.isPending ? "Adding..." : "Collect Stamp"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Entries list */}
      {entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Your passport is empty
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Start exploring Charlotte! Click "Add Stamp" above or visit places from the
              directory and mark them as visited.
            </p>
            <a
              href="/directory"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity no-underline"
            >
              Browse Directory
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Your Stamps ({entries.length})
          </h2>
          {entries.map(entry => {
            const svc = entry.serviceKey ? serviceMap[entry.serviceKey] : null;
            const placeName = svc?.name ?? entry.customPlaceName ?? "Unknown Place";
            const neighborhood = entry.neighborhoodId
              ? neighborhoodMap[entry.neighborhoodId]
              : svc?.area ?? null;
            const expanded = expandedId === entry.id;

            return (
              <Card
                key={entry.id}
                className="overflow-hidden hover:border-amber-500/30 transition-colors cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : entry.id)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Stamp className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {placeName}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {neighborhood && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {neighborhood}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(entry.visitedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  {expanded && (
                    <div className="mt-3 pt-3 border-t border-border">
                      {entry.notes && (
                        <div className="flex items-start gap-2 mb-3">
                          <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <p className="text-sm text-muted-foreground">{entry.notes}</p>
                        </div>
                      )}
                      {svc && (
                        <div className="text-xs text-muted-foreground mb-3">
                          Category: {svc.category} &middot; {svc.area}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive gap-1"
                        onClick={e => {
                          e.stopPropagation();
                          deleteEntry.mutate({ id: entry.id });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PassportLanding() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-amber-400" />
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-orange-300" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-yellow-400" />
        </div>
        <div className="container max-w-5xl relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
              <Stamp className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Your Charlotte Adventure Tracker</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Explore Charlotte.
              <br />
              <span className="text-amber-600">Collect Every Stamp.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              The CLT Passport tracks every place you visit in Charlotte. Collect stamps, complete bingo challenges, climb the leaderboard, and discover the Queen City like a local.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href={getLoginUrl()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors no-underline"
              >
                <LogIn className="w-4 h-4" />
                Start Your Passport
              </a>
              <Link href="/directory" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-background text-foreground font-semibold hover:bg-muted transition-colors no-underline">
                Browse Directory
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-background">
        <div className="container max-w-5xl">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Visit Places</h3>
              <p className="text-sm text-muted-foreground">
                Explore Charlotte's restaurants, breweries, parks, shops, and hidden gems across 20 neighborhoods.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Stamp className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Collect Stamps</h3>
              <p className="text-sm text-muted-foreground">
                Log each visit to earn stamps. Add notes, dates, and track which neighborhoods you've explored.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Earn Achievements</h3>
              <p className="text-sm text-muted-foreground">
                Complete bingo challenges, climb the leaderboard, and share your progress with friends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-5xl">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-12">What's Inside Your Passport</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Stamp className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Stamp Collection</h3>
                    <p className="text-sm text-muted-foreground">Track every place you visit with dates, notes, and neighborhood tags. Watch your collection grow.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Grid3X3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Bingo Challenges</h3>
                    <p className="text-sm text-muted-foreground">Complete themed bingo cards like "Brewery Tour," "Best Coffee in CLT," and "Date Night Spots."</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Leaderboard</h3>
                    <p className="text-sm text-muted-foreground">See how you rank among other CLT explorers. Top collectors earn bragging rights.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Shareable Cards</h3>
                    <p className="text-sm text-muted-foreground">Generate social-media-ready images of your bingo progress to share with friends.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-background">
        <div className="container max-w-3xl text-center">
          <Target className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            Ready to explore Charlotte?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Create a free account and start collecting stamps today. It takes less than 30 seconds.
          </p>
          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-amber-600 text-white font-semibold text-lg hover:bg-amber-700 transition-colors no-underline"
          >
            <LogIn className="w-5 h-5" />
            Get Your CLT Passport
          </a>
        </div>
      </section>
    </div>
  );
}

export default function Passport() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <PassportLanding />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PassportContent />
    </PageLayout>
  );
}
