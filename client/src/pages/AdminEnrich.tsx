import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { SERVICES } from '@shared/services';
import { Link } from 'wouter';
import { Search, Star, MapPin, Phone, Clock, Globe, ChevronDown, ChevronUp, Check, X, ArrowLeft, Loader2, Shield, ExternalLink } from 'lucide-react';

// Generate a slug key from service name
function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  types: string[];
  businessStatus?: string;
  location?: { lat: number; lng: number };
};

type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  internationalPhone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  reviews?: Array<{ author_name: string; rating: number; text: string; time: number }>;
  hours?: string[];
  openNow?: boolean;
  location?: { lat: number; lng: number };
  priceLevel?: number;
  types?: string[];
  status: string;
};

export default function AdminEnrich() {
  const { user, loading: authLoading } = useAuth();
  const [selectedService, setSelectedService] = useState<typeof SERVICES[number] | null>(null);
  const [serviceSearch, setServiceSearch] = useState('');
  const [googleResults, setGoogleResults] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'search' | 'details' | 'applied'>('select');

  const searchPlaces = trpc.admin.searchPlaces.useMutation();
  const getDetails = trpc.admin.getPlaceDetails.useMutation();
  const applyEnrichment = trpc.admin.applyEnrichment.useMutation();
  const enrichments = trpc.admin.getAllEnrichments.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  // Filter services by search
  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return SERVICES.slice(0, 20);
    const q = serviceSearch.toLowerCase();
    return SERVICES.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.area.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [serviceSearch]);

  // Track which services are already enriched
  const enrichedKeys = useMemo(() => {
    const set = new Set<string>();
    if (enrichments.data) {
      for (const e of enrichments.data) {
        set.add(e.serviceKey);
      }
    }
    return set;
  }, [enrichments.data]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
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

  const handleSelectService = (service: typeof SERVICES[number]) => {
    setSelectedService(service);
    setGoogleResults([]);
    setSelectedPlace(null);
    setApplySuccess(null);
    setStep('search');
    // Auto-search
    searchPlaces.mutate({ query: service.name }, {
      onSuccess: (data) => {
        setGoogleResults(data.results);
      },
    });
  };

  const handleViewDetails = (placeId: string) => {
    getDetails.mutate({ placeId }, {
      onSuccess: (data) => {
        setSelectedPlace(data);
        setStep('details');
      },
    });
  };

  const handleApply = () => {
    if (!selectedService || !selectedPlace) return;
    const serviceKey = toSlug(selectedService.name);
    applyEnrichment.mutate({
      serviceKey,
      googlePlaceId: selectedPlace.placeId,
      googleRating: selectedPlace.rating?.toString(),
      reviewCount: selectedPlace.reviewCount,
      verifiedAddress: selectedPlace.address,
      verifiedPhone: selectedPlace.phone ?? selectedPlace.internationalPhone,
      hoursJson: selectedPlace.hours ? JSON.stringify(selectedPlace.hours) : undefined,
      googleTypes: selectedPlace.types ? JSON.stringify(selectedPlace.types) : undefined,
      priceLevel: selectedPlace.priceLevel,
    }, {
      onSuccess: () => {
        setApplySuccess(selectedService.name);
        setStep('applied');
        enrichments.refetch();
      },
    });
  };

  const handleReset = () => {
    setSelectedService(null);
    setGoogleResults([]);
    setSelectedPlace(null);
    setApplySuccess(null);
    setStep('select');
    setServiceSearch('');
  };

  const priceLevelLabel = (level?: number) => {
    if (level === undefined || level === null) return null;
    return ['Free', '$', '$$', '$$$', '$$$$'][level] ?? null;
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
            <h1 className="text-2xl font-bold">Directory Enrichment Tool</h1>
          </div>
          <p className="text-muted-foreground">
            Search Google Places to verify and enrich directory listings with ratings, hours, phone numbers, and addresses.
          </p>
          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-muted-foreground">
              Total listings: <strong className="text-foreground">{SERVICES.length}</strong>
            </span>
            <span className="text-muted-foreground">
              Enriched: <strong className="text-emerald-500">{enrichedKeys.size}</strong>
            </span>
            <span className="text-muted-foreground">
              Remaining: <strong className="text-amber-500">{SERVICES.length - enrichedKeys.size}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          {['Select Business', 'Search Google', 'Review Details', 'Applied'].map((label, i) => {
            const stepMap = ['select', 'search', 'details', 'applied'];
            const isActive = stepMap.indexOf(step) >= i;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-px ${isActive ? 'bg-primary' : 'bg-border'}`} />}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                  }`}>{i + 1}</span>
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step 1: Select a service */}
        {step === 'select' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select a business to enrich</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, category, or area..."
                value={serviceSearch}
                onChange={e => setServiceSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="grid gap-2">
              {filteredServices.map((service, i) => {
                const key = toSlug(service.name);
                const isEnriched = enrichedKeys.has(key);
                return (
                  <button
                    key={`${service.name}-${i}`}
                    onClick={() => handleSelectService(service)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors hover:border-primary/50 hover:bg-accent/50 ${
                      isEnriched ? 'border-emerald-500/30 bg-emerald-500/5' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{service.name}</span>
                          {isEnriched && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                              ENRICHED
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {service.category} · {service.area}
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
              {filteredServices.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No services match your search.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Google search results */}
        {step === 'search' && selectedService && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Google Places results for "{selectedService.name}"</h2>
                <p className="text-sm text-muted-foreground mt-1">Select the correct match to view details</p>
              </div>
              <button onClick={handleReset} className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to list
              </button>
            </div>

            {searchPlaces.isPending && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Searching Google Places...</span>
              </div>
            )}

            {searchPlaces.isError && (
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
                Error searching: {searchPlaces.error.message}
              </div>
            )}

            {googleResults.length > 0 && (
              <div className="grid gap-3">
                {googleResults.map(result => (
                  <div
                    key={result.placeId}
                    className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{result.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {result.address}
                          </span>
                        </div>
                        {result.rating && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="font-medium">{result.rating}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ({result.reviewCount?.toLocaleString()} reviews)
                            </span>
                          </div>
                        )}
                        {result.businessStatus && result.businessStatus !== 'OPERATIONAL' && (
                          <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                            {result.businessStatus}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleViewDetails(result.placeId)}
                        disabled={getDetails.isPending}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                      >
                        {getDetails.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'View Details'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searchPlaces.isPending && googleResults.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No results found. Try a different business.</p>
            )}
          </div>
        )}

        {/* Step 3: Place details + apply */}
        {step === 'details' && selectedPlace && selectedService && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Review enrichment data</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Applying to: <strong>{selectedService.name}</strong>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep('search')} className="px-4 py-2 rounded-lg border text-sm hover:bg-accent">
                  ← Back to results
                </button>
                <button
                  onClick={handleApply}
                  disabled={applyEnrichment.isPending}
                  className="px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {applyEnrichment.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Apply Enrichment
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Current data */}
              <div className="p-5 rounded-xl border bg-card">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Current Directory Data</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Name</span>
                    <p className="font-medium">{selectedService.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Category</span>
                    <p>{selectedService.category}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Area</span>
                    <p>{selectedService.area}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Phone</span>
                    <p>{selectedService.phone || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Website</span>
                    <p className="truncate">{selectedService.website || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Google data */}
              <div className="p-5 rounded-xl border-2 border-primary/30 bg-primary/5">
                <h3 className="font-semibold text-sm text-primary uppercase tracking-wider mb-4">Google Places Data</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Name</span>
                    <p className="font-medium">{selectedPlace.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Rating</span>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{selectedPlace.rating ?? '—'}</span>
                      <span className="text-sm text-muted-foreground">
                        ({selectedPlace.reviewCount?.toLocaleString() ?? 0} reviews)
                      </span>
                    </div>
                  </div>
                  {priceLevelLabel(selectedPlace.priceLevel) && (
                    <div>
                      <span className="text-xs text-muted-foreground">Price Level</span>
                      <p className="font-medium">{priceLevelLabel(selectedPlace.priceLevel)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-muted-foreground">Address</span>
                    <p className="flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {selectedPlace.address}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Phone</span>
                    <p className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedPlace.phone || selectedPlace.internationalPhone || '—'}
                    </p>
                  </div>
                  {selectedPlace.website && (
                    <div>
                      <span className="text-xs text-muted-foreground">Website</span>
                      <a href={selectedPlace.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline truncate">
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        {selectedPlace.website}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}
                  {selectedPlace.hours && selectedPlace.hours.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Business Hours
                      </span>
                      <div className="mt-1 space-y-0.5 text-sm">
                        {selectedPlace.hours.map((h, i) => (
                          <p key={i} className="text-muted-foreground">{h}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedPlace.reviews && selectedPlace.reviews.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Top Reviews</span>
                      <div className="mt-2 space-y-2">
                        {selectedPlace.reviews.slice(0, 3).map((r, i) => (
                          <div key={i} className="p-2 rounded bg-background/50 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-xs">{r.author_name}</span>
                              <span className="flex items-center gap-0.5 text-amber-500 text-xs">
                                <Star className="w-3 h-3 fill-current" /> {r.rating}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-xs line-clamp-2">{r.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'applied' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Enrichment Applied!</h2>
            <p className="text-muted-foreground mb-6">
              <strong>{applySuccess}</strong> has been enriched with Google Places data.
              The rating and review count will now appear on the directory listing.
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
            >
              Enrich Another Business
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
