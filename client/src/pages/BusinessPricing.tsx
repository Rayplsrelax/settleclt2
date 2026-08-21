import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/I18nContext";
import type { TranslationKey } from "@/i18n/locales/en";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";
import { ArrowRight, BarChart3, Building2, CheckCircle2, Crown, MousePointerClick, Shield, Sparkles, Star, Users } from "lucide-react";

const plans = [
  {
    nameKey: "businessPricing.freeClaim" as TranslationKey,
    price: "$0",
    descriptionKey: "businessPricing.freeDescription" as TranslationKey,
    badgeKey: "businessPricing.startHere" as TranslationKey,
    icon: Shield,
    accent: "border-green-200 bg-green-50/40",
    features: [
      "businessPricing.freeFeature1",
      "businessPricing.freeFeature2",
      "businessPricing.freeFeature3",
      "businessPricing.freeFeature4",
      "businessPricing.freeFeature5",
    ] as TranslationKey[],
    ctaKey: "businessPricing.claimCta" as TranslationKey,
    href: "/directory",
  },
  {
    nameKey: "businessPricing.featured" as TranslationKey,
    price: "$29",
    trialNoteKey: "businessPricing.trial14Note" as TranslationKey,
    descriptionKey: "businessPricing.featuredDescription" as TranslationKey,
    badgeKey: "businessPricing.popular" as TranslationKey,
    icon: Sparkles,
    accent: "border-clt-gold/40 bg-amber-50/60 ring-1 ring-clt-gold/20",
    features: [
      "businessPricing.featuredFeature1",
      "businessPricing.featuredFeature2",
      "businessPricing.featuredFeature3",
      "businessPricing.featuredFeature4",
      "businessPricing.featuredFeature5",
      "businessPricing.featuredFeature6",
      "businessPricing.featuredFeature7",
    ] as TranslationKey[],
    ctaKey: "businessPricing.trial14" as TranslationKey,
    href: "/my-business?upgrade=featured",
  },
  {
    nameKey: "businessPricing.premium" as TranslationKey,
    price: "$79",
    trialNoteKey: "businessPricing.trial14Note" as TranslationKey,
    descriptionKey: "businessPricing.premiumDescription" as TranslationKey,
    badgeKey: "businessPricing.leadFocused" as TranslationKey,
    icon: Crown,
    accent: "border-purple-300 bg-purple-50/60",
    features: [
      "businessPricing.premiumFeature1",
      "businessPricing.premiumFeature2",
      "businessPricing.premiumFeature3",
      "businessPricing.premiumFeature4",
      "businessPricing.premiumFeature5",
      "businessPricing.premiumFeature6",
      "businessPricing.premiumFeature7",
      "businessPricing.premiumFeature8",
    ] as TranslationKey[],
    ctaKey: "businessPricing.trial14" as TranslationKey,
    href: "/my-business?upgrade=premium",
  },
  {
    nameKey: "businessPricing.pro" as TranslationKey,
    price: "$149",
    trialNoteKey: "businessPricing.trial7Note" as TranslationKey,
    descriptionKey: "businessPricing.proDescription" as TranslationKey,
    badgeKey: "businessPricing.aiPowered" as TranslationKey,
    icon: Sparkles,
    accent: "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-400/20",
    features: [
      "businessPricing.proFeature1",
      "businessPricing.proFeature2",
      "businessPricing.proFeature3",
      "businessPricing.proFeature4",
      "businessPricing.proFeature5",
      "businessPricing.proFeature6",
    ] as TranslationKey[],
    ctaKey: "businessPricing.trial7" as TranslationKey,
    href: "/my-business?upgrade=pro",
  },
];

const proofPoints: Array<{ icon: typeof MousePointerClick; labelKey: TranslationKey; copyKey: TranslationKey }> = [
  { icon: MousePointerClick, labelKey: "businessPricing.trackClicks", copyKey: "businessPricing.trackClicksCopy" },
  { icon: Users, labelKey: "businessPricing.reachLocals", copyKey: "businessPricing.reachLocalsCopy" },
  { icon: BarChart3, labelKey: "businessPricing.measureValue", copyKey: "businessPricing.measureValueCopy" },
];

