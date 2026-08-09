import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, Save, Globe, Phone, Mail, Clock, Image, Tag,
  CheckCircle2, BarChart3, Eye, MousePointerClick, Users,
  ExternalLink, ArrowRight, Crown, Sparkles, Shield, Trash2, Download, Inbox, Upload
} from "lucide-react";
import { PhotoUploader } from "@/components/PhotoUploader";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useSEO } from "@/hooks/useSEO";
import {
  getDefaultPortalTab,
  getPortalPermissionScopeKey,
  getRequestedUpgradeTier,
  getUpgradeBillingAction,
  getScopedPortalValue,
  reconcileSelectedMembership,
} from "@/lib/businessMembershipSelection";

const DAY_LABELS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const EMPTY_LISTING_FORM = {
  displayName: "",
  description: "",
  phone: "",
  website: "",
  email: "",
  hours: "{}",
  tagline: "",
  socialLinks: "{}",
};

function HoursEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = (() => {
    try { return JSON.parse(value || "{}"); } catch { return {}; }
  })();

  const updateDay = (day: string, val: string) => {
    const updated = { ...parsed, [day]: val };
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-2">
      {DAY_LABELS.map((day, i) => (
        <div key={day} className="flex items-center gap-3">
          <span className="text-sm font-medium w-24 text-muted-foreground">{DAY_NAMES[i]}</span>
          <Input
            placeholder="e.g. 9:00 AM - 5:00 PM or Closed"
            value={parsed[day] || ""}
            onChange={(e) => updateDay(day, e.target.value)}
            className="flex-1 text-sm"
          />
        </div>
      ))}
    </div>
  );
}

