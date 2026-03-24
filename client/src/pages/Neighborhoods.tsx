import PageLayout from "@/components/PageLayout";
import { Link } from "wouter";
import { neighborhoods } from "@shared/neighborhoods";
import { MapPin, ArrowRight, Home, TrendingUp, Train } from "lucide-react";

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-white/60">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

export default function Neighborhoods() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-clt-navy to-clt-teal-dark py-14 md:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <h1 className="font-display font-extrabold text-3xl md:text-4xl lg:text-5xl text-white">
              Charlotte Neighborhoods
            </h1>
            <p className="mt-4 text-lg text-white/70 leading-relaxed">
              Eight neighborhoods, eight completely different vibes. Find the one that fits your life.
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {neighborhoods.map((n) => (
              <Link key={n.id} href={`/neighborhood/${n.id}`} className="no-underline group">
                <div className="relative rounded-xl overflow-hidden border border-border bg-card hover:shadow-xl transition-all h-full">
                  <div className="h-48 relative">
                    <img src={n.photoUrls[0]} alt={n.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-white/70" />
                        <span className="text-xs text-white/70">{n.nearbyAreas.join(", ")}</span>
                      </div>
                      <h2 className="font-display font-bold text-xl text-white group-hover:text-clt-gold transition-colors">{n.name}</h2>
                      <p className="text-sm text-white/80 mt-0.5">{n.vibe}</p>
                    </div>
                    {n.featured && (
                      <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-clt-gold/90 text-clt-navy text-xs font-bold">Popular</span>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{n.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {n.tags.map((tag) => (
                        <span key={tag} className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">{tag}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-border">
                      <div className="text-center">
                        <Home className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Rent</p>
                        <p className="text-sm font-semibold text-foreground">{n.stats.avgRent}</p>
                      </div>
                      <div className="text-center">
                        <TrendingUp className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Walk Score</p>
                        <p className="text-sm font-semibold text-foreground">{n.stats.walkScore}</p>
                      </div>
                      <div className="text-center">
                        <Train className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Uptown</p>
                        <p className="text-sm font-semibold text-foreground">{n.stats.commuteToUptown}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      View full guide <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
