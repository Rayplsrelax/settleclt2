import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { ArrowLeft, Building2, Calendar, CheckCircle2, Crown, DollarSign, ExternalLink, Home, MousePointerClick, Sparkles, Target, TrendingUp, Users } from "lucide-react";

const MONTHLY_TARGETS = [
  { label: "Featured listings", count: 20, price: 29, total: 580 },
  { label: "Premium listings", count: 10, price: 79, total: 790 },
  { label: "Weekend sponsors", count: 4, price: 99, total: 396 },
  { label: "Realtor referral closes", count: 1, price: 1500, total: 1500 },
];

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 text-primary p-2">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminRevenueOps() {
  const { user, loading: authLoading } = useAuth();
  const referralStats = trpc.referrals.stats.useQuery(undefined, { enabled: user?.role === "admin" });
  const claimStats = trpc.claims.stats.useQuery(undefined, { enabled: user?.role === "admin" });
  const premiumTiers = trpc.premium.getActiveTiers.useQuery(undefined, { enabled: user?.role === "admin" });
  const hermesSnapshot = trpc.hermesRevenueOps.snapshot.useQuery(undefined, { enabled: user?.role === "admin" });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="w-8 h-8 text-primary mx-auto mb-3 animate-pulse" />
          <p className="text-muted-foreground">Loading revenue operations...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin Only</h1>
          <p className="text-muted-foreground">You need admin access to view revenue operations.</p>
          <Link href="/" className="text-primary hover:underline mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  const activePremium = premiumTiers.data || [];
  const featuredCount = activePremium.filter((tier: any) => tier.tier === "featured").length;
  const premiumCount = activePremium.filter((tier: any) => tier.tier === "premium").length;
  const estimatedListingMrr = featuredCount * 29 + premiumCount * 79;
  const monthlyTarget = MONTHLY_TARGETS.reduce((sum, item) => sum + item.total, 0);
  const claimTotal = Number((claimStats.data as any)?.total || 0);
  const pendingClaims = Number((claimStats.data as any)?.pending || 0);
  const referralTotal = Number((referralStats.data as any)?.total || 0);
  const hotLeads = Number((referralStats.data as any)?.byPriority?.hot || 0);
  const dueActions = Number((referralStats.data as any)?.dueNextActions?.length || 0);
  const hermesTasks = ((hermesSnapshot.data as any)?.tasks || []) as any[];
  const hermesSummary = (hermesSnapshot.data as any)?.summary || {};
  const urgentHermesTasks = hermesTasks.filter(task => task.priority === "urgent").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="container max-w-7xl py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/blog" className="p-2 rounded-lg hover:bg-accent transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Revenue Operations</h1>
              <p className="text-sm text-muted-foreground">Claims, premium listings, realtor leads, event sponsors, and weekly operating priorities</p>
            </div>
          </div>
          <Link href="/business-pricing" className="text-sm text-primary hover:underline flex items-center gap-1">Public pricing <ExternalLink className="w-3 h-3" /></Link>
        </div>
      </div>

      <div className="container max-w-7xl py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Crown className="w-5 h-5" />} label="Estimated listing MRR" value={money(estimatedListingMrr)} hint={`${featuredCount} featured / ${premiumCount} premium`} />
          <StatCard icon={<Building2 className="w-5 h-5" />} label="Business claims" value={claimTotal} hint={`${pendingClaims} pending review`} />
          <StatCard icon={<Home className="w-5 h-5" />} label="Realtor leads" value={referralTotal} hint={`${hotLeads} hot leads`} />
          <StatCard icon={<Calendar className="w-5 h-5" />} label="Due follow-ups" value={dueActions} hint="realtor next actions" />
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Monthly revenue package target</h2>
            <p className="text-sm text-muted-foreground mt-1">Simple first target: turn the directory into a small recurring local revenue machine.</p>
            <div className="mt-5 space-y-3">
              {MONTHLY_TARGETS.map(item => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.count} × {money(item.price)}</p>
                  </div>
                  <p className="font-bold text-foreground">{money(item.total)}/mo</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-primary/10 border border-primary/20 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Target monthly value</p>
                <p className="text-3xl font-bold text-foreground">{money(monthlyTarget)}</p>
              </div>
              <TrendingUp className="w-9 h-9 text-primary" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Daily operator checklist</h2>
            <div className="mt-4 space-y-3 text-sm">
              <a href="/admin/referrals" className="flex gap-2 hover:text-primary"><Home className="w-4 h-4 mt-0.5" /> Review hot realtor leads and due next actions.</a>
              <a href="/admin/claims" className="flex gap-2 hover:text-primary"><Building2 className="w-4 h-4 mt-0.5" /> Approve legitimate business claims and pitch upgrades.</a>
              <a href="/admin/events" className="flex gap-2 hover:text-primary"><Calendar className="w-4 h-4 mt-0.5" /> Keep weekend events fresh and sell sponsor spots.</a>
              <a href="/admin/analytics" className="flex gap-2 hover:text-primary"><MousePointerClick className="w-4 h-4 mt-0.5" /> Check search/click trends for content and category gaps.</a>
              <a href="/business-pricing" className="flex gap-2 hover:text-primary"><Sparkles className="w-4 h-4 mt-0.5" /> Send owners to the pricing/claim upgrade funnel.</a>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Hermes Revenue Agent</h2>
          <p className="text-sm text-muted-foreground mt-1">Draft-only tasks for realtor leads, business claims, paid listing recovery, microsite launch checks, and weekly revenue summaries. Hermes does not send outreach automatically.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div className="rounded-lg border border-border bg-background p-3"><p className="text-xs text-muted-foreground">Draft-only tasks</p><p className="text-2xl font-bold">{hermesTasks.length}</p></div>
            <div className="rounded-lg border border-border bg-background p-3"><p className="text-xs text-muted-foreground">Urgent tasks</p><p className="text-2xl font-bold">{urgentHermesTasks}</p></div>
            <div className="rounded-lg border border-border bg-background p-3"><p className="text-xs text-muted-foreground">Past-due listings</p><p className="text-2xl font-bold">{Number(hermesSummary.pastDueListings || 0)}</p></div>
            <div className="rounded-lg border border-border bg-background p-3"><p className="text-xs text-muted-foreground">Ready microsites</p><p className="text-2xl font-bold">{Number(hermesSummary.readyMicrosites || 0)}</p></div>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            {hermesTasks.slice(0, 5).map(task => (
              <div key={task.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{task.title}</p>
                  <span className="text-xs uppercase text-muted-foreground">{task.priority}</span>
                </div>
                <p className="text-muted-foreground mt-1">{task.nextAction}</p>
                <p className="text-xs text-muted-foreground mt-1">Status: {task.status} · Auto-send: {String(task.sendAutomatically)}</p>
              </div>
            ))}
            {hermesTasks.length === 0 && <p className="text-muted-foreground">No Hermes revenue tasks are currently due.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Revenue lanes</h2>
          <div className="grid md:grid-cols-4 gap-4 mt-4 text-sm">
            <div className="rounded-lg border p-4"><p className="font-semibold">Realtor leads</p><p className="text-muted-foreground mt-1">Moving guide → quiz/find-home → scored lead → follow-up → commission/referral value.</p></div>
            <div className="rounded-lg border p-4"><p className="font-semibold">Business listings</p><p className="text-muted-foreground mt-1">Free claim → owner dashboard → Featured/Premium subscription.</p></div>
            <div className="rounded-lg border p-4"><p className="font-semibold">Events</p><p className="text-muted-foreground mt-1">Weekend traffic → featured events → sponsor packages.</p></div>
            <div className="rounded-lg border p-4"><p className="font-semibold">Microsites</p><p className="text-muted-foreground mt-1">Focused domains drive UTM traffic into the exact funnel.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
