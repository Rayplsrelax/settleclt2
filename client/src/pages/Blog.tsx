import PageLayout from "@/components/PageLayout";
import { articles, blogCategories } from "@shared/articles";
import { useState } from "react";
import { BookOpen, Clock, Calendar } from "lucide-react";

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All" ? articles : articles.filter((a) => a.category === activeCategory);

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
            {blogCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
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
            {filtered.map((a) => (
              <article key={a.id} id={a.id} className="rounded-xl overflow-hidden border border-border bg-card hover:shadow-md transition-all group">
                <div className="h-40 relative" style={{ background: a.gradient }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-white/30" />
                  </div>
                  {a.featured && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-clt-gold/90 text-clt-navy text-xs font-bold">Featured</span>
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
            ))}
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