export default function MyBusiness() {
  const { user, isAuthenticated } = useAuth();

  useSEO({
    title: "My Business Dashboard",
    description: "Manage your claimed Charlotte business listing on Settle CLT — update info, view analytics, and upgrade to premium.",
    path: "/my-business",
  });
  const authLoading = false;
  const {
    data: memberships,
    isLoading: membershipsLoading,
    isFetching: membershipsFetching,
  } = trpc.businessPortal.myMemberships.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Handle Stripe checkout redirect results
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgradeStatus = params.get("upgrade");
    const tier = params.get("tier");
    if (upgradeStatus === "success" && tier) {
      toast.success(`Your ${tier} plan is now active! It may take a moment to reflect.`);
      // Clean up URL params
      window.history.replaceState({}, "", window.location.pathname);
    } else if (upgradeStatus === "canceled") {
      toast.info("Checkout was canceled. You can upgrade anytime.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const [selectedMembershipId, setSelectedMembershipId] = useState<number | null>(null);
  const [photoUrlState, setPhotoUrlState] = useState({ scopeKey: null as string | null, value: "" });
  const selectedMembership = reconcileSelectedMembership(memberships, selectedMembershipId);
  const photoUrl = photoUrlState.scopeKey === selectedMembership?.serviceKey ? photoUrlState.value : "";
  const setPhotoUrl = (value: string) => setPhotoUrlState({ scopeKey: selectedMembership?.serviceKey ?? null, value });
  const [formState, setFormState] = useState({
    scopeKey: null as string | null,
    value: EMPTY_LISTING_FORM,
  });

  const permissions = selectedMembership?.permissions ?? [];
  const canEdit = permissions.includes("edit_listing");
  const canViewAnalytics = permissions.includes("view_analytics");
  const canManageBilling = permissions.includes("manage_billing");
  const requestedUpgradeTier = getRequestedUpgradeTier(window.location.search);
  const portalPermissionScopeKey = getPortalPermissionScopeKey(selectedMembership?.id, permissions);
  const defaultPortalTab = getDefaultPortalTab(permissions, requestedUpgradeTier);
  const scopedForm = getScopedPortalValue(formState, selectedMembership?.serviceKey);
  const form = scopedForm ?? EMPTY_LISTING_FORM;
  const formIsCurrent = canEdit && scopedForm !== null;
  const setForm = useCallback((value: typeof EMPTY_LISTING_FORM) => {
    const scopeKey = selectedMembership?.serviceKey;
    if (!canEdit || !scopeKey) return;
    setFormState({ scopeKey, value });
  }, [canEdit, selectedMembership?.serviceKey]);

  const { data: override, refetch: refetchOverride } = trpc.businessPortal.getOverride.useQuery(
    { serviceKey: selectedMembership?.serviceKey ?? "" },
    { enabled: !!selectedMembership && canEdit }
  );

  const { data: analytics } = trpc.premium.getAnalytics.useQuery(
    { serviceKey: selectedMembership?.serviceKey ?? "" },
    { enabled: !!selectedMembership && canViewAnalytics }
  );

  const { data: tierInfo } = trpc.premium.getTier.useQuery(
    { serviceKey: selectedMembership?.serviceKey ?? "" },
    { enabled: !!selectedMembership }
  );
  const { data: photoLimit } = trpc.premium.getPhotoLimit.useQuery(
    { serviceKey: selectedMembership?.serviceKey ?? "" },
    { enabled: !!selectedMembership }
  );
  const { data: leads, refetch: refetchLeads } = trpc.premium.getLeads.useQuery(
    { serviceKey: selectedMembership?.serviceKey ?? "", limit: 50, offset: 0 },
    { enabled: !!selectedMembership && canViewAnalytics && tierInfo?.tier === "premium" && tierInfo.active }
  );
  const reportQuery = trpc.premium.getReport.useQuery(
    { serviceKey: selectedMembership?.serviceKey ?? "" },
    { enabled: false }
  );
  const ownerPhotos = override?.photoUrls?.split(",").filter(Boolean) ?? [];

  const updateListing = trpc.businessPortal.updateListing.useMutation({
    onSuccess: () => {
      toast.success("Listing updated successfully!");
      refetchOverride();
    },
    onError: (err) => toast.error(err.message),
  });
  const uploadPhoto = trpc.businessPortal.uploadPhoto.useMutation({
    onSuccess: () => {
      toast.success("Photo added to your gallery.");
      setPhotoUrl("");
      refetchOverride();
    },
    onError: error => toast.error(error.message),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPhotoFile = trpc.businessPortal.uploadPhotoFile.useMutation({
    onSuccess: () => {
      toast.success("Photo uploaded to your gallery.");
      refetchOverride();
    },
    onError: error => toast.error(error.message),
  });
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !selectedMembership) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB.");
        return;
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPEG, PNG, WebP, and GIF images are allowed.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        if (!base64) {
          toast.error("Failed to read image file.");
          return;
        }
        uploadPhotoFile.mutate({
          serviceKey: selectedMembership.serviceKey,
          fileName: file.name,
          contentType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: base64,
        });
      };
      reader.onerror = () => toast.error("Failed to read image file.");
      reader.readAsDataURL(file);
      // Reset input so the same file can be selected again
      event.target.value = "";
    },
    [selectedMembership, uploadPhotoFile],
  );
  const removePhoto = trpc.businessPortal.removePhoto.useMutation({
    onSuccess: () => {
      toast.success("Photo removed.");
      refetchOverride();
    },
    onError: error => toast.error(error.message),
  });
  const updateLeadStatus = trpc.premium.updateLeadStatus.useMutation({
    onSuccess: () => refetchLeads(),
    onError: error => toast.error(error.message),
  });

  const createCheckout = trpc.premium.createCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Redirecting to checkout...");
      window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  const manageSubscription = trpc.premium.manageSubscription.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleUpgrade = useCallback((tier: "featured" | "premium" | "pro") => {
    if (!selectedMembership || !canManageBilling) return;
    const serviceKey = selectedMembership.serviceKey;
    if (getUpgradeBillingAction(tierInfo?.tier ?? "basic", Boolean(tierInfo?.active)) === "portal") {
      manageSubscription.mutate({ serviceKey });
      return;
    }
    createCheckout.mutate({ tier, serviceKey });
  }, [selectedMembership, canManageBilling, tierInfo?.tier, tierInfo?.active, manageSubscription, createCheckout]);

  // Load override data into form when available
  useEffect(() => {
    if (canEdit && override && override.serviceKey === selectedMembership?.serviceKey) {
      setForm({
        displayName: override.displayName || "",
        description: override.description || "",
        phone: override.phone || "",
        website: override.website || "",
        email: override.email || "",
        hours: override.hours || "{}",
        tagline: override.tagline || "",
        socialLinks: override.socialLinks || "{}",
      });
    } else {
      setFormState({ scopeKey: null, value: EMPTY_LISTING_FORM });
    }
  }, [canEdit, override, selectedMembership?.serviceKey, setForm]);

  useEffect(() => {
    setPhotoUrlState({ scopeKey: selectedMembership?.serviceKey ?? null, value: "" });
  }, [selectedMembership?.serviceKey]);

  // Reconcile every refresh so revocation and role changes replace stale authority.
  useEffect(() => {
    const nextMembershipId = selectedMembership?.id ?? null;
    if (nextMembershipId !== selectedMembershipId) {
      setSelectedMembershipId(nextMembershipId);
    }
  }, [selectedMembership, selectedMembershipId]);

  const handleSave = useCallback(() => {
    if (!selectedMembership || !canEdit || !formIsCurrent) return;
    updateListing.mutate({
      serviceKey: selectedMembership.serviceKey,
      ...form,
    });
  }, [selectedMembership, canEdit, form, formIsCurrent, updateListing]);

  const downloadMonthlyReport = async () => {
    if (!selectedMembership) return;
    const result = await reportQuery.refetch();
    if (!result.data) {
      toast.error(result.error?.message ?? "Report is unavailable.");
      return;
    }
    const report = result.data;
    const text = [
      `Settle CLT Monthly Performance Report`,
      `Business: ${report.serviceKey}`,
      `Period: ${report.periodStart ?? "N/A"} to ${report.periodEnd ?? "N/A"}`,
      `Views: ${report.metrics.views}`,
      `Clicks: ${report.metrics.clicks}`,
      `Leads: ${report.metrics.leads}`,
      `Click-through rate: ${report.metrics.clickThroughRate}`,
      `Lead conversion rate: ${report.metrics.leadConversionRate}`,
      `Generated: ${report.generatedAt}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.serviceKey}-monthly-performance.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || membershipsLoading || membershipsFetching) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <div className="container py-20 text-center max-w-lg mx-auto">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl mb-2">Business Owner Portal</h1>
          <p className="text-muted-foreground mb-6">Sign in to manage your claimed business listing.</p>
          <a href={getLoginUrl()}>
            <Button className="gap-2">Sign In to Continue <ArrowRight className="w-4 h-4" /></Button>
          </a>
        </div>
      </PageLayout>
    );
  }

  if (!memberships?.length) {
    return (
      <PageLayout>
        <div className="container py-20 text-center max-w-lg mx-auto">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl mb-2">No Business Access</h1>
          <p className="text-muted-foreground mb-6">
            You don't have an active business membership yet. Visit the directory to claim your business.
          </p>
          <Link href="/directory">
            <Button className="gap-2">Browse Directory <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  const currentTier = tierInfo?.tier || "basic";
  const billingMutationPending = createCheckout.isPending || manageSubscription.isPending;

  return (
    <PageLayout>
      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              My Business
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your listing details, hours, and photos
            </p>
          </div>
          {memberships.length > 1 && (
            <select
              className="border rounded-md px-3 py-1.5 text-sm bg-background"
              value={selectedMembership?.id}
              onChange={(e) => {
                const membership = memberships.find(candidate => candidate.id === Number(e.target.value));
                setSelectedMembershipId(membership?.id ?? null);
              }}
            >
              {memberships.map(membership => (
                <option key={membership.id} value={membership.id}>{membership.serviceKey}</option>
              ))}
            </select>
          )}
        </div>

        {/* Business Header Card */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-xl">{selectedMembership?.serviceKey}</h2>
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {selectedMembership?.role}
                  </Badge>
                  {currentTier !== "basic" && (
                    <Badge className={currentTier === "premium" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white gap-1" : "bg-clt-gold/20 text-clt-gold gap-1"}>
                      {currentTier === "premium" ? <Crown className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                      {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Service Key: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{selectedMembership?.serviceKey}</code>
                </p>
              </div>
              {canEdit && (
                <Button onClick={handleSave} disabled={updateListing.isPending || !formIsCurrent} className="gap-1.5 shrink-0">
                  <Save className="w-4 h-4" />
                  {updateListing.isPending ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs key={portalPermissionScopeKey} defaultValue={defaultPortalTab ?? undefined} className="space-y-4">
          <TabsList>
            <TabsTrigger value="details" disabled={!canEdit} className="gap-1.5"><Building2 className="w-3.5 h-3.5" /> Details</TabsTrigger>
            <TabsTrigger value="hours" disabled={!canEdit} className="gap-1.5"><Clock className="w-3.5 h-3.5" /> Hours</TabsTrigger>
            <TabsTrigger value="photos" disabled={!canEdit} className="gap-1.5"><Image className="w-3.5 h-3.5" /> Photos</TabsTrigger>
            <TabsTrigger value="analytics" disabled={!canViewAnalytics} className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Analytics</TabsTrigger>
            <TabsTrigger value="upgrade" disabled={!canManageBilling} className="gap-1.5"><Crown className="w-3.5 h-3.5" /> Upgrade</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                  <CardDescription>Update your business name, description, and tagline</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      placeholder={selectedMembership?.serviceKey}
                      value={form.displayName}
                      onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Leave blank to use the original name</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      placeholder="A short description of your business"
                      value={form.tagline}
                      onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell visitors about your business..."
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                  <CardDescription>Keep your contact details up to date</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(704) 555-0123"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="hello@yourbusiness.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yourbusiness.com"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Hours Tab */}
          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Business Hours
                </CardTitle>
                <CardDescription>Set your opening hours for each day of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <HoursEditor value={form.hours} onChange={(v) => setForm({ ...form, hours: v })} />
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleSave} disabled={updateListing.isPending || !formIsCurrent} size="sm" className="gap-1.5">
                    <Save className="w-3.5 h-3.5" /> Save Hours
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Image className="w-4 h-4" /> Photo Gallery</CardTitle>
                <CardDescription>
                  {photoLimit?.limit
                    ? "Drag and drop photos to showcase your business."
                    : "Upgrade to Featured or Premium to add owner-managed photos."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {photoLimit?.limit && selectedMembership ? (
                  <PhotoUploader
                    photos={ownerPhotos}
                    photoLimit={photoLimit.limit}
                    tier={photoLimit.tier}
                    canEdit={canEdit}
                    onUploadFile={(data) =>
                      uploadPhotoFile.mutate({
                        serviceKey: selectedMembership.serviceKey,
                        fileName: data.fileName,
                        contentType: data.contentType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                        data: data.data,
                      })
                    }
                    onUploadUrl={(url) => {
                      if (photoUrlState.scopeKey !== selectedMembership.serviceKey) return;
                      uploadPhoto.mutate({ serviceKey: selectedMembership.serviceKey, photoUrl: url });
                    }}
                    onRemove={(url) =>
                      removePhoto.mutate({ serviceKey: selectedMembership.serviceKey, photoUrl: url })
                    }
                    isUploadingFile={uploadPhotoFile.isPending}
                    isUploadingUrl={uploadPhoto.isPending}
                    isRemoving={removePhoto.isPending}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No owner-managed photos yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {canViewAnalytics && analytics ? (
              <div className="space-y-4">
                {/* Metric cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <Eye className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold">{analytics.views}</p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <MousePointerClick className="w-6 h-6 text-green-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold">{analytics.clicks}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <Users className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold">{analytics.leads}</p>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <BarChart3 className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold">
                        {analytics.views > 0 ? ((analytics.clicks / analytics.views) * 100).toFixed(1) : "0.0"}%
                      </p>
                      <p className="text-xs text-muted-foreground">CTR</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Daily chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Views Over Time</CardTitle>
                    <CardDescription>Daily listing views for the last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AnalyticsChart data={reportQuery.data?.daily ?? []} metric="views" color="#0d9488" />
                  </CardContent>
                </Card>

                {/* Conversion funnel */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground mb-1">Click-through rate</p>
                      <p className="text-xl font-bold">
                        {analytics.views > 0 ? ((analytics.clicks / analytics.views) * 100).toFixed(1) : "0.0"}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Views → Clicks</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground mb-1">Lead conversion</p>
                      <p className="text-xl font-bold">
                        {analytics.clicks > 0 ? ((analytics.leads / analytics.clicks) * 100).toFixed(1) : "0.0"}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Clicks → Leads</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground mb-1">Overall conversion</p>
                      <p className="text-xl font-bold">
                        {analytics.views > 0 ? ((analytics.leads / analytics.views) * 100).toFixed(1) : "0.0"}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Views → Leads</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Lead pipeline + inbox */}
                {currentTier === "premium" && tierInfo?.active && (
                  <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-start">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2"><Inbox className="w-4 h-4" /> Lead Inbox</CardTitle>
                          {leads?.length ? (
                            <span className="text-xs text-muted-foreground">
                              {leads.filter(l => l.status === "new").length} new · {leads.length} total
                            </span>
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {leads?.length ? (
                          <div className="space-y-3">
                            {leads.map(lead => (
                              <div key={lead.id} className="rounded-lg border p-3 text-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div>
                                    <p className="font-medium">{lead.name}</p>
                                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
                                    {lead.phone && <p className="text-muted-foreground">{lead.phone}</p>}
                                  </div>
                                  <select
                                    className="border rounded-md px-2 py-1 bg-background text-xs"
                                    value={lead.status}
                                    onChange={event => updateLeadStatus.mutate({ leadId: lead.id, status: event.target.value as "new" | "contacted" | "qualified" | "closed" | "archived" })}
                                  >
                                    {['new', 'contacted', 'qualified', 'closed', 'archived'].map(status => <option key={status} value={status}>{status}</option>)}
                                  </select>
                                </div>
                                <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{lead.message}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No leads yet.</p>
                        )}
                      </CardContent>
                    </Card>
                    <Button variant="outline" className="gap-2" onClick={downloadMonthlyReport} disabled={reportQuery.isFetching}>
                      <Download className="w-4 h-4" /> {reportQuery.isFetching ? "Preparing..." : "Download Monthly Report"}
                    </Button>
                  </div>
                )}
                {currentTier === "basic" && (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Crown className="w-5 h-5 text-amber-600 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Upgrade for detailed analytics</p>
                        <p className="text-xs text-muted-foreground">Featured and Premium tiers include charts, CTR, lead pipeline, and monthly reports.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="py-12 text-center">
                <CardContent>
                  <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Analytics will appear once your listing starts receiving traffic.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Upgrade Tab */}
          <TabsContent value="upgrade">
            {requestedUpgradeTier && (
              <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="font-medium">Your selected plan is ready</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirm the selected plan below to continue to secure Stripe Checkout.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Basic Tier */}
              <Card className={currentTier === "basic" ? "border-primary ring-1 ring-primary/20" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Basic</CardTitle>
                    {currentTier === "basic" && <Badge>Current Plan</Badge>}
                  </div>
                  <CardDescription>Essential listing presence</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Verified owner badge</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Edit listing details</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Business hours</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Basic analytics</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Featured Tier */}
              <Card className={`${currentTier === "featured" ? "border-clt-gold ring-1 ring-clt-gold/20" : "border-clt-gold/30"} relative`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-clt-gold text-white">Most Popular</Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-clt-gold" /> Featured
                    </CardTitle>
                    {currentTier === "featured" && <Badge className="bg-clt-gold/20 text-clt-gold">Current</Badge>}
                  </div>
                  <CardDescription>Stand out in search results</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold mb-4">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Everything in Basic</li>
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-clt-gold" /> Featured badge on listing</li>
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-clt-gold" /> Priority placement in category</li>
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-clt-gold" /> Photo gallery (up to 5)</li>
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-clt-gold" /> Detailed click analytics</li>
                  </ul>
                  {currentTier === "basic" && (
                    <Button
                      className="w-full mt-4 bg-clt-gold hover:bg-clt-gold/90 text-white gap-1.5"
                      onClick={() => handleUpgrade("featured")}
                      disabled={billingMutationPending}
                    >
                      {billingMutationPending ? "Loading..." : "Upgrade to Featured"} <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Premium Tier */}
              <Card className={currentTier === "premium" ? "border-purple-500 ring-1 ring-purple-500/20" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-purple-600" /> Premium
                    </CardTitle>
                    {currentTier === "premium" && <Badge className="bg-purple-100 text-purple-700">Current</Badge>}
                  </div>
                  <CardDescription>Maximum visibility and leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold mb-4">$79<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Everything in Featured</li>
                    <li className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600" /> Premium badge + highlight</li>
                    <li className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600" /> Top of search results</li>
                    <li className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600" /> Photo gallery (up to 15)</li>
                    <li className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600" /> Lead generation analytics</li>
                    <li className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600" /> Monthly performance report</li>
                  </ul>
                  {currentTier !== "premium" && (
                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-1.5"
                      onClick={() => handleUpgrade("premium")}
                      disabled={billingMutationPending}
                    >
                      {billingMutationPending ? "Loading..." : "Upgrade to Premium"} <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Business Pro Tier */}
              <Card className={`${currentTier === "pro" ? "border-indigo-500 ring-1 ring-indigo-500/20" : "border-indigo-400/40"} relative`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">AI-Powered</Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> Business Pro
                    </CardTitle>
                    {currentTier === "pro" && <Badge className="bg-indigo-100 text-indigo-700">Current</Badge>}
                  </div>
                  <CardDescription>AI assistant, scheduling, content, and reputation automation</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold mb-4">$149<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Everything in Premium</li>
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600" /> AI Business Assistant (24/7 chat)</li>
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600" /> Smart scheduling capture</li>
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600" /> Social content drafts</li>
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600" /> Reputation autopilot</li>
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600" /> One-page web presence</li>
                    <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600" /> Photo gallery (up to 30)</li>
                  </ul>
                  {currentTier !== "pro" && (
                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-1.5"
                      onClick={() => handleUpgrade("pro")}
                      disabled={billingMutationPending}
                    >
                      {billingMutationPending ? "Loading..." : "Upgrade to Business Pro"} <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Manage existing subscription */}
            {canManageBilling && currentTier !== "basic" && (
              <div className="mt-6 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Manage your subscription</p>
                    <p className="text-xs text-muted-foreground">Update payment method, view invoices, or cancel your plan.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!selectedMembership) return;
                      manageSubscription.mutate({
                        serviceKey: selectedMembership.serviceKey,
                      });
                    }}
                    disabled={manageSubscription.isPending}
                    className="gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {manageSubscription.isPending ? "Loading..." : "Manage Billing"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
