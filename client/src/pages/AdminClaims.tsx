import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Building2, Clock, CheckCircle2, XCircle, Mail, Phone,
  User, Shield, AlertTriangle, BarChart3, RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  approved: { label: "Approved", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  employee: "Employee",
  authorized_rep: "Authorized Rep",
};

function daysSince(date: string | Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export default function AdminClaims() {
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: claims, isLoading, refetch } = trpc.claims.list.useQuery(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const { data: stats } = trpc.claims.stats.useQuery();
  const updateStatus = trpc.claims.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Claim status updated");
      refetch();
      setReviewingId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="text-muted-foreground mt-2">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  const reviewingClaim = claims?.find((c: any) => c.id === reviewingId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Admin
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Business Claims
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review and manage business ownership claims
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Claims</p>
                  <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-700">Pending Review</p>
                  <p className="text-2xl font-bold text-amber-700">{stats?.pending ?? 0}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700">Approved</p>
                  <p className="text-2xl font-bold text-green-700">{stats?.approved ?? 0}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-700">Rejected</p>
                  <p className="text-2xl font-bold text-red-700">{stats?.rejected ?? 0}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Claims</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {claims?.length ?? 0} claim{(claims?.length ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Claims List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !claims?.length ? (
          <Card className="py-12 text-center">
            <CardContent>
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No business claims yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {claims.map((claim: any) => {
              const statusConf = STATUS_CONFIG[claim.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConf.icon;
              const days = daysSince(claim.createdAt);
              return (
                <Card key={claim.id} className={`transition-all hover:shadow-sm ${claim.status === 'pending' ? 'border-amber-200' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Business Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{claim.businessName}</h3>
                          <Badge className={`${statusConf.bg} ${statusConf.color} border text-xs gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConf.label}
                          </Badge>
                          {claim.status === 'pending' && days > 3 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />{days}d waiting
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Service Key: <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{claim.serviceKey}</code>
                        </p>
                      </div>

                      {/* Claimant Info */}
                      <div className="space-y-1 text-sm shrink-0">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-medium">{claim.claimantName}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {ROLE_LABELS[claim.verificationMethod] || claim.verificationMethod}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Mail className="w-3 h-3" />
                          <a href={`mailto:${claim.claimantEmail}`} className="hover:text-primary">{claim.claimantEmail}</a>
                        </div>
                        {claim.claimantPhone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Phone className="w-3 h-3" />
                            <a href={`tel:${claim.claimantPhone}`} className="hover:text-primary">{claim.claimantPhone}</a>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {claim.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white gap-1"
                              onClick={() => {
                                setReviewingId(claim.id);
                                setReviewStatus("approved");
                                setReviewNotes(claim.adminNotes || "");
                              }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => {
                                setReviewingId(claim.id);
                                setReviewStatus("rejected");
                                setReviewNotes(claim.adminNotes || "");
                              }}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </>
                        )}
                        {claim.status !== "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewingId(claim.id);
                              setReviewStatus(claim.status);
                              setReviewNotes(claim.adminNotes || "");
                            }}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    {claim.message && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground text-xs">Message:</span>
                        <p className="mt-0.5 text-xs">{claim.message}</p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {claim.adminNotes && (
                      <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
                        <span className="font-medium">Admin Notes:</span> {claim.adminNotes}
                      </div>
                    )}

                    <div className="mt-2 text-[11px] text-muted-foreground">
                      Submitted {new Date(claim.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {claim.updatedAt !== claim.createdAt && (
                        <> · Updated {new Date(claim.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={!!reviewingId} onOpenChange={(v) => { if (!v) setReviewingId(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {reviewStatus === "approved" ? "Approve" : reviewStatus === "rejected" ? "Reject" : "Review"} Claim
              </DialogTitle>
            </DialogHeader>
            {reviewingClaim && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="font-semibold text-sm">{reviewingClaim.businessName}</p>
                  <p className="text-xs text-muted-foreground">
                    Claimed by {reviewingClaim.claimantName} ({ROLE_LABELS[reviewingClaim.verificationMethod] || reviewingClaim.verificationMethod})
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={reviewStatus} onValueChange={setReviewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this claim decision..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewingId(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (reviewingId && reviewStatus) {
                    updateStatus.mutate({
                      id: reviewingId,
                      status: reviewStatus as any,
                      adminNotes: reviewNotes || undefined,
                    });
                  }
                }}
                disabled={updateStatus.isPending}
                className={reviewStatus === "approved" ? "bg-green-600 hover:bg-green-700" : reviewStatus === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {updateStatus.isPending ? "Updating..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
