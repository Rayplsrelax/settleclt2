import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { neighborhoods } from "@shared/neighborhoods";
import { useTagTrackingWithLookup } from "@/hooks/useTagTracking";

export default function FeaturedNeighborhoods() {
  const { trackClickByName } = useTagTrackingWithLookup();
  const featured = neighborhoods.filter(n => n.featured).slice(0, 4);

  return (
    <section className="py-16 md:py-20 bg-muted/50">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
              Popular Neighborhoods
            </h2>
            <p className="mt-2 text-muted-foreground">
              Where most newcomers start their search
            </p>
          </div>
          <Link
            href="/neighborhoods"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline no-underline"
          >
            View all 20 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map(n => (
            <Link
              key={n.id}
              href={`/neighborhood/${n.id}`}
              className="no-underline group"
            >
              <div className="relative rounded-xl overflow-hidden h-72 border border-border bg-card transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                <img
                  loading="lazy"
                  src={n.photoUrls[0]}
                  alt={`${n.name} neighborhood in Charlotte NC`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-5">
                  <h3 className="font-display font-bold text-lg text-white">
                    {n.name}
                  </h3>
                  <p className="text-sm text-white/80 mt-1">{n.vibe}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {n.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs hover:bg-white/25 cursor-pointer transition-colors"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          trackClickByName(
                            tag.replace(/[^\w\s]/g, "").trim(),
                            "home-neighborhood",
                            n.id
                          );
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/neighborhoods"
          className="sm:hidden flex items-center justify-center gap-1 mt-6 text-sm font-medium text-primary no-underline"
        >
          View all 20 neighborhoods <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
