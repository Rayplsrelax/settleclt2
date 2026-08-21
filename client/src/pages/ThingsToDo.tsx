import { useI18n } from "@/i18n/I18nContext";
import type { TranslationKey } from "@/i18n/locales/en";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";
import { Calendar, MapPin, Music, Utensils, Users, Ticket, TreePine, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/PageLayout";

const categories: Array<{ icon: typeof Music; labelKey: TranslationKey; href: string; descriptionKey: TranslationKey }> = [
  { icon: Music, labelKey: "things.liveMusic", href: "/events", descriptionKey: "things.liveMusicDescription" },
  { icon: Utensils, labelKey: "things.foodEvents", href: "/events", descriptionKey: "things.foodEventsDescription" },
  { icon: Users, labelKey: "things.family", href: "/events", descriptionKey: "things.familyDescription" },
  { icon: Ticket, labelKey: "things.festivals", href: "/events", descriptionKey: "things.festivalsDescription" },
  { icon: TreePine, labelKey: "things.outdoor", href: "/events", descriptionKey: "things.outdoorDescription" },
  { icon: Heart, labelKey: "things.free", href: "/events", descriptionKey: "things.freeDescription" },
];

const neighborhoods: Array<{ name: string; id: string; vibeKey: TranslationKey }> = [
  { name: "NoDa", id: "noda", vibeKey: "things.nodaVibe" },
  { name: "South End", id: "south-end", vibeKey: "things.southEndVibe" },
  { name: "Plaza Midwood", id: "plaza-midwood", vibeKey: "things.plazaVibe" },
  { name: "Uptown", id: "uptown", vibeKey: "things.uptownVibe" },
  { name: "Dilworth", id: "dilworth", vibeKey: "things.dilworthVibe" },
  { name: "South Charlotte", id: "south-charlotte", vibeKey: "things.southCharlotteVibe" },
];

export default function ThingsToDo() {
  const { t } = useI18n();
  useSEO({
    title: t("things.seoTitle"),
    description: t("things.seoDescription"),
    keywords: "things to do in Charlotte, things to do in Charlotte NC, Charlotte events this weekend, free things to do in Charlotte, family activities Charlotte NC, Charlotte nightlife, Charlotte outdoor activities",
    path: "/things-to-do",
  });

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 sm:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              <Star className="w-3.5 h-3.5 mr-1.5" />
              {t("things.guideBadge")}
            </Badge>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6">
              {t("things.title")}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              {t("things.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/events">
                <Button size="lg" className="bg-primary text-primary-foreground font-semibold">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t("things.browseEvents")}
                </Button>
              </Link>
              <Link href="/neighborhoods">
                <Button size="lg" variant="outline" className="font-semibold">
                  <MapPin className="w-4 h-4 mr-2" />
                  {t("things.exploreNeighborhoods")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What to Do This Week */}
      <section className="py-16 bg-background">
        <div className="container max-w-5xl">
          <h2 className="font-display font-bold text-3xl text-foreground mb-4">
            {t("things.thisWeek")}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-3xl">
            {t("things.categoriesIntro")}
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link key={cat.labelKey} href={cat.href}>
                <div className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <cat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">{t(cat.labelKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(cat.descriptionKey)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Charlotte Neighborhoods for Activities */}
      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="container max-w-5xl">
          <h2 className="font-display font-bold text-3xl text-foreground mb-4">
            {t("things.bestNeighborhoods")}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-3xl">
            {t("things.neighborhoodsIntro")}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {neighborhoods.map((n) => (
              <Link key={n.id} href={`/neighborhood/${n.id}`}>
                <div className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                  <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{n.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t(n.vibeKey)}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/neighborhoods">
              <Button variant="outline" className="font-semibold">
                {t("things.viewAllNeighborhoods")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Long-form SEO Content */}
      <section className="py-16 bg-background">
        <div className="container max-w-3xl">
          <h2 className="font-display font-bold text-2xl text-foreground mb-6">
            {t("things.completeGuide")}
          </h2>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4 leading-relaxed">
            <p>
              {t("things.completeGuideIntro")}
            </p>

            <h3 className="font-display font-semibold text-lg text-foreground !mt-8">{t("things.eventsWeekend")}</h3>
            <p>
              {t("things.eventsWeekendCopy")}
            </p>

            <h3 className="font-display font-semibold text-lg text-foreground !mt-8">{t("things.freeGuide")}</h3>
            <p>
              {t("things.freeGuideCopy")}
            </p>

            <h3 className="font-display font-semibold text-lg text-foreground !mt-8">{t("things.familyGuide")}</h3>
            <p>
              {t("things.familyGuideCopy")}
            </p>

            <h3 className="font-display font-semibold text-lg text-foreground !mt-8">{t("things.nightlife")}</h3>
            <p>
              {t("things.nightlifeCopy")}
            </p>

            <h3 className="font-display font-semibold text-lg text-foreground !mt-8">{t("things.outdoorGuide")}</h3>
            <p>
              {t("things.outdoorGuideCopy")}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/events">
              <Button className="bg-primary text-primary-foreground font-semibold">
                {t("things.weekEvents")}
              </Button>
            </Link>
            <Link href="/directory">
              <Button variant="outline" className="font-semibold">
                {t("things.localDirectory")}
              </Button>
            </Link>
            <Link href="/quiz">
              <Button variant="outline" className="font-semibold">
                {t("things.findNeighborhood")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
