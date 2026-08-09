import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";
import { ArrowRight, BarChart3, Building2, CheckCircle2, Crown, MousePointerClick, Shield, Sparkles, Star, Users } from "lucide-react";

const plans = [
  {
    name: "Free Claim",
    price: "$0",
    cadence: "/mo",
    description: "Verify ownership and control the basics of your Settle CLT listing.",
    badge: "Start here",
    icon: Shield,
    accent: "border-green-200 bg-green-50/40",
    features: [
      "Verified owner badge",
      "Edit business name, phone, website, description, and hours",
      "Appear in Settle CLT directory search",
      "Basic listing analytics",
      "Upgrade any time after approval",
    ],
    cta: "Claim Your Business",
    href: "/directory",
  },
  {
    name: "Featured Listing",
    price: "$29",
    cadence: "/mo",
    description: "Stand out in your category and get stronger click-through visibility.",
    badge: "Most popular",
    icon: Sparkles,
    accent: "border-clt-gold/40 bg-amber-50/60 ring-1 ring-clt-gold/20",
    features: [
      "Everything in Free Claim",
      "Featured badge on listing",
      "Priority placement in category results",
      "Photo gallery up to 5 photos",
      "Detailed click analytics",
      "Good fit for local service businesses testing demand",
    ],
    cta: "Choose Featured",
    href: "/my-business?upgrade=featured",
  },
  {
    name: "Premium Listing",
    price: "$79",
    cadence: "/mo",
    description: "Maximum directory visibility for businesses that want more leads from Settle CLT.",
    badge: "Lead-focused",
    icon: Crown,
    accent: "border-purple-300 bg-purple-50/60",
    features: [
      "Everything in Featured",
      "Premium badge and listing highlight",
      "Top placement in search results",
      "Photo gallery up to 15 photos",
      "Lead generation analytics",
      "Monthly performance report",
    ],
    cta: "Choose Premium",
    href: "/my-business?upgrade=premium",
  },
  {
    name: "Business Pro",
    price: "$149",
    cadence: "/mo",
    description: "AI-powered business management — your listing runs itself 24/7.",
    badge: "AI-powered",
    icon: Sparkles,
    accent: "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-400/20",
    features: [
      "Everything in Premium",
      "AI Business Assistant (24/7 chat widget)",
      "Smart scheduling capture",
      "Social content draft generation",
      "Reputation autopilot (review response drafts)",
      "One-page web presence",
      "Photo gallery up to 30 photos",
    ],
    cta: "Choose Business Pro",
    href: "/my-business?upgrade=pro",
  },
];

const proofPoints = [
  { icon: MousePointerClick, label: "Track clicks", copy: "See listing views, phone/website clicks, and lead actions." },
  { icon: Users, label: "Reach locals", copy: "Get discovered by movers, residents, and Charlotte-area customers." },
  { icon: BarChart3, label: "Measure value", copy: "Use source and conversion tracking to see what is working." },
];

export default function BusinessPricing() {
  useSEO({
    title: "Settle CLT Business Pricing: Claim, Featured & Premium Listings",
    description: "Claim your Charlotte business listing for free, then upgrade to Featured or Premium placement to get more visibility, clicks, and local customer leads from Settle CLT.",
    path: "/business-pricing",
    keywords: "Settle CLT business pricing, Charlotte business listing, claim business Charlotte NC, featured business listing Charlotte, local business advertising Charlotte NC",
  });

  return (
    <PageLayout>
      <section className="bg-gradient-to-br from-primary/10 via-background to-clt-gold/10 border-b">
        <div className="container py-14 md:py-20 max-w-6xl">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20" variant="outline">
            Charlotte business growth
          </Badge>
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                Claim your Settle CLT listing for free. Upgrade when you want more visibility.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
                Settle CLT helps Charlotte residents, newcomers, and local shoppers find trustworthy businesses. Start with a free verified claim, then use Featured or Premium placement when you want more clicks and leads.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link href="/directory">
                  <Button size="lg" className="gap-2">
                    Find & Claim Your Business <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/list-your-business">
                  <Button size="lg" variant="outline" className="gap-2">
                    Add a Missing Business
                  </Button>
                </Link>
              </div>
            </div>
            <Card className="shadow-lg border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> How it works</CardTitle>
                <CardDescription>Simple enough to run manually while the business grows.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex gap-3"><span className="font-bold text-primary">1</span><p>Business owner finds their directory listing and submits a free claim.</p></div>
                <div className="flex gap-3"><span className="font-bold text-primary">2</span><p>Admin verifies the claim, approves it, and the owner gets access to My Business.</p></div>
                <div className="flex gap-3"><span className="font-bold text-primary">3</span><p>Owner edits listing details and can upgrade to Featured or Premium through Stripe checkout.</p></div>
                <div className="flex gap-3"><span className="font-bold text-primary">4</span><p>Settle CLT tracks views, clicks, leads, and monetization performance.</p></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-12 max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold">Business listing plans</h2>
          <p className="text-muted-foreground mt-2">The free claim is the entry point. Paid tiers are for businesses ready to compete for attention.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map(plan => {
            const Icon = plan.icon;
            return (
              <Card key={plan.name} className={`${plan.accent} relative flex flex-col`}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2"><Icon className="w-5 h-5" /> {plan.name}</CardTitle>
                    <Badge variant="outline">{plan.badge}</Badge>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <p className="text-3xl font-extrabold mb-5">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.cadence}</span></p>
                  <ul className="space-y-2 text-sm flex-1">
                    {plan.features.map(feature => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href}>
                    <Button className="w-full mt-6 gap-2" variant={plan.name === "Free Claim" ? "default" : "outline"}>
                      {plan.cta} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container pb-14 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-4">
          {proofPoints.map(item => {
            const Icon = item.icon;
            return (
              <Card key={item.label}>
                <CardContent className="p-5">
                  <Icon className="w-7 h-7 text-primary mb-3" />
                  <h3 className="font-semibold">{item.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.copy}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-8 rounded-2xl border bg-muted/30 p-6 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2"><Star className="w-5 h-5 text-clt-gold" /> Best first offer</h2>
            <p className="text-muted-foreground mt-1">For launch, sell Featured listings first. It is affordable, easy to explain, and gives owners a reason to claim their listing before asking for Premium.</p>
          </div>
          <Link href="/directory">
            <Button size="lg" className="gap-2">Start With a Free Claim <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
