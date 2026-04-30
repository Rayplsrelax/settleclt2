import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useSEO } from "@/hooks/useSEO";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash2, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { toast } from "sonner";

export default function AdminSubmissions() {
  useSEO({
    title: "Business Submissions | Admin",
    description: "Manage business listing submissions",
    path: "/admin/submissions",
  });

  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const pageSize = 20;
  const status = statusFilter === "all" ? undefined : (statusFilter as any);

  const { data, isLoading, refetch } = trpc.leads.adminList.useQuery({
    status,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      refetch();
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const deleteSubmission = trpc.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Submission deleted");
      refetch();
    },
    onError: () => {
      toast.error("Failed to delete submission");
    },
  });

  const submissions = data?.submissions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const filtered = useMemo(() => {
    if (!searchTerm) return submissions;
    const term = searchTerm.toLowerCase();
    return submissions.filter(
      (s: any) =>
        s.businessName.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term)
    );
  }, [submissions, searchTerm]);

  if (authLoading) {
    return (
      <PageLayout>
        <div className="py-20 text-center text-muted-foreground">
          Loading...
        </div>
      </PageLayout>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <PageLayout>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You don't have permission to view this page.
          </p>
        </div>
      </PageLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <PageLayout>
      <div className="py-8 md:py-12">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground">
              Business Submissions
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage all business listing submissions ({total} total)
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Input
              placeholder="Search by business name, contact, or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(0);
            }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold text-foreground">
                  {data ? total : "-"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Submissions</div>
                <div className="text-2xl font-bold text-foreground">
                  {total}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Page</div>
                <div className="text-2xl font-bold text-foreground">
                  {currentPage + 1} / {totalPages || 1}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading submissions...
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No submissions found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((submission: any) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">
                            {submission.businessName}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{submission.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {submission.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {submission.category}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(submission.status)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(submission.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setShowDetails(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {submission.status === "pending" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() =>
                                      updateStatus.mutate({
                                        id: submission.id,
                                        status: "approved",
                                      })
                                    }
                                    disabled={updateStatus.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() =>
                                      updateStatus.mutate({
                                        id: submission.id,
                                        status: "rejected",
                                      })
                                    }
                                    disabled={updateStatus.isPending}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  deleteSubmission.mutate({ id: submission.id })
                                }
                                disabled={deleteSubmission.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                }
                disabled={currentPage >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.businessName}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Contact Name
                  </label>
                  <p className="text-foreground">{selectedSubmission.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-foreground">{selectedSubmission.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Business Name
                  </label>
                  <p className="text-foreground">
                    {selectedSubmission.businessName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Category
                  </label>
                  <p className="text-foreground">{selectedSubmission.category}</p>
                </div>
                {selectedSubmission.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone
                    </label>
                    <p className="text-foreground">{selectedSubmission.phone}</p>
                  </div>
                )}
                {selectedSubmission.area && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Area
                    </label>
                    <p className="text-foreground">{selectedSubmission.area}</p>
                  </div>
                )}
                {selectedSubmission.website && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Website
                    </label>
                    <p className="text-foreground break-all">
                      <a
                        href={selectedSubmission.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedSubmission.website}
                      </a>
                    </p>
                  </div>
                )}
                {selectedSubmission.description && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Description
                    </label>
                    <p className="text-foreground">
                      {selectedSubmission.description}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedSubmission.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Submitted
                  </label>
                  <p className="text-foreground">
                    {formatDate(selectedSubmission.createdAt)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedSubmission.status === "pending" && (
                  <>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        updateStatus.mutate({
                          id: selectedSubmission.id,
                          status: "approved",
                        });
                        setShowDetails(false);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        updateStatus.mutate({
                          id: selectedSubmission.id,
                          status: "rejected",
                        });
                        setShowDetails(false);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </>
                )}
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    deleteSubmission.mutate({ id: selectedSubmission.id });
                    setShowDetails(false);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
