import { useState, useEffect, useCallback } from "react";
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
  ExternalLink, ArrowRight, Crown, Sparkles, Shield
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useSEO } from "@/hooks/useSEO";

const DAY_LABELS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
  const { data: claims, isLoading: claimsLoading } = trpc.businessPortal.myClaims.useQuery(
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

  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [form, setForm] = useState({
    displayName: "",
    description: "",
    phone: "",
    website: "",
    email: "",
    hours: "{}",
    tagline: "",
    socialLinks: "{}",
  });

  const { data: override, refetch: refetchOverride } = trpc.businessPortal.getOverride.useQuery(
    { serviceKey: selectedClaim?.serviceKey ?? "" },
    { enabled: !!selectedClaim }
  );

  const { data: analytics } = trpc.premium.getAnalytics.useQuery(
    { serviceKey: selectedClaim?.serviceKey ?? "" },
    { enabled: !!selectedClaim }
  );

  const { data: tierInfo } = trpc.premium.getTier.useQuery(
    { serviceKey: selectedClaim?.serviceKey ?? "" },
    { enabled: !!selectedClaim }
  );

  const updateListing = trpc.businessPortal.updateListing.useMutation({
    onSuccess: () => {
      toast.success("Listing updated successfully!");
      refetchOverride();
    },
    onError: (err) => toast.error(err.message),
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

  const handleUpgrade = useCallback((tier: "featured" | "premium") => {
    if (!selectedClaim) return;
    createCheckout.mutate({
      tier,
      serviceKey: selectedClaim.serviceKey,
      businessName: selectedClaim.businessName,
      claimId: selectedClaim.id,
      origin: window.location.origin,
    });
  }, [selectedClaim, createCheckout]);

  // Load override data into form when available
  useEffect(() => {
    if (override) {
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
    }
  }, [override]);

  // Auto-select first claim
  useEffect(() => {
    if (claims?.length && !selectedClaim) {
      setSelectedClaim(claims[0]);
    }
  }, [claims, selectedClaim]);

  const handleSave = useCallback(() => {
    if (!selectedClaim) return;
    updateListing.mutate({
      serviceKey: selectedClaim.serviceKey,
      claimId: selectedClaim.id,
      ...form,
    });
  }, [selectedClaim, form, updateListing]);

  if (authLoading || claimsLoading) {
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

  if (!claims?.length) {
    return (
      <PageLayout>
        <div className="container py-20 text-center max-w-lg mx-auto">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl mb-2">No Claimed Businesses</h1>
          <p className="text-muted-foreground mb-6">
            You don't have any approved business claims yet. Visit the directory to claim your business.
          </p>
          <Link href="/directory">
            <Button className="gap-2">Browse Directory <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  const currentTier = tierInfo?.tier || "basic";

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
          {claims.length > 1 && (
            <select
              className="border rounded-md px-3 py-1.5 text-sm bg-background"
              value={selectedClaim?.id}
              onChange={(e) => {
                const claim = claims.find((c: any) => c.id === Number(e.target.value));
                setSelectedClaim(claim);
              }}
            >
              {claims.map((c: any) => (
                <option key={c.id} value={c.id}>{c.businessName}</option>
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
                  <h2 className="font-display font-bold text-xl">{selectedClaim?.businessName}</h2>
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified Owner
                  </Badge>
                  {currentTier !== "basic" && (
                    <Badge className={currentTier === "premium" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white gap-1" : "bg-clt-gold/20 text-clt-gold gap-1"}>
                      {currentTier === "premium" ? <Crown className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                      {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Service Key: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{selectedClaim?.serviceKey}</code>
                </p>
              </div>
              <Button onClick={handleSave} disabled={updateListing.isPending} className="gap-1.5 shrink-0">
                <Save className="w-4 h-4" />
                {updateListing.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details" className="gap-1.5"><Building2 className="w-3.5 h-3.5" /> Details</TabsTrigger>
            <TabsTrigger value="hours" className="gap-1.5"><Clock className="w-3.5 h-3.5" /> Hours</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Analytics</TabsTrigger>
            <TabsTrigger value="upgrade" className="gap-1.5"><Crown className="w-3.5 h-3.5" /> Upgrade</TabsTrigger>
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
                      placeholder={selectedClaim?.businessName}
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
                  <Button onClick={handleSave} disabled={updateListing.isPending} size="sm" className="gap-1.5">
                    <Save className="w-3.5 h-3.5" /> Save Hours
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-5 pb-4 text-center">
                      <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold">{analytics.views}</p>
                      <p className="text-sm text-muted-foreground">Views This Period</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4 text-center">
                      <MousePointerClick className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold">{analytics.clicks}</p>
                      <p className="text-sm text-muted-foreground">Clicks This Period</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4 text-center">
                      <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold">{analytics.leads}</p>
                      <p className="text-sm text-muted-foreground">Leads This Period</p>
                    </CardContent>
                  </Card>
                </div>
                {currentTier === "basic" && (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Crown className="w-5 h-5 text-amber-600 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Upgrade for detailed analytics</p>
                        <p className="text-xs text-muted-foreground">Featured and Premium tiers include click-through rates, visitor demographics, and weekly reports.</p>
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
                      disabled={createCheckout.isPending}
                    >
                      {createCheckout.isPending ? "Loading..." : "Upgrade to Featured"} <ArrowRight className="w-4 h-4" />
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
                      disabled={createCheckout.isPending}
                    >
                      {createCheckout.isPending ? "Loading..." : "Upgrade to Premium"} <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Manage existing subscription */}
            {currentTier !== "basic" && (
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
                      if (!selectedClaim) return;
                      manageSubscription.mutate({
                        serviceKey: selectedClaim.serviceKey,
                        origin: window.location.origin,
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
