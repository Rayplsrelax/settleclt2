import { SERVICES, SERVICE_CATEGORIES, type Service } from "@shared/services";
import { useMemo, useRef, useCallback, useState } from "react";
import { useRoute, Link } from "wouter";
import { MapPin, Phone, ExternalLink, ArrowLeft, Clock, Star, Share2, Navigation, Building2, ChevronRight, Camera, ChevronLeft, X, Crown, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import ReviewSection from "@/components/ReviewSection";
import WishlistButton from "@/components/WishlistButton";
import QuickStampButton from "@/components/QuickStampButton";
import ClaimBusinessDialog from "@/components/ClaimBusinessDialog";
import ShareButtons from "@/components/ShareButtons";
import { MapView } from "@/components/Map";
import { useSEO } from "@/hooks/useSEO";
import { useStructuredData, buildLocalBusinessSchema, buildBreadcrumbSchema } from "@/hooks/useStructuredData";
import NotFound from "@/pages/NotFound";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Build a lookup map: slug -> Service
const SERVICE_MAP = new Map<string, Service>();
SERVICES.forEach((s) => {
  const slug = toSlug(s.name);
  if (!SERVICE_MAP.has(slug)) {
    SERVICE_MAP.set(slug, s);
  }
});

export default function BusinessDetail() {
  const [, params] = useRoute("/directory/:slug");
  const slug = params?.slug || "";
  const service = SERVICE_MAP.get(slug);
  const category = service ? SERVICE_CATEGORIES.find((c) => c.id === service.category) : null;

  // Fetch enrichment data for this business
  const { data: enrichment } = trpc.enrichment.getByKey.useQuery(
    { serviceKey: slug },
    { enabled: !!slug }
  );

  // Fetch premium tier for this business
  const { data: premiumData } = trpc.premium.getTier.useQuery(
    { serviceKey: slug },
    { enabled: !!slug }
  );

  // Parse hours from enrichment
  const hours = useMemo(() => {
    if (!enrichment?.hoursJson) return null;
    try {
      return JSON.parse(enrichment.hoursJson) as string[];
    } catch {
      return null;
    }
  }, [enrichment?.hoursJson]);

  // Parse photos from enrichment
  const photos = useMemo(() => {
    if (!enrichment?.photosJson) return null;
    try {
      return JSON.parse(enrichment.photosJson) as string[];
    } catch {
      return null;
    }
  }, [enrichment?.photosJson]);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Map ref for geocoding
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (!service) return;
      const address = enrichment?.verifiedAddress || `${service.name}, ${service.area}, Charlotte, NC`;
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          map.setCenter(results[0].geometry.location);
          map.setZoom(15);
          new google.maps.marker.AdvancedMarkerElement({
            map,
            position: results[0].geometry.location,
            title: service.name,
          });
        }
      });
    },
    [service, enrichment?.verifiedAddress]
  );

  // SEO
  useSEO({
    title: service ? `${service.name} — ${category?.name || "Directory"} | Settle CLT` : "Business Not Found | Settle CLT",
    description: service
      ? `${service.description} Located in ${service.area}, Charlotte NC. Phone: ${service.phone}. Read reviews and get directions.`
      : "This business listing was not found.",
  });

  // Structured data
  const structuredData = useMemo(() => {
    if (!service) return null;
    const localBusiness: Record<string, unknown> = {
      ...buildLocalBusinessSchema({
        name: service.name,
        description: service.description,
        phone: service.phone,
        website: service.website,
        area: service.area,
        category: category?.name || service.category,
      }),
    };
    // Add Google rating as aggregateRating if available
    if (enrichment?.googleRating) {
      localBusiness.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: enrichment.googleRating,
        reviewCount: enrichment.reviewCount || 1,
      };
    }
    // Add hours
    if (hours) {
      localBusiness.openingHours = hours;
    }
    // Add photos
    if (photos && photos.length > 0) {
      localBusiness.image = photos[0];
    }
    // Add price level
    if (enrichment?.priceLevel != null && enrichment.priceLevel > 0) {
      localBusiness.priceRange = "$".repeat(enrichment.priceLevel);
    }

    const breadcrumb = buildBreadcrumbSchema([
      { name: "Home", url: "https://settleclt.com" },
      { name: "Directory", url: "https://settleclt.com/directory" },
      ...(category
        ? [{ name: category.name, url: `https://settleclt.com/directory?category=${category.id}` }]
        : []),
      { name: service.name, url: `https://settleclt.com/directory/${slug}` },
    ]);

    return [
      { "@context": "https://schema.org", ...localBusiness },
      { "@context": "https://schema.org", ...breadcrumb },
    ];
  }, [service, enrichment, hours, photos, category, slug]);

  useStructuredData(structuredData);

  if (!service) {
    return <NotFound />;
  }

  // Lightbox modal component
  const lightboxModal = lightboxIndex !== null && photos && photos.length > 0 && (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={() => setLightboxIndex(null)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setLightboxIndex(Math.max(0, lightboxIndex - 1)); }}
        className={`absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 ${
          lightboxIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''
        }`}
        disabled={lightboxIndex === 0}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setLightboxIndex(Math.min(photos.length - 1, lightboxIndex + 1)); }}
        className={`absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 ${
          lightboxIndex === photos.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
        }`}
        disabled={lightboxIndex === photos.length - 1}
      >
        <ChevronRight className="w-6 h-6" />
      </button>
      <div className="max-w-4xl max-h-[85vh] px-16" onClick={(e) => e.stopPropagation()}>
        <img
          src={photos[lightboxIndex]}
          alt={`${service.name} photo ${lightboxIndex + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        <div className="text-center mt-3">
          <span className="text-white/70 text-sm">{lightboxIndex + 1} / {photos.length}</span>
        </div>
      </div>
    </div>
  );

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    enrichment?.verifiedAddress || `${service.name}, ${service.area}, Charlotte, NC`
  )}`;

  // Find related businesses in same category (exclude current)
  const relatedBusinesses = useMemo(() => {
    return SERVICES.filter((s) => s.category === service.category && toSlug(s.name) !== slug).slice(0, 6);
  }, [service.category, slug]);

  return (
    <div className="min-h-screen bg-background">
      {lightboxModal}
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/directory" className="hover:text-foreground transition-colors">Directory</Link>
            {category && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/directory?category=${category.id}`} className="hover:text-foreground transition-colors">
                  {category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{service.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Back button */}
        <Link href="/directory">
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </Button>
        </Link>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero card */}
            <Card className="overflow-hidden">
              {/* Photo gallery */}
              {photos && photos.length > 0 && (
                <div className="relative">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 max-h-[320px] overflow-hidden">
                    <button
                      onClick={() => setLightboxIndex(0)}
                      className="sm:col-span-2 relative overflow-hidden group cursor-pointer"
                    >
                      <img
                        src={photos[0]}
                        alt={service.name}
                        className="w-full h-[320px] object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                    {photos.length > 1 && (
                      <div className="hidden sm:grid grid-rows-3 gap-1">
                        {photos.slice(1, 4).map((photo, i) => (
                          <button
                            key={i}
                            onClick={() => setLightboxIndex(i + 1)}
                            className="relative overflow-hidden group cursor-pointer"
                          >
                            <img
                              src={photo}
                              alt={`${service.name} photo ${i + 2}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              style={{ minHeight: '100px' }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            {i === 2 && photos.length > 4 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">+{photos.length - 4} more</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setLightboxIndex(0)}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium flex items-center gap-1.5 transition-colors backdrop-blur-sm"
                  >
                    <Camera className="w-3.5 h-3.5" /> {photos.length} photos
                  </button>
                </div>
              )}

              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {category && <span className="text-2xl">{category.icon}</span>}
                      <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">{service.name}</h1>
                        {category && (
                          <Link href={`/directory?category=${category.id}`}>
                            <span className="text-sm text-primary hover:underline">{category.name}</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {premiumData?.tier === 'premium' && premiumData?.active && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs gap-1">
                          <Crown className="w-3 h-3" /> Premium Listing
                        </Badge>
                      )}
                      {premiumData?.tier === 'featured' && premiumData?.active && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs gap-1">
                          <Award className="w-3 h-3" /> Featured Listing
                        </Badge>
                      )}
                      {(!premiumData?.active || premiumData?.tier === 'basic') && service.featured && service.affiliate && (
                        <Badge className="bg-clt-gold/20 text-clt-gold border-clt-gold/30 text-xs">Featured Partner</Badge>
                      )}
                      <Badge variant="outline" className="gap-1 text-xs">
                        <MapPin className="w-3 h-3" /> {service.area}
                      </Badge>
                      {enrichment?.priceLevel != null && enrichment.priceLevel > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {"$".repeat(enrichment.priceLevel)}
                        </Badge>
                      )}
                    </div>

                    {/* Google rating */}
                    {enrichment?.googleRating && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-foreground">{enrichment.googleRating}</span>
                        </div>
                        {enrichment.reviewCount && (
                          <span className="text-sm text-muted-foreground">
                            ({enrichment.reviewCount.toLocaleString()} Google reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <QuickStampButton serviceKey={slug} area={service.area} />
                    <WishlistButton serviceKey={slug} />
                  </div>
                </div>

                {/* Description */}
                <p className="text-muted-foreground mt-4 leading-relaxed">{service.description}</p>

                {/* Action buttons row */}
                <div className="flex flex-wrap gap-2 mt-5">
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                      <Navigation className="w-3.5 h-3.5" /> Get Directions
                    </Button>
                  </a>
                  {service.phone && (
                    <a href={`tel:${service.phone}`}>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {service.phone}
                      </Button>
                    </a>
                  )}
                  {service.website && (
                    <a href={service.website} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" /> Visit Website
                      </Button>
                    </a>
                  )}
                  <ClaimBusinessDialog serviceKey={slug} businessName={service.name}>
                    <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" /> Claim This Business
                    </Button>
                  </ClaimBusinessDialog>
                </div>

                {/* Share */}
                <div className="mt-4 pt-4 border-t border-border">
                  <ShareButtons
                    url={`https://settleclt.com/directory/${slug}`}
                    title={`${service.name} — Charlotte, NC`}
                    description={service.description}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hours */}
            {hours && hours.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-primary" /> Business Hours
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hours.map((h, i) => {
                      const [day, ...timeParts] = h.split(": ");
                      const time = timeParts.join(": ");
                      const isToday = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === day?.toLowerCase();
                      return (
                        <div
                          key={i}
                          className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${
                            isToday ? "bg-primary/5 font-medium" : ""
                          }`}
                        >
                          <span className={isToday ? "text-primary" : "text-muted-foreground"}>{day}</span>
                          <span className="text-foreground">{time}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Map */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" /> Location
                </h2>
                {enrichment?.verifiedAddress && (
                  <p className="text-sm text-muted-foreground mb-3">{enrichment.verifiedAddress}</p>
                )}
                <div className="rounded-xl overflow-hidden border border-border">
                  <MapView
                    className="h-[300px]"
                    initialCenter={{ lat: 35.2271, lng: -80.8431 }}
                    initialZoom={13}
                    onMapReady={handleMapReady}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display font-semibold text-lg text-foreground mb-4">Community Reviews</h2>
                <ReviewSection targetType="directory" targetId={slug} />
              </CardContent>
            </Card>
          </div>

          {/* Right column: Sidebar */}
          <div className="space-y-6">
            {/* Quick info card */}
            <Card className="sticky top-4">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-display font-semibold text-foreground">Quick Info</h3>

                {enrichment?.verifiedAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{enrichment.verifiedAddress}</span>
                  </div>
                )}

                {(enrichment?.verifiedPhone || service.phone) && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${enrichment?.verifiedPhone || service.phone}`} className="text-sm text-primary hover:underline">
                      {enrichment?.verifiedPhone || service.phone}
                    </a>
                  </div>
                )}

                {service.website && (
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={service.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                      {service.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </a>
                  </div>
                )}

                <div className="pt-3 border-t border-border">
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                      <Navigation className="w-4 h-4" /> Get Directions
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Related businesses */}
            {relatedBusinesses.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-display font-semibold text-foreground mb-3">
                    More in {category?.name || "this category"}
                  </h3>
                  <div className="space-y-3">
                    {relatedBusinesses.map((r) => {
                      const rSlug = toSlug(r.name);
                      return (
                        <Link key={rSlug} href={`/directory/${rSlug}`}>
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{r.area}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <Link href={`/directory?category=${service.category}`}>
                    <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5">
                      View all {category?.name} <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
