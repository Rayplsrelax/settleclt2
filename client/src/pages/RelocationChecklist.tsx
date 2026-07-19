import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Home,
  MapPin,
  ShieldCheck,
} from "lucide-react";

const checklistSections = [
  {
    label: "90 days out",
    title: "Choose your Charlotte shortlist",
    items: [
      "Pick 3-5 neighborhoods or suburbs to compare by commute, lifestyle, schools, and budget.",
      "Decide whether you are buying, renting first, or still comparing both paths.",
      "Estimate total monthly housing costs, including taxes, HOA fees, utilities, parking, and commute costs.",
      "Start lender conversations if buying, even if you are not ready to tour yet.",
      "Create a must-have / nice-to-have list before falling in love with listings.",
    ],
  },
  {
    label: "60 days out",
    title: "Pressure-test the move",
    items: [
      "Visit or virtually tour your top areas at commute time, lunchtime, and evening.",
      "Compare Charlotte, Lake Norman, Union County, and nearby South Carolina tradeoffs if they are on your list.",
      "Confirm school, childcare, pet, parking, and work-from-home needs from official sources.",
      "Interview movers and keep notes on estimates, availability, storage, and insurance.",
      "If buying, get pre-approved before competitive tours or offer conversations.",
    ],
  },
  {
    label: "30 days out",
    title: "Lock the logistics",
    items: [
      "Finalize move date, utility setup, address changes, and temporary housing backup plan.",
      "Schedule final tours, inspections, walkthroughs, or apartment/community visits.",
      "Build a first-week map: grocery store, pharmacy, urgent care, DMV, bank, gym, and coffee.",
      "Plan your first weekend so Charlotte starts to feel like home, not just a project.",
      "Keep one document with contacts for movers, lender, agent, landlord, utility companies, and insurance.",
    ],
  },
];

const comparisonPrompts = [
  "South End vs NoDa if you want walkability and nightlife",
  "Ballantyne vs Matthews if you want more suburban structure",
  "Charlotte vs Fort Mill if NC/SC taxes, commute, and schools matter",
  "Lake Norman vs South Charlotte if space, water access, and commute are competing priorities",
];

export default function RelocationChecklist() {
  useSEO({
    title: "Charlotte 30/60/90 Day Relocation Checklist — Settle CLT",
    description:
      "A practical Charlotte relocation checklist for people moving to the Queen City. Compare neighborhoods, plan logistics, and ask a local relocation question.",
    keywords:
      "Charlotte relocation checklist, moving to Charlotte NC, Charlotte neighborhoods, Charlotte home buying timeline, relocating to Charlotte",
    path: "/relocation-checklist",
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-background py-16 md:py-24 border-b border-emerald-100">
          <div className="container max-w-6xl">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
              <div>
                <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  Free Charlotte relocation guide
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl font-extrabold text-foreground leading-tight mb-5">
                  Charlotte 30/60/90 Day Relocation Checklist
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed mb-7 max-w-2xl">
                  Moving to Charlotte is easier when you know what to decide now, what can wait, and which neighborhood questions actually matter. Use this checklist to organize the move before you tour homes or sign a lease.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/find-your-home?type=relocating&source=relocation_checklist#form" className="no-underline">
                    <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                      Ask a Charlotte relocation question
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/neighborhoods" className="no-underline">
                    <Button size="lg" variant="outline" className="gap-2">
                      Compare neighborhoods
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <p className="mt-4 text-xs text-muted-foreground max-w-xl">
                  Optional real estate help is provided through a licensed real estate professional. The checklist is educational and useful whether or not you choose to ask for help.
                </p>
              </div>

              <Card className="border-emerald-200 shadow-lg bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ClipboardList className="w-5 h-5 text-emerald-600" />
                    What this helps you decide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    "Which areas fit your commute and lifestyle",
                    "Whether to buy now or rent first",
                    "When to talk with a lender or agent",
                    "What to do 90, 60, and 30 days before the move",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground/90">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container max-w-5xl">
            <div className="grid gap-5 md:grid-cols-3">
              {checklistSections.map((section) => (
                <Card key={section.label} className="border-border/70 h-full">
                  <CardHeader>
                    <Badge variant="outline" className="w-fit border-emerald-200 text-emerald-700">
                      {section.label}
                    </Badge>
                    <CardTitle className="text-xl leading-tight">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 bg-muted/30 border-y border-border">
          <div className="container max-w-5xl">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Your biggest move decision is usually the area, not the house
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-5">
                  Charlotte changes fast from block to block and suburb to suburb. A great fit for one newcomer can be frustrating for another if commute, schools, walkability, taxes, or weekend routine do not match.
                </p>
                <Link href="/find-your-home?type=relocating&source=relocation_checklist_area_help#form" className="no-underline">
                  <Button className="gap-2">
                    Get a neighborhood shortlist
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid gap-3">
                {comparisonPrompts.map((prompt) => (
                  <div key={prompt} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
                    <CalendarCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/90">{prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container max-w-4xl">
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-6 md:p-8 text-center">
                <Home className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Want a local read on your move?
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
                  Send your timeline, current city, budget range if you are comfortable, and the areas you are considering. You will get pointed toward the next best research steps for your Charlotte move.
                </p>
                <Link href="/find-your-home?type=relocating&source=relocation_checklist_bottom#form" className="no-underline">
                  <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    Ask a relocation question
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center text-xs text-muted-foreground">
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> No obligation
                  </span>
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Educational first
                  </span>
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Licensed real estate help available
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
