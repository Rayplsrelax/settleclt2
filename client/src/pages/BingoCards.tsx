import PageLayout from "@/components/PageLayout";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Grid3X3, Check, Trophy, ChevronDown, ChevronUp, Sparkles, ArrowRight, LogIn
} from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ShareablePassportCard from "@/components/ShareablePassportCard";
import { useI18n } from "@/i18n/I18nContext";
import type { TranslationKey } from "@/i18n/locales/en";
import { useSEO } from "@/hooks/useSEO";
import ShareButtons from "@/components/ShareButtons";
import { parseBingoSquares, type BingoSquare } from "@/lib/bingo";

const THEME_LABELS: Record<string, { labelKey: TranslationKey; icon: string; color: string }> = {
  "food-drink": { labelKey: "bingo.foodDrink", icon: "🍺", color: "bg-amber-500/10 text-amber-600" },
  experiences: { labelKey: "bingo.experiences", icon: "✨", color: "bg-purple-500/10 text-purple-600" },
  newcomer: { labelKey: "bingo.newcomer", icon: "🏙️", color: "bg-teal-500/10 text-teal-600" },
};

function BingoContent() {
  const { t } = useI18n();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: cards = [], isLoading: cardsLoading } = trpc.bingo.getCards.useQuery();
  const { data: progress = [], isLoading: progressLoading } = trpc.bingo.getProgress.useQuery();
  const { data: passportEntries = [] } = trpc.passport.getEntries.useQuery();
  const updateProgress = trpc.bingo.updateProgress.useMutation({
    onSuccess: () => {
      utils.bingo.getProgress.invalidate();
    },
  });

  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [shareCardId, setShareCardId] = useState<number | null>(null);

  // Build progress map: cardId -> Set of completed square IDs
  const progressMap = useMemo(() => {
    const m: Record<number, Set<number>> = {};
    progress.forEach((p: any) => {
      try {
        const ids = JSON.parse(p.completedSquaresJson || "[]");
        m[p.cardId] = new Set(ids);
      } catch {
        m[p.cardId] = new Set();
      }
    });
    return m;
  }, [progress]);

  // Completion dates
  const completionDates = useMemo(() => {
    const m: Record<number, Date | null> = {};
    progress.forEach((p: any) => {
      m[p.cardId] = p.completedAt ? new Date(p.completedAt) : null;
    });
    return m;
  }, [progress]);

  // Unique neighborhoods from passport
  const neighborhoodCount = useMemo(() => {
    const set = new Set<string>();
    passportEntries.forEach((e: any) => {
      if (e.neighborhoodId) set.add(e.neighborhoodId);
    });
    return set.size;
  }, [passportEntries]);

  function toggleSquare(cardId: number, squareId: number, squares: BingoSquare[]) {
    const current = progressMap[cardId] || new Set<number>();
    const updated = new Set(current);

    if (updated.has(squareId)) {
      updated.delete(squareId);
    } else {
      updated.add(squareId);
    }

    const isNowComplete = updated.size === squares.length;
    const wasComplete = completionDates[cardId] != null;

    updateProgress.mutate({
      cardId,
      completedSquaresJson: JSON.stringify(Array.from(updated)),
      completedAt: isNowComplete && !wasComplete ? new Date() : undefined,
    });

    if (isNowComplete && !wasComplete) {
      toast.success(t("bingo.completionToast"));
      setShareCardId(cardId);
    }
  }

  if (cardsLoading || progressLoading) {
    return (
      <div className="container py-12 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-4">
            {[1, 2].map(i => <div key={i} className="h-64 bg-muted rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Grid3X3 className="w-5 h-5 text-purple-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t("bingo.title")}
          </h1>
        </div>
        <p className="text-muted-foreground max-w-xl">
          {t("bingo.subtitle")}
        </p>
        <div className="mt-3">
          <ShareButtons title={t("bingo.title")} description={t("bingo.subtitle")} />
        </div>
      </div>

      {/* Cards */}
      {cards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Grid3X3 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("bingo.empty")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("bingo.emptyDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {cards.map((card: any) => {
            const squares = parseBingoSquares(card.squaresJson || "[]");
            if (!squares) return null;

            const completed = progressMap[card.id] || new Set<number>();
            const completedCount = completed.size;
            const total = squares.length;
            const isComplete = completedCount === total;
            const expanded = expandedCardId === card.id;
            const showShare = shareCardId === card.id;
            const themeInfo = THEME_LABELS[card.theme] || THEME_LABELS.newcomer;
            const gridSize = total <= 9 ? 3 : total <= 16 ? 4 : 5;

            return (
              <Card key={card.id} className={`overflow-hidden ${isComplete ? "ring-2 ring-amber-400/50" : ""}`}>
                {/* Card header - always visible */}
                <button
                  type="button"
                  className="w-full text-left px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedCardId(expanded ? null : card.id)}
                  aria-expanded={expanded}
                  aria-controls={`bingo-card-${card.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{themeInfo.icon}</span>
                      <div>
                        <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                          {card.title}
                          {isComplete && (
                            <Trophy className="w-4 h-4 text-amber-500" />
                          )}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${themeInfo.color}`}>
                            {t(themeInfo.labelKey)}
                          </span>
                          <span>{t("bingo.completed", { completed: completedCount, total })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Progress ring */}
                      <div className="relative w-10 h-10">
                        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18" cy="18" r="15.5"
                            fill="none" stroke="currentColor"
                            strokeWidth="2.5"
                            className="text-muted/50"
                          />
                          <circle
                            cx="18" cy="18" r="15.5"
                            fill="none" stroke="currentColor"
                            strokeWidth="2.5"
                            strokeDasharray={`${(completedCount / total) * 97.4} 97.4`}
                            strokeLinecap="round"
                            className={isComplete ? "text-amber-500" : "text-primary"}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                          {Math.round((completedCount / total) * 100)}%
                        </span>
                      </div>
                      {expanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded bingo grid */}
                {expanded && (
                  <div id={`bingo-card-${card.id}`} className="px-5 pb-5 border-t border-border pt-4">
                    {card.description && (
                      <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
                    )}

                    <div
                      className="grid gap-2 mb-4"
                      style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
                    >
                      {squares.map((sq) => {
                        const done = completed.has(sq.id);
                        return (
                          <button
                            key={sq.id}
                            aria-pressed={done}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSquare(card.id, sq.id, squares);
                            }}
                            className={`relative rounded-lg p-2 text-center aspect-square flex flex-col items-center justify-center transition-all border ${
                              done
                                ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                                : "bg-muted/30 border-border hover:bg-muted/60 hover:border-primary/20"
                            }`}
                          >
                            {done && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </div>
                            )}
                            <span className={`text-xs leading-tight font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                              {sq.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Share button */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareCardId(showShare ? null : card.id);
                        }}
                      >
                        <Sparkles className="w-4 h-4" />
                        {showShare ? t("bingo.hideShare") : t("bingo.generateShare")}
                      </Button>
                    </div>

                    {/* Shareable card preview */}
                    {showShare && (
                      <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                        <h4 className="text-sm font-semibold text-foreground mb-3">
                          {t("bingo.shareProgress")}
                        </h4>
                        <ShareablePassportCard
                          cardTitle={card.title}
                          cardTheme={card.theme}
                          squares={squares}
                          completedSquareIds={Array.from(completed)}
                          userName={user?.name || t("bingo.explorer")}
                          completedAt={completionDates[card.id]}
                          totalStamps={passportEntries.length}
                          neighborhoodCount={neighborhoodCount}
                        />
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BingoLanding() {
  const { t } = useI18n();
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-teal-400" />
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-cyan-300" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-blue-400" />
        </div>
        <div className="container max-w-5xl relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-6">
              <Grid3X3 className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">{t("bingo.challengeCards")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              {t("bingo.explore")}
              <br />
              <span className="text-teal-600">{t("bingo.oneSquare")}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {t("bingo.landingDescription")}
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href={getLoginUrl()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors no-underline"
              >
                <LogIn className="w-4 h-4" />
                {t("bingo.signIn")}
              </a>
              <Link href="/passport" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-background text-foreground font-semibold hover:bg-muted transition-colors no-underline">
                CLT Passport
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Cards Preview */}
      <section className="py-16 bg-background">
        <div className="container max-w-5xl">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-12">{t("bingo.themedCards")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "\uD83C\uDF7A", title: t("bingo.breweryTour"), desc: t("bingo.breweryTourDescription"), theme: "food-drink", color: "bg-amber-500/10 border-amber-200" },
              { icon: "\u2615", title: t("bingo.coffeeTour"), desc: t("bingo.coffeeTourDescription"), theme: "food-drink", color: "bg-orange-500/10 border-orange-200" },
              { icon: "\uD83C\uDF03", title: t("bingo.dateNight"), desc: t("bingo.dateNightDescription"), theme: "experiences", color: "bg-purple-500/10 border-purple-200" },
            ].map((card) => (
              <div key={card.title} className={`rounded-xl border p-6 ${card.color}`}>
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="font-display font-bold text-foreground mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{card.desc}</p>
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded bg-muted/50 border border-border/50 flex items-center justify-center">
                      {i < 3 ? <Check className="w-3 h-3 text-green-500" /> : <span className="text-xs text-muted-foreground">?</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-5xl">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-12">{t("bingo.howItWorks")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
                <Grid3X3 className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t("bingo.pickCard")}</h3>
              <p className="text-sm text-muted-foreground">{t("bingo.pickCardDescription")}</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t("bingo.visitCheck")}</h3>
              <p className="text-sm text-muted-foreground">{t("bingo.visitCheckDescription")}</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t("bingo.completeShare")}</h3>
              <p className="text-sm text-muted-foreground">{t("bingo.completeShareDescription")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-background">
        <div className="container max-w-3xl text-center">
          <Grid3X3 className="w-12 h-12 text-teal-600 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            {t("bingo.ready")}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            {t("bingo.readyDescription")}
          </p>
          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-teal-600 text-white font-semibold text-lg hover:bg-teal-700 transition-colors no-underline"
          >
            <LogIn className="w-5 h-5" />
            {t("bingo.start")}
          </a>
        </div>
      </section>
    </div>
  );
}

export default function BingoCards() {
  const { t } = useI18n();
  useSEO({
    title: t("bingo.seoTitle"),
    description: t("bingo.seoDescription"),
    keywords: "Charlotte bingo, CLT bingo, Charlotte brewery tour, Charlotte challenges, things to do Charlotte NC, Charlotte date night ideas",
    path: "/bingo",
  });

  const { user, loading } = useAuth();

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">{t("bingo.loading")}</div>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <BingoLanding />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <BingoContent />
    </PageLayout>
  );
}