export default function BusinessPricing() {
  const { t } = useI18n();
  useSEO({
    title: t("businessPricing.seoTitle"),
    description: t("businessPricing.seoDescription"),
    path: "/business-pricing",
    keywords: "Settle CLT business pricing, Charlotte business listing, claim business Charlotte NC, featured business listing Charlotte, local business advertising Charlotte NC",
  });

  return (
    <PageLayout>
      <section className="bg-gradient-to-br from-primary/10 via-background to-clt-gold/10 border-b">
        <div className="container py-14 md:py-20 max-w-6xl">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20" variant="outline">
            {t("businessPricing.badge")}
          </Badge>
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                {t("businessPricing.title")}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
                {t("businessPricing.subtitle")}
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link href="/directory">
                  <Button size="lg" className="gap-2">
                    {t("businessPricing.findClaim")} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/list-your-business">
                  <Button size="lg" variant="outline" className="gap-2">
                    {t("businessPricing.addMissing")}
                  </Button>
                </Link>
              </div>
            </div>
            <Card className="shadow-lg border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> {t("businessPricing.howItWorks")}</CardTitle>
                <CardDescription>{t("businessPricing.howDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex gap-3"><span className="font-bold text-primary">1</span><p>{t("businessPricing.step1")}</p></div>
                <div className="flex gap-3"><span className="font-bold text-primary">2</span><p>{t("businessPricing.step2")}</p></div>
                <div className="flex gap-3"><span className="font-bold text-primary">3</span><p>{t("businessPricing.step3")}</p></div>
                <div className="flex gap-3"><span className="font-bold text-primary">4</span><p>{t("businessPricing.step4")}</p></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-12 max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold">{t("businessPricing.plans")}</h2>
          <p className="text-muted-foreground mt-2">{t("businessPricing.plansDescription")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map(plan => {
            const Icon = plan.icon;
            return (
              <Card key={plan.nameKey} className={`${plan.accent} relative flex flex-col`}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2"><Icon className="w-5 h-5" /> {t(plan.nameKey)}</CardTitle>
                    <Badge variant="outline">{t(plan.badgeKey)}</Badge>
                  </div>
                  <CardDescription>{t(plan.descriptionKey)}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <p className="text-3xl font-extrabold mb-1">{plan.price}<span className="text-sm font-normal text-muted-foreground">{t("businessPricing.perMonth")}</span></p>
                  {"trialNoteKey" in plan && plan.trialNoteKey && (
                    <p className="text-xs font-medium text-green-600 mb-4">{t(plan.trialNoteKey)} — {t("businessPricing.noCharge")}</p>
                  )}
                  {!("trialNoteKey" in plan && plan.trialNoteKey) && <div className="mb-4" />}
                  <ul className="space-y-2 text-sm flex-1">
                    {plan.features.map(featureKey => (
                      <li key={featureKey} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span>{t(featureKey)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href}>
                    <Button className="w-full mt-6 gap-2" variant={plan.nameKey === "businessPricing.freeClaim" ? "default" : "outline"}>
                      {t(plan.ctaKey)} <ArrowRight className="w-4 h-4" />
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
              <Card key={item.labelKey}>
                <CardContent className="p-5">
                  <Icon className="w-7 h-7 text-primary mb-3" />
                  <h3 className="font-semibold">{t(item.labelKey)}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t(item.copyKey)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-8 rounded-2xl border bg-muted/30 p-6 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2"><Star className="w-5 h-5 text-clt-gold" /> {t("businessPricing.bestOffer")}</h2>
            <p className="text-muted-foreground mt-1">{t("businessPricing.bestOfferCopy")}</p>
          </div>
          <Link href="/directory">
            <Button size="lg" className="gap-2">{t("businessPricing.startFree")} <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
