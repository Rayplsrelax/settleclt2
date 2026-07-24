import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SERVICE_CATEGORIES, SERVICES } from "@shared/services";
import { useSEO } from "@/hooks/useSEO";
import { useStructuredData, buildBreadcrumbSchema } from "@/hooks/useStructuredData";
import { Link } from "wouter";
import { ArrowRight, Building2, CheckCircle2, ExternalLink, MapPin, Phone, Search, Shield, Sparkles, Star } from "lucide-react";

function getCategorySlugFromPath(): string {
  if (typeof window === "undefined") return "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[2] || "";
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const CATEGORY_SEO_COPY: Record<string, { headline: string; intro: string; checklist: string[] }> = {
  "moving-companies": {
    headline: "Charlotte moving companies for local, long-distance, and newcomer moves",
    intro: "Compare Charlotte movers that can help with apartments, houses, packing, storage, and relocation timing. Start here if you are moving to Charlotte or changing neighborhoods inside the metro.",
    checklist: ["Ask about local vs long-distance rates", "Confirm insurance and damage coverage", "Book earlier for end-of-month moves", "Compare packing, storage, and junk removal add-ons"],
  },
  plumbers: {
    headline: "Charlotte plumbers for repairs, drain issues, water heaters, and emergencies",
    intro: "Find plumbers serving Charlotte homes and apartments, including emergency plumbing, drain cleaning, water heater repair, fixture installs, and sewer-line work.",
    checklist: ["Confirm licensing and emergency availability", "Ask for written estimates", "Check service areas and trip fees", "Save a 24/7 number before an emergency"],
  },
  electricians: {
    headline: "Charlotte electricians for panels, wiring, outlets, EV chargers, and smart homes",
    intro: "Compare electricians for repairs, inspections, panel upgrades, EV charger installs, lighting, outlets, and home safety needs across the Charlotte area.",
    checklist: ["Use licensed electricians for panel work", "Ask about permits when needed", "Bundle small repairs when possible", "Confirm smart-home or EV charger experience"],
  },
  hvac: {
    headline: "Charlotte HVAC and AC repair companies for heating, cooling, and maintenance",
    intro: "Find HVAC companies for AC repair, furnace service, heat pumps, maintenance plans, ductwork, and indoor air quality in Charlotte's hot summers and mixed-season weather.",
    checklist: ["Schedule AC tune-ups before peak summer", "Compare maintenance plans", "Ask about emergency response time", "Check warranty and financing options"],
  },
  roofing: {
    headline: "Charlotte roofing and gutter companies for repairs, replacement, and inspections",
    intro: "Compare roofers and gutter companies for storm damage, roof replacement, leak repair, gutter protection, inspections, and insurance-related work.",
    checklist: ["Ask for roof inspection photos", "Confirm insurance claim experience", "Check material and workmanship warranties", "Compare gutter and roof bundles"],
  },
};

function titleCaseFromSlug(slug: string): string {
  return slug.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default function DirectoryCategory() {
  const slug = getCategorySlugFromPath();
  const category = SERVICE_CATEGORIES.find(c => c.id === slug);
  const categoryName = category?.name || titleCaseFromSlug(slug || "businesses");
  const services = SERVICES.filter(service => service.category === slug);
  const featured = services.filter(service => service.featured).slice(0, 3);
  const areas = Array.from(new Set(services.map(service => service.area).filter(Boolean))).slice(0, 12);
  const seoCopy = CATEGORY_SEO_COPY[slug] || {
    headline: `${categoryName} in Charlotte NC`,
    intro: `Browse ${categoryName.toLowerCase()} serving Charlotte, Mecklenburg County, and nearby metro communities. Compare local options, contact details, service areas, and directory listings in one place.`,
    checklist: ["Compare service areas", "Review websites and contact options", "Shortlist 2-3 providers", "Use verified/claimed listings when available"],
  };

  useSEO({
    title: `${categoryName} in Charlotte NC: Local Directory & Service Guide`,
    description: `Find ${categoryName.toLowerCase()} in Charlotte NC. Compare ${services.length || "local"} listings, service areas, contact details, and helpful tips from Settle CLT.`,
    keywords: `${categoryName} Charlotte NC, Charlotte ${categoryName}, best ${categoryName} Charlotte, local ${categoryName.toLowerCase()} near me`,
    path: `/directory/category/${slug}`,
  });

  useStructuredData([{
    "@context": "https://schema.org",
    ...buildBreadcrumbSchema([
      { name: "Home", url: "https://settleclt.com" },
      { name: "Directory", url: "https://settleclt.com/directory" },
      { name: categoryName, url: `https://settleclt.com/directory/category/${slug}` },
    ]),
  }]);

  if (!category) {
    return (
      <PageLayout>
        <div className="container py-20 max-w-2xl text-center">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold">Category not found</h1>
          <p className="text-muted-foreground mt-2">This directory category does not exist yet.</p>
          <Link href="/directory"><Button className="mt-6">Back to Directory</Button></Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="bg-gradient-to-br from-primary/10 via-background to-clt-gold/10 border-b">
        <div className="container py-12 md:py-16 max-w-6xl">
          <Badge variant="outline" className="mb-4 bg-background/80">{category.icon} Charlotte directory category</Badge>
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">{seoCopy.headline}</h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-2xl">{seoCopy.intro}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/directory?category=${slug}`}>
                  <Button className="gap-2">Browse All Listings <ArrowRight className="w-4 h-4" /></Button>
                </Link>
                <Link href="/business-pricing">
                  <Button variant="outline" className="gap-2">Promote Your Business</Button>
                </Link>
              </div>
            </div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Category snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-lg border bg-background p-4"><p className="text-3xl font-bold">{services.length}</p><p className="text-xs text-muted-foreground">Listings</p></div>
                <div className="rounded-lg border bg-background p-4"><p className="text-3xl font-bold">{areas.length}</p><p className="text-xs text-muted-foreground">Service Areas</p></div>
                <div className="rounded-lg border bg-background p-4"><p className="text-3xl font-bold">{featured.length}</p><p className="text-xs text-muted-foreground">Featured</p></div>
                <div className="rounded-lg border bg-background p-4"><p className="text-3xl font-bold">CLT</p><p className="text-xs text-muted-foreground">Metro Focus</p></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-10 max-w-6xl grid lg:grid-cols-[0.7fr_1.3fr] gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> What to check</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {seoCopy.checklist.map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />{item}</li>)}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Areas mentioned</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {areas.map(area => <Badge key={area} variant="outline">{area}</Badge>)}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">Top {categoryName} listings</h2>
            <Link href={`/directory?category=${slug}`}><Button variant="outline" size="sm">View all</Button></Link>
          </div>
          <div className="grid gap-3">
            {services.slice(0, 10).map(service => (
              <Card key={service.name} className={service.featured ? "border-clt-gold/40 bg-amber-50/40" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        {service.featured && <Badge className="bg-clt-gold text-white gap-1"><Sparkles className="w-3 h-3" /> Featured</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> {service.area}</p>
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <Link href={`/directory/${toSlug(service.name)}`}><Button size="sm" variant="outline">Details</Button></Link>
                      {service.phone && <a href={`tel:${service.phone}`}><Button size="sm" variant="outline" className="gap-1"><Phone className="w-3 h-3" /> Call</Button></a>}
                      {service.website && <a href={service.website} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline" className="gap-1"><ExternalLink className="w-3 h-3" /> Site</Button></a>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-14 max-w-6xl">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Own a {categoryName.toLowerCase()} business?</h2>
              <p className="text-muted-foreground mt-1">Claim your listing for free, update details, and upgrade to Featured or Premium when you want more visibility.</p>
            </div>
            <Link href="/business-pricing"><Button size="lg" className="gap-2">See Business Pricing <ArrowRight className="w-4 h-4" /></Button></Link>
          </CardContent>
        </Card>
      </section>
    </PageLayout>
  );
}
