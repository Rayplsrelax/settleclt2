import PageLayout from "@/components/PageLayout";
import { Link } from "wouter";
import { neighborhoods } from "@shared/neighborhoods";
import { SERVICE_SUPER_GROUPS, SERVICE_CATEGORIES } from "@shared/services";
import { articles } from "@shared/articles";
import { ArrowRight, MapPin, Search, Building2, BookOpen, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-clt-navy via-clt-navy to-clt-teal-dark py-20 md:py-28 lg:py-36">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-clt-teal rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-clt-gold rounded-full blur-3xl" />
      </div>
      <div className="container relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-6">
            <MapPin className="w-3.5 h-3.5" />
            Charlotte, North Carolina
          </div>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
            Your complete guide to
            <span className="block text-clt-gold">settling in Charlotte</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl">
            Explore 8 neighborhoods, discover 400+ local services, and get honest advice from people who actually live here.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/neighborhoods">
              <Button size="lg" className="bg-clt-teal hover:bg-clt-teal-dark text-white font-semibold px-6">
                Explore Neighborhoods
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/directory">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-semibold px-6">
                Browse Directory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedNeighborhoods() {
  const featured = neighborhoods.filter((n) => n.featured).slice(0, 4);
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">Popular Neighborhoods</h2>
            <p className="mt-2 text-muted-foreground">Where most newcomers start their search</p>
          </div>
          <Link href="/neighborhoods" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline no-underline">
            View all 8 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((n) => (
            <Link key={n.id} href={`/neighborhood/${n.id}`} className="no-underline group">
              <div className="relative rounded-xl overflow-hidden h-64 border border-border bg-card transition-all group-hover:shadow-lg group-hover:-translate-y-1">
                <div
                  className="absolute inset-0"
                  style={{ background: n.gradient }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-5">
                  <h3 className="font-display font-bold text-lg text-white">{n.name}</h3>
                  <p className="text-sm text-white/70 mt-1">{n.vibe}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {n.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-white/15 text-white text-xs">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/neighborhoods" className="sm:hidden flex items-center justify-center gap-1 mt-6 text-sm font-medium text-primary no-underline">
          View all 8 neighborhoods <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function DirectoryPreview() {
  return (
    <section className="py-16 md:py-20 bg-muted/50">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">400+ Charlotte Services</h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            From movers to mechanics, barbers to breweries — every service you need to get settled.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {SERVICE_SUPER_GROUPS.map((sg) => {
            const catCount = SERVICE_CATEGORIES.filter((c) => c.group === sg.id).length;
            return (
              <Link
                key={sg.id}
                href={`/directory?group=${sg.id}`}
                className="no-underline"
              >
                <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all text-center group">
                  <span className="text-3xl">{sg.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                      {sg.label.replace(sg.icon + " ", "")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{catCount} categories</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link href="/directory">
            <Button variant="outline" size="lg" className="font-semibold">
              <Search className="w-4 h-4 mr-2" />
              Browse Full Directory
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function QuoteForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitLead = trpc.leads.submitQuote.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Quote request submitted! We'll be in touch.");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    submitLead.mutate({ name, email, fromCity, moveDate });
  };

  if (submitted) {
    return (
      <section id="quote" className="py-16 md:py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center p-10 rounded-2xl bg-primary/5 border border-primary/20">
            <Star className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-display font-bold text-xl text-foreground">Request Received!</h3>
            <p className="mt-2 text-muted-foreground">We'll connect you with trusted Charlotte movers shortly.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="quote" className="py-16 md:py-20">
      <div className="container">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">Get Free Moving Quotes</h2>
            <p className="mt-2 text-muted-foreground">Compare prices from Charlotte's top-rated movers</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-2xl bg-card border border-border shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Your Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Moving From</label>
                <input
                  type="text"
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="New York, NY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Move Date</label>
                <input
                  type="date"
                  value={moveDate}
                  onChange={(e) => setMoveDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full mt-6 bg-primary text-primary-foreground font-semibold"
              disabled={submitLead.isPending}
            >
              {submitLead.isPending ? "Submitting..." : "Get Free Quotes"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">No spam. We connect you with verified Charlotte movers.</p>
          </form>
        </div>
      </div>
    </section>
  );
}

function BlogPreview() {
  const recent = articles.slice(0, 3);
  return (
    <section className="py-16 md:py-20 bg-muted/50">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">Moving Guides</h2>
            <p className="mt-2 text-muted-foreground">Practical advice for your Charlotte move</p>
          </div>
          <Link href="/blog" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline no-underline">
            All articles <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recent.map((a) => (
            <Link key={a.id} href={`/blog#${a.id}`} className="no-underline group">
              <div className="rounded-xl overflow-hidden border border-border bg-card hover:shadow-md transition-all h-full flex flex-col">
                <div className="h-36 relative" style={{ background: a.gradient }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white/40" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-xs font-medium text-primary">{a.category}</span>
                  <h3 className="font-display font-semibold text-foreground mt-1 group-hover:text-primary transition-colors">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 flex-1">{a.excerpt}</p>
                  <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                    <span>{a.date}</span>
                    <span>{a.readTime}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="rounded-2xl bg-gradient-to-r from-clt-navy to-clt-teal-dark p-8 md:p-12 text-center">
          <Building2 className="w-10 h-10 text-clt-gold mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white">Own a Charlotte Business?</h2>
          <p className="mt-3 text-white/70 max-w-lg mx-auto">
            Get discovered by thousands of people moving to Charlotte. List your business for free.
          </p>
          <Link href="/list-your-business">
            <Button size="lg" className="mt-6 bg-clt-gold text-clt-navy font-bold hover:opacity-90">
              List Your Business — Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <PageLayout>
      <Hero />
      <FeaturedNeighborhoods />
      <DirectoryPreview />
      <QuoteForm />
      <BlogPreview />
      <CTABanner />
    </PageLayout>
  );
}
