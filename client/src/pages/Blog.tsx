import PageLayout from "@/components/PageLayout";
import { articles, blogCategories } from "@shared/articles";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { BookOpen, Clock, Calendar } from "lucide-react";
import { useTagTrackingWithLookup } from "@/hooks/useTagTracking";
import { useSEO } from "@/hooks/useSEO";

interface UnifiedArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  gradient?: string;
  coverImage?: string | null;
  featured?: boolean;
  slug?: string;
  source: "static" | "db";
}

export default function Blog() {
  useSEO({
    title: "Charlotte Blog — Local Tips, Guides & Stories",
    description: "Read insider guides to Charlotte NC including neighborhood deep dives, best restaurants, weekend plans, moving tips, and local stories from people who live here.",
    keywords: "Charlotte blog, Charlotte NC tips, moving to Charlotte guide, Charlotte restaurants blog, Charlotte neighborhood guides, things to do Charlotte",
    path: "/blog",
  });

  const [activeCategory, setActiveCategory] = useState("All");
  const { trackClickByName } = useTagTrackingWithLookup();

  const { data: dbPosts = [] } = trpc.blog.getPublished.useQuery();

  // Merge static articles with DB posts
  const allArticles = useMemo(() => {
    const staticItems: UnifiedArticle[] = articles.map(a => ({
      id: a.id,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      date: a.date,
      readTime: a.readTime,
      gradient: a.gradient,
      coverImage: a.image || null,
      featured: a.featured,
      source: "static" as const,
    }));

    const dbItems: UnifiedArticle[] = dbPosts.map(p => ({
      id: `db-${p.id}`,
      title: p.title,
      excerpt: p.excerpt || p.content.slice(0, 150) + "...",
      category: p.category || "General",
      date: p.publishedAt
        ? new Date(p.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : new Date(p.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      readTime: p.readTime || "3 min read",
      coverImage: p.coverImage,
      slug: p.slug,
      source: "db" as const,
    }));

    // DB posts first (newest), then static
    return [...dbItems, ...staticItems];
  }, [dbPosts]);

  // Collect all categories
  const allCategories = useMemo(() => {
    const cats = new Set(["All", ...blogCategories]);
    dbPosts.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats);
  }, [dbPosts]);

  const filtered = activeCategory === "All"
    ? allArticles
    : allArticles.filter(a => a.category === activeCategory);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-clt-navy to-clt-teal-dark py-10 md:py-14">
        <div className="container">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white">Blog & Guides</h1>
          <p className="mt-2 text-white/70">Practical advice for your move to Charlotte</p>
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="container">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  if (cat !== 'All') trackClickByName(cat, 'blog-filter');
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Articles grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((a) => {
              const inner = (
                <article className="rounded-xl overflow-hidden border border-border bg-card hover:shadow-md transition-all group h-full">
                  <div className="h-44 relative overflow-hidden" style={a.coverImage ? {} : { background: a.gradient || "linear-gradient(135deg, #1a365d, #2d9c95)" }}>
                    {a.coverImage ? (
                      <img loading="lazy" src={a.coverImage} alt={`${a.title} - Settle CLT blog`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-white/30" />
                      </div>
                    )}
                    {a.featured && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-clt-gold/90 text-clt-navy text-xs font-bold">Featured</span>
                    )}
                    {a.source === "db" && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-xs font-bold">New</span>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-medium text-primary">{a.category}</span>
                    <h2 className="font-display font-semibold text-foreground mt-1 group-hover:text-primary transition-colors">{a.title}</h2>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{a.excerpt}</p>
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {a.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.readTime}</span>
                    </div>
                  </div>
                </article>
              );

              if (a.source === "db" && a.slug) {
                return (
                  <Link key={a.id} href={`/blog/${a.slug}`} className="no-underline">
                    {inner}
                  </Link>
                );
              }

              // Static articles — no detail page yet, just show in-place
              return <div key={a.id}>{inner}</div>;
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-foreground">No articles in this category yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Check back soon — we're always adding new guides.</p>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
