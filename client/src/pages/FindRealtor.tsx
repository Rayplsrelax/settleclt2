import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Home, MapPin, CheckCircle2, Building2, TrendingUp, Users } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const BUDGET_RANGES = [
  "Under $200K",
  "$200K - $350K",
  "$350K - $500K",
  "$500K - $750K",
  "$750K - $1M",
  "$1M+",
  "Not sure yet",
];

const TIMELINES = [
  "ASAP (within 30 days)",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "Just exploring",
];

export default function FindRealtor() {
  useSEO({
    title: "Find a Charlotte Realtor — Free Matching Service",
    description: "Get matched with a trusted Charlotte real estate agent for buying, selling, renting, or relocating. Free service — tell us what you need and we'll connect you.",
    keywords: "Charlotte realtor, Charlotte real estate agent, buy house Charlotte NC, Charlotte homes for sale, Charlotte relocation agent, find realtor Charlotte",
    path: "/find-a-realtor",
  });

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    referralType: "" as "buying" | "selling" | "renting" | "relocating" | "investing" | "",
    budget: "",
    neighborhoods: "",
    timeline: "",
    notes: "",
    currentCity: "",
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

  if (submitted) {
    return (
      <PageLayout>
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl py-20 text-center">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">
            Request Received!
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            We've got your info and will connect you with a trusted Charlotte real estate professional within 24 hours.
          </p>
          <Button onClick={() => window.location.href = "/"} variant="outline" size="lg">
            Back to Home
          </Button>
        </div>
      </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-16 md:py-24">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Home className="w-4 h-4" />
                Free Realtor Matching
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
                Find Your Perfect Charlotte Realtor
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Whether you're buying, selling, renting, or relocating to Charlotte — we'll connect you with a trusted local agent who knows the Queen City inside and out.
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
                  24hr response time
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

      {/* Form */}
      <section className="py-16">
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
                  <Select value={form.referralType} onValueChange={(v) => setForm({ ...form, referralType: v as any })}>
                    <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buying">Buying a home</SelectItem>
                      <SelectItem value="selling">Selling a home</SelectItem>
                      <SelectItem value="renting">Renting / Leasing</SelectItem>
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

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Budget Range</Label>
                    <Select value={form.budget} onValueChange={(v) => setForm({ ...form, budget: v })}>
                      <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                      <SelectContent>
                        {BUDGET_RANGES.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
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
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Anything else we should know?</Label>
                  <Textarea id="notes" placeholder="Tell us about your situation, must-haves, or questions..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
                </div>

                <Button type="submit" size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? "Submitting..." : "Get Matched with a Realtor"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you agree to be contacted by a real estate professional. This is a free service — no obligations.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
    </PageLayout>
  );
}
