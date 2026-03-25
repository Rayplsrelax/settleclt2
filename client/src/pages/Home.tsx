import PageLayout from "@/components/PageLayout";
import { Link } from "wouter";
import { neighborhoods } from "@shared/neighborhoods";
import { SERVICE_SUPER_GROUPS, SERVICE_CATEGORIES } from "@shared/services";
import { articles } from "@shared/articles";
import {
  ArrowRight,
  MapPin,
  Search,
  Building2,
  BookOpen,
  ChevronRight,
  Map,
  Compass,
  CheckCircle2,
  Mail,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const HERO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/charlotte-skyline-hero_b8e3deb7.jpg";

function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[520px] md:min-h-[600px] flex items-center">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt="Charlotte NC skyline"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-clt-navy/90 via-clt-navy/75 to-clt-navy/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-clt-navy/60 to-transparent" />
      </div>

      <div className="container relative z-10 py-20 md:py-28">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-6 border border-white/10">
            <MapPin className="w-3.5 h-3.5 text-clt-gold" />
            Charlotte, North Carolina
          </div>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
            Your complete guide to
            <span className="block text-clt-gold">settling in Charlotte</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/80 leading-relaxed max-w-xl">
            Explore 20 neighborhoods, discover 400+ local services, and get
            honest advice from people who actually live here.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/neighborhoods">
              <Button
                size="lg"
                className="bg-clt-teal hover:bg-clt-teal-dark text-white font-semibold px-6 shadow-lg shadow-clt-teal/20"
              >
                Explore Neighborhoods
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/directory">
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 text-white hover:bg-white/10 font-semibold px-6 backdrop-blur-sm"
              >
                Browse Directory
              </Button>
            </Link>
          </div>

          {/* Quick stats bar */}
          <div className="mt-10 flex flex-wrap gap-6 md:gap-10">
            {[
              { value: "20", label: "Neighborhoods" },
              { value: "400+", label: "Local Services" },
              { value: "40", label: "Categories" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-display font-extrabold text-clt-gold">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-white/60 mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <Compass className="w-7 h-7" />,
      title: "Pick Your Neighborhood",
      description:
        "Browse 20 Charlotte neighborhoods with honest reviews, cost breakdowns, and day-in-the-life stories from real residents.",
    },
    {
      icon: <Search className="w-7 h-7" />,
      title: "Find Local Services",
      description:
        "Search 400+ vetted Charlotte businesses — from movers and realtors to breweries and dog parks — filtered by your area.",
    },
    {
      icon: <CheckCircle2 className="w-7 h-7" />,
      title: "Get Settled",
      description:
        "Use our guides to set up utilities, transfer your license, find schools, and discover your new favorite spots.",
    },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            How Settle CLT Works
          </h2>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            Everything you need to move to Charlotte, in three steps
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className="relative text-center group">
              {/* Step number connector */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px border-t-2 border-dashed border-border" />
              )}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {step.icon}
              </div>
              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold absolute top-0 right-[calc(50%-40px)]">
                {i + 1}
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuizCTA() {
  return (
    <section className="py-14 md:py-18">
      <div className="container">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-clt-navy via-clt-navy to-clt-teal-dark p-8 md:p-12">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-clt-gold rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-clt-teal rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-clt-gold text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" /> 2-Minute Quiz
              </div>
              <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">
                Not sure where to live?
              </h2>
              <p className="text-white/70 max-w-md">
                Answer 6 quick questions about your budget, lifestyle, and priorities — we'll match you with the best Charlotte neighborhoods.
              </p>
            </div>
            <Link href="/quiz">
              <Button size="lg" className="bg-clt-gold hover:bg-clt-gold/90 text-clt-navy font-bold text-base px-8 py-6 rounded-xl shadow-lg gap-2 whitespace-nowrap">
                Take the Quiz <ArrowRight className="w-5 h-5" />
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
          {featured.map((n) => (
            <Link
              key={n.id}
              href={`/neighborhood/${n.id}`}
              className="no-underline group"
            >
              <div className="relative rounded-xl overflow-hidden h-72 border border-border bg-card transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                {/* Real photo background */}
                <img
                  src={n.photoUrls[0]}
                  alt={n.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-5">
                  <h3 className="font-display font-bold text-lg text-white">
                    {n.name}
                  </h3>
                  <p className="text-sm text-white/80 mt-1">{n.vibe}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {n.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs"
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

function DirectoryPreview() {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            400+ Charlotte Services
          </h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            From movers to mechanics, barbers to breweries — every service you
            need to get settled.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {SERVICE_SUPER_GROUPS.map((sg) => {
            const catCount = SERVICE_CATEGORIES.filter(
              (c) => c.group === sg.id
            ).length;
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
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {catCount} categories
                    </p>
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

function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      if (data.alreadySubscribed) {
        toast.info("You're already subscribed — welcome back!");
      } else {
        toast.success("You're in! Check your inbox for Charlotte tips.");
      }
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribe.mutate({ email, source: "homepage" });
  };

  return (
    <section className="py-16 md:py-20 bg-muted/50">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-5">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
            Get the Charlotte Insider Newsletter
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Weekly tips on neighborhoods, hidden gems, cost-saving hacks, and
            everything you need to know before (and after) your move.
          </p>

          {submitted ? (
            <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20 inline-flex flex-col items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <p className="font-display font-semibold text-foreground">
                You're on the list!
              </p>
              <p className="text-sm text-muted-foreground">
                Your first Charlotte insider email is on its way.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                placeholder="your@email.com"
              />
              <Button
                type="submit"
                size="lg"
                className="bg-primary text-primary-foreground font-semibold px-6 rounded-xl whitespace-nowrap"
                disabled={subscribe.isPending}
              >
                {subscribe.isPending ? "Joining..." : "Subscribe"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            Free forever. No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}

function BlogPreview() {
  const recent = articles.slice(0, 3);
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">
              Moving Guides
            </h2>
            <p className="mt-2 text-muted-foreground">
              Practical advice for your Charlotte move
            </p>
          </div>
          <Link
            href="/blog"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline no-underline"
          >
            All articles <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recent.map((a) => (
            <Link
              key={a.id}
              href={`/blog`}
              className="no-underline group"
            >
              <div className="rounded-xl overflow-hidden border border-border bg-card transition-all group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col">
                <div className="h-40 relative overflow-hidden" style={{ background: a.gradient }}>
                  {a.image ? (
                    <img
                      src={a.image}
                      alt={a.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-white/30" />
                    </div>
                  )}
                  {a.featured && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-clt-gold text-clt-navy text-xs font-bold">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-xs font-medium text-primary">
                    {a.category}
                  </span>
                  <h3 className="font-display font-semibold text-foreground mt-1 group-hover:text-primary transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 flex-1">
                    {a.excerpt}
                  </p>
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
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white">
            Own a Charlotte Business?
          </h2>
          <p className="mt-3 text-white/70 max-w-lg mx-auto">
            Get discovered by thousands of people moving to Charlotte. List your
            business for free.
          </p>
          <Link href="/list-your-business">
            <Button
              size="lg"
              className="mt-6 bg-clt-gold text-clt-navy font-bold hover:opacity-90"
            >
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
      <HowItWorks />
      <QuizCTA />
      <FeaturedNeighborhoods />
      <DirectoryPreview />
      <CTABanner />
      <NewsletterSignup />
      <BlogPreview />
    </PageLayout>
  );
}
