import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, Star, MapPin, Phone, Globe, Check, Trash2, Building2, RefreshCw, ArrowLeft, Shield, Loader2 } from "lucide-react";
import { SERVICES, SERVICE_CATEGORIES } from "../../../shared/services";
import { Link } from "wouter";
import { detectArea, CANONICAL_AREAS } from "../../../shared/areaDetection";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminEnrich() {
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("search");

  // Google Places search for NEW businesses
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Existing enrichment
  const [enrichServiceKey, setEnrichServiceKey] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

  const searchPlaces = trpc.admin.searchPlaces.useMutation();
  const getPlaceDetails = trpc.admin.getPlaceDetails.useMutation();
  const applyEnrichment = trpc.admin.applyEnrichment.useMutation();
  const addNewListing = trpc.admin.addNewListing.useMutation();
  const { data: existingListings, refetch: refetchListings } = trpc.admin.getDirectoryListings.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const updateListing = trpc.admin.updateListing.useMutation();
  const deleteListing = trpc.admin.deleteListing.useMutation();
  const enrichments = trpc.admin.getAllEnrichments.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const enrichedKeys = useMemo(() => {
    const set = new Set<string>();
    if (enrichments.data) {
      for (const e of enrichments.data) set.add(e.serviceKey);
    }
    return set;
  }, [enrichments.data]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return SERVICES.slice(0, 20);
    const q = serviceSearch.toLowerCase();
    return SERVICES.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.area.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [serviceSearch]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="text-muted-foreground">This page is only accessible to administrators.</p>
          <Link href="/" className="text-primary hover:underline">Go Home</Link>
        </div>
      </div>
    );
  }

  const handleGoogleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedPlace(null);
    try {
      const results = await searchPlaces.mutateAsync({ query: searchQuery + " Charlotte NC" });
      // The results come back with different shapes depending on the map proxy
      const mapped = (Array.isArray(results) ? results : (results as any).results || []).map((r: any) => ({
        name: r.name,
        address: r.formatted_address || r.vicinity || r.address || "",
        placeId: r.place_id || r.placeId,
        rating: r.rating,
        userRatingsTotal: r.user_ratings_total || r.reviewCount,
        types: r.types || [],
        priceLevel: r.price_level || r.priceLevel,
      }));
      setSearchResults(mapped);
      if (mapped.length === 0) {
        toast.error("No results — try a different search term.");
      }
    } catch (err: any) {
      toast.error(`Search failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = async (place: any) => {
    setIsLoadingDetails(true);
    try {
      const details = await getPlaceDetails.mutateAsync({ placeId: place.placeId });
      setSelectedPlace(details);
    } catch (err: any) {
      toast.error(`Failed to get details: ${err.message}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAddNewBusiness = async () => {
    if (!selectedPlace || !selectedCategory) {
      toast.error("Select a place and category first.");
      return;
    }
    try {
      const name = selectedPlace.name;
      const address = selectedPlace.formatted_address || selectedPlace.address || "";
      const phone = selectedPlace.phone || selectedPlace.internationalPhone;
      const website = selectedPlace.website;
      const rating = selectedPlace.rating;
      const reviewCount = selectedPlace.reviewCount;
      const hours = selectedPlace.hours;
      const types = selectedPlace.types;
      const priceLevel = selectedPlace.priceLevel;
      const placeId = selectedPlace.placeId;

      await addNewListing.mutateAsync({
        name,
        category: selectedCategory,
        description: `${rating ? `${rating}★ rated on Google` : ""} ${(types || []).slice(0, 3).join(", ")}`.trim() || undefined,
        area: detectArea(address, types),
        phone: phone || undefined,
        website: website || undefined,
        googlePlaceId: placeId,
        googleRating: rating?.toString() || undefined,
        reviewCount: reviewCount || undefined,
        verifiedAddress: address || undefined,
        hoursJson: hours ? JSON.stringify(hours) : undefined,
        googleTypes: types ? JSON.stringify(types) : undefined,
        priceLevel: priceLevel ?? undefined,
      });
      toast.success(`${name} added to the directory!`);
      setSelectedPlace(null);
      setSearchResults([]);
      setSearchQuery("");
      setSelectedCategory("");
      refetchListings();
    } catch (err: any) {
      toast.error(`Failed to add: ${err.message}`);
    }
  };

  const handleEnrichExisting = async (serviceKey: string) => {
    const service = SERVICES.find(s => toSlug(s.name) === serviceKey);
    if (!service) return;
    try {
      const results = await searchPlaces.mutateAsync({ query: `${service.name} Charlotte NC` });
      const resultsList = Array.isArray(results) ? results : (results as any).results || [];
      if (resultsList.length === 0) {
        toast.error("Google Places returned no results for this business.");
        return;
      }
      const placeId = resultsList[0].place_id || resultsList[0].placeId;
      const details = await getPlaceDetails.mutateAsync({ placeId });
      await applyEnrichment.mutateAsync({
        serviceKey,
        googlePlaceId: placeId,
        googleRating: details.rating?.toString(),
        reviewCount: details.reviewCount,
        verifiedAddress: details.address,
        verifiedPhone: details.phone || details.internationalPhone,
        hoursJson: details.hours ? JSON.stringify(details.hours) : undefined,
        googleTypes: details.types ? JSON.stringify(details.types) : undefined,
        priceLevel: details.priceLevel,
      });
      toast.success(`${service.name} enriched with Google Places data!`);
      enrichments.refetch();
    } catch (err: any) {
      toast.error(`Enrichment failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Directory Manager</h1>
          </div>
          <p className="text-muted-foreground">
            Search Google Places to add new businesses or enrich existing directory listings.
          </p>
          <div className="mt-3 flex gap-4 text-sm flex-wrap">
            <span className="text-muted-foreground">
              Static listings: <strong className="text-foreground">{SERVICES.length}</strong>
            </span>
            <span className="text-muted-foreground">
              Enriched: <strong className="text-emerald-500">{enrichedKeys.size}</strong>
            </span>
            <span className="text-muted-foreground">
              Custom added: <strong className="text-blue-500">{existingListings?.length || 0}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="search"><Search className="w-4 h-4 mr-2" />Add New Business</TabsTrigger>
            <TabsTrigger value="enrich"><RefreshCw className="w-4 h-4 mr-2" />Enrich Existing</TabsTrigger>
            <TabsTrigger value="manage"><Building2 className="w-4 h-4 mr-2" />Manage Added ({existingListings?.length || 0})</TabsTrigger>
          </TabsList>

          {/* ── TAB 1: Search Google Places & Add New ── */}
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Search Google Places
                </CardTitle>
                <CardDescription>Find any business in Charlotte and add it to your directory — not limited to existing listings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-3">
                  <Input
                    placeholder="Search for a business (e.g., 'Amelie's French Bakery', 'yoga studio NoDa', 'best pizza South End')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGoogleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleGoogleSearch} disabled={isSearching || !searchQuery.trim()}>
                    {isSearching ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                    Search
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && !selectedPlace && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      {searchResults.length} results found — click to select
                    </h3>
                    {searchResults.map((place: any) => (
                      <Card
                        key={place.placeId}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => handleSelectPlace(place)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{place.name}</h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 shrink-0" /> {place.address}
                              </p>
                            </div>
                            {place.rating && (
                              <Badge variant="secondary" className="flex items-center gap-1 shrink-0 ml-2">
                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                {place.rating} ({place.userRatingsTotal || 0})
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {isLoadingDetails && (
                  <div className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Loading business details...</p>
                  </div>
                )}

                {/* Selected Place Details + Category Picker */}
                {selectedPlace && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold">{selectedPlace.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 shrink-0" /> {selectedPlace.address}
                          </p>
                          {(selectedPlace.phone || selectedPlace.internationalPhone) && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3 shrink-0" /> {selectedPlace.phone || selectedPlace.internationalPhone}
                            </p>
                          )}
                          {selectedPlace.website && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Globe className="w-3 h-3 shrink-0" />
                              <a href={selectedPlace.website} target="_blank" rel="noopener" className="underline truncate">
                                {selectedPlace.website.replace(/^https?:\/\//, "").slice(0, 50)}
                              </a>
                            </p>
                          )}
                        </div>
                        {(selectedPlace.rating) && (
                          <div className="text-right shrink-0 ml-4">
                            <div className="flex items-center gap-1 text-lg font-bold">
                              <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                              {selectedPlace.rating}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {selectedPlace.reviewCount || 0} reviews
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedPlace.hours && selectedPlace.hours.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Hours</h4>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {selectedPlace.hours.map((h: string, i: number) => (
                              <p key={i}>{h}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detected area preview */}
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Label className="font-semibold text-sm">Detected Area:</Label>
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="w-3 h-3" />
                            {detectArea(selectedPlace.address || selectedPlace.formatted_address || "", selectedPlace.types)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">(auto-detected from address)</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <Label className="mb-2 block font-semibold">Assign a Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a directory category..." />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={handleAddNewBusiness} disabled={!selectedCategory || addNewListing.isPending} className="flex-1">
                          {addNewListing.isPending ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          Add to Directory
                        </Button>
                        <Button variant="outline" onClick={() => { setSelectedPlace(null); setSelectedCategory(""); }}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB 2: Enrich Existing Static Listings ── */}
          <TabsContent value="enrich">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" /> Enrich Existing Listings
                </CardTitle>
                <CardDescription>Add Google Places data (ratings, hours, address) to businesses already in the static directory.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, category, or area..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredServices.map((service, i) => {
                    const key = toSlug(service.name);
                    const isEnriched = enrichedKeys.has(key);
                    return (
                      <div
                        key={`${service.name}-${i}`}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isEnriched ? "border-emerald-500/30 bg-emerald-500/5" : "bg-card"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{service.name}</span>
                            {isEnriched && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">
                                <Check className="w-3 h-3 mr-1" /> Enriched
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{service.category} · {service.area}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 ml-2"
                          disabled={searchPlaces.isPending}
                          onClick={() => handleEnrichExisting(key)}
                        >
                          {searchPlaces.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                          {isEnriched ? "Re-enrich" : "Enrich"}
                        </Button>
                      </div>
                    );
                  })}
                  {filteredServices.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No services match your search.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB 3: Manage Added Listings ── */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" /> Manage Added Businesses
                </CardTitle>
                <CardDescription>Businesses you've added via Google Places search. These appear alongside the static directory.</CardDescription>
              </CardHeader>
              <CardContent>
                {!existingListings || existingListings.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No custom listings yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Use the "Add New Business" tab to search Google Places and add businesses.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {existingListings.map((listing: any) => (
                      <div key={listing.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold truncate">{listing.name}</h4>
                            {listing.featured && <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Featured</Badge>}
                            {!listing.active && <Badge variant="destructive">Inactive</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {SERVICE_CATEGORIES.find(c => c.id === listing.category)?.name || listing.category} · {listing.area}
                          </p>
                          {listing.googleRating && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {listing.googleRating} ({listing.reviewCount || 0} reviews)
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await updateListing.mutateAsync({ id: listing.id, featured: !listing.featured });
                              refetchListings();
                              toast.success(listing.featured ? "Unfeatured" : "Featured");
                            }}
                          >
                            <Star className={`w-3 h-3 ${listing.featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await updateListing.mutateAsync({ id: listing.id, active: !listing.active });
                              refetchListings();
                              toast.success(listing.active ? "Deactivated" : "Activated");
                            }}
                          >
                            {listing.active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (!confirm(`Delete ${listing.name}?`)) return;
                              await deleteListing.mutateAsync({ id: listing.id });
                              refetchListings();
                              toast.success(`${listing.name} removed.`);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
