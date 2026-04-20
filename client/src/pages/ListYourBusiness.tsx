import PageLayout from "@/components/PageLayout";
import { SERVICE_CATEGORIES } from "@shared/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Building2, CheckCircle, CheckCircle2, Star, Users, TrendingUp,
  Crown, Sparkles, ArrowRight, Shield, BarChart3, Image, Search,
  Zap, Eye, MousePointerClick
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

export default function ListYourBusiness() {
  useSEO({
    title: "List Your Business | Settle CLT",
    description: "Get your Charlotte business discovered by thousands of newcomers. Free basic listing with optional premium upgrades for featured placement and analytics.",
    keywords: "list business Charlotte, Charlotte business directory, promote business CLT, Charlotte advertising",
    path: "/list-your-business",
  });

  const { isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitBusiness = trpc.leads.submitBusiness.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Business submitted! We'll review and add it shortly.");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !businessName || !category) return;
    submitBusiness.mutate({ name, email, businessName, category, phone, website, area, description });
  };

  if (submitted) {
    return (
      <PageLayout>
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="max-w-lg mx-auto text-center">
              <CheckCircle className="w-14 h-14 text-primary mx-auto mb-5" />
              <h1 className="font-display font-bold text-2xl text-foreground">Submission Received!</h1>
              <p className="mt-3 text-muted-foreground">
                We'll review your business and add it to the directory within 48 hours. You'll receive a confirmation email.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Once listed, you can <Link href="/directory" className="text-primary hover:underline">claim your business</Link> to unlock editing and premium features.
              </p>
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-clt-navy to-clt-teal-dark py-14 md:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <h1 className="font-display font-extrabold text-3xl md:text-4xl lg:text-5xl text-white">
              List Your Business
            </h1>
            <p className="mt-4 text-lg text-white/70">
              Get discovered by thousands of people moving to Charlotte every month. Start with a free listing, upgrade anytime.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 bg-muted/50 border-b border-border">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Submit</h3>
                <p className="text-xs text-muted-foreground mt-1">Fill out the form below with your business details.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Review</h3>
                <p className="text-xs text-muted-foreground mt-1">We review and add your listing within 48 hours.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Claim</h3>
                <p className="text-xs text-muted-foreground mt-1">Claim your listing to edit details and manage your profile.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">4</div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Upgrade</h3>
                <p className="text-xs text-muted-foreground mt-1">Boost visibility with Featured or Premium placement.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">Choose Your Plan</h2>
            <p className="mt-2 text-muted-foreground">Start free, upgrade when you're ready to grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Basic - Free */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    Basic
                  </CardTitle>
                </div>
                <CardDescription>Get listed and discovered</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-1">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground mb-5">Free forever</p>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Listed in directory</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Business detail page</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Google Maps directions</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Customer reviews</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Edit listing (after claim)</li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => document.getElementById("submit-form")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Featured */}
            <Card className="border-clt-gold ring-1 ring-clt-gold/20 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-clt-gold text-white shadow-sm">Most Popular</Badge>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-clt-gold" />
                    Featured
                  </CardTitle>
                </div>
                <CardDescription>Stand out from the crowd</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-1">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground mb-5">Cancel anytime</p>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Everything in Basic</li>
                  <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-clt-gold flex-shrink-0" /> Featured badge on listing</li>
                  <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-clt-gold flex-shrink-0" /> Priority placement in category</li>
                  <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-clt-gold flex-shrink-0" /> Photo gallery (up to 5)</li>
                  <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-clt-gold flex-shrink-0" /> Detailed click analytics</li>
                </ul>
                <Button
                  className="w-full mt-6 bg-clt-gold hover:bg-clt-gold/90 text-white gap-1.5"
                  onClick={() => document.getElementById("submit-form")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-600" />
                    Premium
                  </CardTitle>
                </div>
                <CardDescription>Maximum visibility and leads</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-1">$79<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground mb-5">Cancel anytime</p>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Everything in Featured</li>
                  <li className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600 flex-shrink-0" /> Premium badge + highlight</li>
                  <li className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600 flex-shrink-0" /> Top of search results</li>
                  <li className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600 flex-shrink-0" /> Photo gallery (up to 15)</li>
                  <li className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600 flex-shrink-0" /> Lead generation analytics</li>
                  <li className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600 flex-shrink-0" /> Monthly performance report</li>
                </ul>
                <Button
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-1.5"
                  onClick={() => document.getElementById("submit-form")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            All plans include a free basic listing. Premium upgrades are available after claiming your business.
            {isAuthenticated && " Already listed? "}
            {isAuthenticated && <Link href="/my-business" className="text-primary hover:underline">Manage your business</Link>}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 bg-muted/30 border-y border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">700+</p>
              <p className="text-xs text-muted-foreground mt-1">Local Businesses Listed</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">20</p>
              <p className="text-xs text-muted-foreground mt-1">Charlotte Neighborhoods</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">54</p>
              <p className="text-xs text-muted-foreground mt-1">Business Categories</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">1000s</p>
              <p className="text-xs text-muted-foreground mt-1">Monthly Visitors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Submit Form */}
      <section id="submit-form" className="py-12 md:py-16">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-2xl bg-card border border-border shadow-sm space-y-5">
              <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Submit Your Business
              </h2>
              <p className="text-sm text-muted-foreground -mt-2">
                Start with a free listing. You can claim and upgrade after we review your submission.
              </p>

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
                    placeholder="jane@business.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Charlotte's Best Moving Co."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select a category</option>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Area / Neighborhood</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="South End, Charlotte Metro, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="(704) 555-0123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="https://yourbusiness.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Tell us about your business and what makes it great for Charlotte newcomers..."
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary text-primary-foreground font-semibold"
                disabled={submitBusiness.isPending}
              >
                {submitBusiness.isPending ? "Submitting..." : "Submit Your Business"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Basic listings are free forever. Premium upgrades available after claiming your listing.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-muted/30 border-t border-border">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display font-bold text-xl text-foreground text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-sm text-foreground">How long does it take to get listed?</h3>
                <p className="text-sm text-muted-foreground mt-1">We review submissions within 48 hours. You'll receive a confirmation email once your listing is live.</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-sm text-foreground">What's included in the free listing?</h3>
                <p className="text-sm text-muted-foreground mt-1">Your business appears in our directory with a detail page, Google Maps directions, and the ability to receive customer reviews. After claiming, you can edit your listing details and hours.</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-sm text-foreground">How do I upgrade to Featured or Premium?</h3>
                <p className="text-sm text-muted-foreground mt-1">Once your listing is live, click "Claim This Business" on your listing card. After approval, go to My Business in your account menu to select a premium plan.</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-sm text-foreground">Can I cancel my premium subscription?</h3>
                <p className="text-sm text-muted-foreground mt-1">Yes, you can cancel anytime from your My Business dashboard. Your premium features will remain active until the end of your billing period.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
