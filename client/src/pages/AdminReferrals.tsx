import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Users, Clock, CheckCircle2, XCircle, Phone, Mail, MapPin, DollarSign, Calendar } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  matched: "bg-emerald-100 text-emerald-700",
  closed: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

const TYPE_LABELS: Record<string, string> = {
  buying: "Buying",
  selling: "Selling",
  renting: "Renting",
  relocating: "Relocating",
  investing: "Investing",
};

export default function AdminReferrals() {
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

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
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated && !user) return <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center text-muted-foreground">Loading...</div></div>;
  if (!user || user.role !== "admin") return <div className="min-h-screen bg-background"><Navbar /><div className="container py-20 text-center text-muted-foreground">Admin access required.</div></div>;

  const openEdit = (ref: any) => {
    setEditingId(ref.id);
    setEditStatus(ref.status);
    setEditNotes(ref.adminNotes || "");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Referral Management</h1>
            <p className="text-sm text-muted-foreground">Manage real estate referral leads</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Card><CardContent className="p-3 text-center"><Users className="w-5 h-5 mx-auto mb-1 text-blue-500" /><div className="text-xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Total</div></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" /><div className="text-xl font-bold">{stats.byStatus?.new || 0}</div><div className="text-xs text-muted-foreground">New</div></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><Phone className="w-5 h-5 mx-auto mb-1 text-yellow-500" /><div className="text-xl font-bold">{stats.byStatus?.contacted || 0}</div><div className="text-xs text-muted-foreground">Contacted</div></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" /><div className="text-xl font-bold">{(stats.byStatus?.matched || 0) + (stats.byStatus?.closed || 0)}</div><div className="text-xs text-muted-foreground">Matched/Closed</div></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><XCircle className="w-5 h-5 mx-auto mb-1 text-red-500" /><div className="text-xl font-bold">{stats.byStatus?.lost || 0}</div><div className="text-xs text-muted-foreground">Lost</div></CardContent></Card>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-3 mb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{referrals?.length ?? 0} referrals</span>
        </div>

        {/* Referral list */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading referrals...</div>
        ) : !referrals?.length ? (
          <div className="text-center py-12 text-muted-foreground">No referrals yet. They'll appear here when someone submits the Find a Realtor form.</div>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref) => (
              <Card key={ref.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(ref)}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-foreground">{ref.name}</span>
                        <Badge className={STATUS_COLORS[ref.status] || ""}>{ref.status}</Badge>
                        <Badge variant="outline">{TYPE_LABELS[ref.referralType] || ref.referralType}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{ref.email}</span>
                        {ref.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{ref.phone}</span>}
                        {ref.budget && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{ref.budget}</span>}
                        {ref.neighborhoods && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ref.neighborhoods}</span>}
                        {ref.timeline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{ref.timeline}</span>}
                      </div>
                      {ref.currentCity && <div className="text-sm text-muted-foreground mt-1">Moving from: {ref.currentCity}</div>}
                      {ref.notes && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{ref.notes}</div>}
                      {ref.adminNotes && <div className="text-sm text-amber-600 mt-1 italic">Admin: {ref.adminNotes}</div>}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(ref.createdAt).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Referral Status</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Internal notes about this lead..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={() => editingId && updateMutation.mutate({ id: editingId, status: editStatus as any, adminNotes: editNotes || undefined })} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
