import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Users, Clock, CheckCircle2, XCircle, Phone, Mail, MapPin,
  DollarSign, Calendar, TrendingUp, AlertTriangle, BarChart3, Target,
  ArrowRight, Home, Building2, RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  new: { label: "New", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Clock },
  contacted: { label: "Contacted", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: Phone },
  matched: { label: "Matched", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  closed: { label: "Closed Won", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: Target },
  lost: { label: "Lost", color: "text-red-700", bg: "text-red-50 border-red-200", icon: XCircle },
};

const TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  buying: { label: "Buying a Home", icon: Home, color: "text-teal-600" },
  selling: { label: "Selling a Home", icon: DollarSign, color: "text-amber-600" },
  renting: { label: "Renting", icon: Building2, color: "text-indigo-600" },
  relocating: { label: "Relocating", icon: MapPin, color: "text-rose-600" },
  investing: { label: "Investing", icon: TrendingUp, color: "text-emerald-600" },
};

function daysSince(date: string | Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyBadge(status: string, createdAt: string | Date) {
  if (status === "closed" || status === "lost") return null;
  const days = daysSince(createdAt);
  if (days > 5) return <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />Overdue ({days}d)</Badge>;
  if (days > 2) return <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">{days}d old</Badge>;
  if (days === 0) return <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">Today</Badge>;
  return <Badge variant="outline" className="text-[10px] px-1.5 py-0">{days}d ago</Badge>;
}

export default function AdminReferrals() {
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [view, setView] = useState<"dashboard" | "list">("dashboard");

  const { data: referrals, isLoading, refetch } = trpc.referrals.list.useQuery(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const { data: stats } = trpc.referrals.stats.useQuery();

  const updateMutation = trpc.referrals.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Referral updated");
      refetch();
      setEditingId(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredReferrals = useMemo(() => {
    if (!referrals) return [];
    if (typeFilter === "all") return referrals;
    return referrals.filter((r: any) => r.referralType === typeFilter);
  }, [referrals, typeFilter]);

  if (!isAuthenticated && !user) return <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center text-muted-foreground">Loading...</div></div>;
  if (!user || user.role !== "admin") return <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center text-muted-foreground">Admin access required.</div></div>;

  const openEdit = (ref: any) => {
    setEditingId(ref.id);
    setEditStatus(ref.status);
    setEditNotes(ref.adminNotes || "");
  };

  const byStatus = (stats?.byStatus || {}) as Record<string, number>;
  const byType = (stats?.byType || {}) as Record<string, number>;
  const pipelineStages = [
    { key: "new", label: "New", count: byStatus['new'] || 0 },
    { key: "contacted", label: "Contacted", count: byStatus['contacted'] || 0 },
    { key: "matched", label: "Matched", count: byStatus['matched'] || 0 },
    { key: "closed", label: "Closed", count: byStatus['closed'] || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container max-w-7xl py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Lead Management</h1>
              <p className="text-sm text-muted-foreground">Track and convert real estate referral leads</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "dashboard" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("dashboard")}
              className="gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />Dashboard
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("list")}
              className="gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />All Leads
            </Button>
          </div>
        </div>

        {view === "dashboard" ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Leads</span>
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold">{stats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time referrals</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <Target className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-bold text-emerald-600">{stats?.conversionRate || 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Closed / processed leads</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Needs Attention</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-bold text-amber-600">{byStatus['new'] || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">New / uncontacted leads</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Avg Lead Age</span>
                    <Clock className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-3xl font-bold">{stats?.avgAgeDays || 0}<span className="text-lg font-normal text-muted-foreground ml-1">days</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Open leads avg age</p>
                </CardContent>
              </Card>
            </div>

            {/* Pipeline Funnel */}
            <Card className="border-0 shadow-sm mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Pipeline Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {pipelineStages.map((stage, i) => {
                    const maxCount = Math.max(...pipelineStages.map(s => s.count), 1);
                    const widthPct = Math.max((stage.count / maxCount) * 100, 15);
                    const colors = ["bg-blue-500", "bg-yellow-500", "bg-emerald-500", "bg-green-600"];
                    return (
                      <div key={stage.key} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-center gap-1">
                          <div
                            className={`h-10 rounded-md ${colors[i]} flex items-center justify-center transition-all`}
                            style={{ width: `${widthPct}%`, minWidth: "40px" }}
                          >
                            <span className="text-white text-sm font-bold">{stage.count}</span>
                          </div>
                          {i < pipelineStages.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{stage.label}</span>
                      </div>
                    );
                  })}
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-center gap-1">
                      <div
                        className="h-10 rounded-md bg-red-400 flex items-center justify-center"
                        style={{ width: `${Math.max(((byStatus['lost'] || 0) / Math.max(...pipelineStages.map(s => s.count), 1)) * 100, 15)}%`, minWidth: "40px" }}
                      >
                        <span className="text-white text-sm font-bold">{byStatus['lost'] || 0}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Lost</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Two-column: Lead Types + Monthly Trend */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Lead Types Breakdown */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Leads by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(TYPE_LABELS).map(([key, config]) => {
                      const count = byType[key] || 0;
                      const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0;
                      const Icon = config.icon;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${config.color} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{config.label}</span>
                              <span className="text-sm text-muted-foreground">{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.monthlyTrend && stats.monthlyTrend.length > 0 ? (
                    <div className="flex items-end gap-2 h-40">
                      {stats.monthlyTrend.map((m: any) => {
                        const maxCount = Math.max(...stats.monthlyTrend.map((t: any) => t.count), 1);
                        const heightPct = (m.count / maxCount) * 100;
                        const monthLabel = new Date(m.month + "-01").toLocaleDateString("en-US", { month: "short" });
                        return (
                          <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            <span className="text-xs font-bold text-teal-700">{m.count}</span>
                            <div
                              className="w-full bg-teal-500 rounded-t-md transition-all min-h-[4px]"
                              style={{ height: `${heightPct}%` }}
                            />
                            <span className="text-[10px] text-muted-foreground">{monthLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                      No data yet. Leads will appear here as they come in.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Leads Quick View */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Leads</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setView("list")} className="text-xs gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </CardHeader>
              <CardContent>
                {stats?.recentLeads && stats.recentLeads.length > 0 ? (
                  <div className="divide-y">
                    {stats.recentLeads.map((lead: any) => {
                      const typeConfig = TYPE_LABELS[lead.referralType] || { label: lead.referralType, icon: Users, color: "text-gray-600" };
                      const TypeIcon = typeConfig.icon;
                      return (
                        <div key={lead.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                            <div>
                              <span className="text-sm font-medium">{lead.name}</span>
                              {lead.neighborhoods && (
                                <span className="text-xs text-muted-foreground ml-2">{lead.neighborhoods}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getUrgencyBadge(lead.status, lead.createdAt)}
                            <Badge className={`${STATUS_CONFIG[lead.status]?.bg || ""} ${STATUS_CONFIG[lead.status]?.color || ""} border text-[10px]`}>
                              {STATUS_CONFIG[lead.status]?.label || lead.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No leads yet. They'll appear here when someone submits the Find a Realtor form.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* List View */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="buying">Buying</SelectItem>
                  <SelectItem value="selling">Selling</SelectItem>
                  <SelectItem value="renting">Renting</SelectItem>
                  <SelectItem value="relocating">Relocating</SelectItem>
                  <SelectItem value="investing">Investing</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{filteredReferrals.length} leads</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />Refresh
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading leads...</div>
            ) : !filteredReferrals.length ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No leads found. They'll appear here when someone submits the Find a Realtor form.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredReferrals.map((ref: any) => {
                  const typeConfig = TYPE_LABELS[ref.referralType] || { label: ref.referralType, icon: Users, color: "text-gray-600" };
                  const TypeIcon = typeConfig.icon;
                  const days = daysSince(ref.createdAt);
                  const isOverdue = ["new", "contacted"].includes(ref.status) && days > 2;

                  return (
                    <Card
                      key={ref.id}
                      className={`border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isOverdue ? "border-l-4 border-l-amber-400" : ""}`}
                      onClick={() => openEdit(ref)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="font-semibold text-foreground text-base">{ref.name}</span>
                              <Badge className={`${STATUS_CONFIG[ref.status]?.bg || ""} ${STATUS_CONFIG[ref.status]?.color || ""} border`}>
                                {STATUS_CONFIG[ref.status]?.label || ref.status}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <TypeIcon className={`w-3 h-3 ${typeConfig.color}`} />
                                {typeConfig.label}
                              </Badge>
                              {getUrgencyBadge(ref.status, ref.createdAt)}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{ref.email}</span>
                              {ref.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{ref.phone}</span>}
                              {ref.budget && <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{ref.budget}</span>}
                              {ref.neighborhoods && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{ref.neighborhoods}</span>}
                              {ref.timeline && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{ref.timeline}</span>}
                              {ref.currentCity && <span className="flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" />From: {ref.currentCity}</span>}
                            </div>
                            {ref.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2 bg-gray-50 rounded px-2 py-1">{ref.notes}</p>}
                            {ref.adminNotes && <p className="text-sm text-amber-700 mt-2 italic bg-amber-50 rounded px-2 py-1">📝 {ref.adminNotes}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-muted-foreground">{new Date(ref.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{days === 0 ? "Today" : `${days}d ago`}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Lead Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="closed">Closed Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Internal notes — e.g., referred to agent X, client prefers South End..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button
              onClick={() => editingId && updateMutation.mutate({ id: editingId, status: editStatus as any, adminNotes: editNotes || undefined })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
