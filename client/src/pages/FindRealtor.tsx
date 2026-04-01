import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Home, MapPin, CheckCircle2, Building2, TrendingUp, Users,
  ArrowRight, Shield, Clock, MessageSquare, ChevronDown, ChevronUp,
  DollarSign, Search, UserCheck
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";

const BUYING_BUDGET_RANGES = [
  "Under $200K",
  "$200K - $350K",
  "$350K - $500K",
  "$500K - $750K",
  "$750K - $1M",
  "$1M+",
  "Not sure yet",
];

const RENTAL_BUDGET_RANGES = [
  "Under $1,200/mo",
  "$1,200 - $1,500/mo",
  "$1,500 - $1,800/mo",
  "$1,800 - $2,200/mo",
  "$2,200 - $3,000/mo",
  "$3,000+/mo",
  "Not sure yet",
];

const TIMELINES = [
  "ASAP (within 30 days)",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "Just exploring",
];

const FAQ_ITEMS = [
  {
    q: "Is this really free?",
    a: "Yes, 100% free for you. Real estate agents pay referral fees to the referring broker, so there's no cost to you at any point.",
  },
  {
    q: "How quickly will I hear back?",
    a: "We aim to connect you with an agent within 48 business hours. Many people hear back the same day.",
  },
  {
    q: "Can you help me find an apartment?",
    a: "Absolutely. We work with apartment locators and leasing specialists who know the Charlotte rental market inside and out. This service is also free — apartment communities pay the locator directly.",
  },
  {
    q: "What if I don't like the agent?",
    a: "No obligations. If the match isn't right, let us know and we'll connect you with someone else.",
  },
  {
    q: "Do you cover areas outside Charlotte?",
    a: "We can refer you to trusted agents anywhere in North Carolina, South Carolina, and across the US. Just tell us where you're looking.",
  },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-16 bg-muted/30">
      <div className="container max-w-2xl">
        <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="font-semibold text-sm text-foreground">{item.q}</span>
                {open === i ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-4 pb-4 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-200">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function FindRealtor() {
  useSEO({
    title: "Find Your Home in Charlotte — Free Matching Service",
    description: "Get matched with a trusted Charlotte real estate agent for buying, selling, renting, or relocating. Free service — tell us what you need and we'll connect you.",
    keywords: "Charlotte homes, Charlotte apartments, buy house Charlotte NC, Charlotte homes for sale, Charlotte relocation, find home Charlotte, Charlotte rentals",
    path: "/find-your-home",
  });

  const [submitted, setSubmitted] = useState(false);

  // Pre-fill from URL params (quiz → find your home flow) on initial render
  const [form, setForm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const neighborhoods = params.get("neighborhoods") || "";
    const type = params.get("type");
    const source = params.get("source");
    const budget = params.get("budget") || "";
    let referralType = "" as "buying" | "selling" | "renting" | "relocating" | "investing" | "";
    if (type === "renting") referralType = "renting";
    else if (type === "buying") referralType = "buying";
    const notes = source === "quiz" ? "Came from the neighborhood quiz" : "";
    return {
      name: "",
      email: "",
      phone: "",
      referralType,
      budget,
      neighborhoods,
      timeline: "",
      notes,
      currentCity: "",
    };
  });

  const submitMutation = trpc.referrals.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Your request has been submitted! We'll be in touch soon.");
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.referralType) {
      toast.error("Please fill in your name, email, and what you're looking for.");
      return;
    }
    submitMutation.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      referralType: form.referralType as any,
      budget: form.budget || undefined,
      neighborhoods: form.neighborhoods || undefined,
      timeline: form.timeline || undefined,
      notes: form.notes || undefined,
      currentCity: form.currentCity || undefined,
    });
  };

  const isRenting = form.referralType === "renting";
  const budgetRanges = isRenting ? RENTAL_BUDGET_RANGES : BUYING_BUDGET_RANGES;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-2xl py-20 text-center">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">
            Request Received!
          </h1>
          <p className="text-lg text-muted-foreground mb-4 max-w-md mx-auto">
            We've got your info and will connect you with a trusted Charlotte {isRenting ? "apartment specialist" : "real estate professional"} within 48 business hours.
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            In the meantime, explore neighborhoods to get a head start on your search.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/neighborhoods">
              <Button variant="outline" size="lg" className="gap-2">
                <MapPin className="w-4 h-4" /> Explore Neighborhoods
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="lg">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-16 md:py-24">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Home className="w-4 h-4" />
                Free Home Matching
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
                Find Your Perfect Charlotte Home
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Whether you're buying your first home, renting an apartment, or relocating to Charlotte — we'll connect you with a trusted local expert who knows the Queen City inside and out.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  100% free service
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Vetted local agents
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  48hr business response
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/80 backdrop-blur border-emerald-100">
                <CardContent className="p-4 text-center">
                  <Building2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">20+</div>
                  <div className="text-xs text-muted-foreground">Neighborhoods Covered</div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur border-emerald-100">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">Top 5</div>
                  <div className="text-xs text-muted-foreground">Fastest Growing US City</div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur border-emerald-100">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">100+</div>
                  <div className="text-xs text-muted-foreground">People Move Daily</div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur border-emerald-100">
                <CardContent className="p-4 text-center">
                  <MapPin className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">Local</div>
                  <div className="text-xs text-muted-foreground">Expert Knowledge</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-card border-b border-border">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-10">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageSquare className="w-6 h-6" />,
                step: "1",
                title: "Tell Us What You Need",
                desc: "Fill out the quick form below — buying, renting, relocating, or just exploring. Takes 60 seconds.",
              },
              {
                icon: <UserCheck className="w-6 h-6" />,
                step: "2",
                title: "We Match You",
                desc: "Within 48 business hours, we'll connect you with a vetted Charlotte agent who specializes in exactly what you need.",
              },
              {
                icon: <Home className="w-6 h-6" />,
                step: "3",
                title: "Find Your Place",
                desc: "Your agent handles the search, showings, and paperwork. You focus on getting excited about Charlotte.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="relative mx-auto w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                  {item.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16" id="form">
        <div className="container max-w-2xl">
          <Card className="shadow-lg border-2">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-display">Tell Us What You Need</CardTitle>
              <CardDescription>Fill out the form below and we'll match you with the right agent.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" placeholder="you@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>

                <div className="space-y-1.5">
                  <Label>What are you looking for? *</Label>
                  <Select value={form.referralType || undefined} onValueChange={(v) => setForm({ ...form, referralType: v as any, budget: "" })}>
                    <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buying">Buying a home</SelectItem>
                      <SelectItem value="selling">Selling a home</SelectItem>
                      <SelectItem value="renting">Renting an apartment</SelectItem>
                      <SelectItem value="relocating">Relocating to Charlotte</SelectItem>
                      <SelectItem value="investing">Real estate investing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.referralType === "relocating" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="currentCity">Where are you moving from?</Label>
                    <Input id="currentCity" placeholder="e.g. New York, Chicago, Atlanta..." value={form.currentCity} onChange={(e) => setForm({ ...form, currentCity: e.target.value })} />
                  </div>
                )}

                {isRenting && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    <strong>Apartment locating is free for you.</strong> Apartment communities pay the locator directly — you pay nothing extra.
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{isRenting ? "Monthly Budget" : "Budget Range"}</Label>
                    <Select value={form.budget} onValueChange={(v) => setForm({ ...form, budget: v })}>
                      <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                      <SelectContent>
                        {budgetRanges.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Timeline</Label>
                    <Select value={form.timeline} onValueChange={(v) => setForm({ ...form, timeline: v })}>
                      <SelectTrigger><SelectValue placeholder="When do you need help?" /></SelectTrigger>
                      <SelectContent>
                        {TIMELINES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="neighborhoods">Preferred Neighborhoods</Label>
                  <Input id="neighborhoods" placeholder="e.g. South End, NoDa, Ballantyne..." value={form.neighborhoods} onChange={(e) => setForm({ ...form, neighborhoods: e.target.value })} />
                  <p className="text-xs text-muted-foreground">
                    Not sure? <Link href="/quiz" className="text-clt-teal underline">Take our neighborhood quiz</Link> to find your match.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Anything else we should know?</Label>
                  <Textarea id="notes" placeholder="Tell us about your situation, must-haves, or questions..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
                </div>

                <Button type="submit" size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? "Submitting..." : (
                    <>
                      {isRenting ? "Find My Apartment" : "Find Your Home"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you agree to be contacted by a real estate professional. This is a free service — no obligations.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Trust signals */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Vetted Agents Only</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">48hr Response</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Zero Cost to You</span>
            </div>
          </div>
        </div>
      </section>

      {/* Not sure CTA */}
      <section className="py-12 bg-muted/30 border-y border-border">
        <div className="container max-w-2xl text-center">
          <Search className="w-8 h-8 text-clt-teal mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-foreground mb-2">
            Not Sure Where to Start?
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Take our 2-minute neighborhood quiz to find the best Charlotte areas for your budget and lifestyle. Then come back here to get matched with an agent.
          </p>
          <Link href="/quiz">
            <Button variant="outline" className="gap-2">
              Take the Neighborhood Quiz <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      <Footer />
    </div>
  );
}
