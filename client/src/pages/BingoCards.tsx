import PageLayout from "@/components/PageLayout";
import AuthGate from "@/components/AuthGate";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Grid3X3, Check, Trophy, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ShareablePassportCard from "@/components/ShareablePassportCard";
import { useSEO } from "@/hooks/useSEO";
import ShareButtons from "@/components/ShareButtons";

interface BingoSquare {
  id: number;
  label: string;
  serviceKey?: string;
  category?: string;
}

const THEME_LABELS: Record<string, { label: string; icon: string; color: string; gradient: string }> = {
  "food-drink": { label: "Food & Drink", icon: "🍺", color: "bg-amber-500/10 text-amber-600", gradient: "from-amber-500/10 to-orange-500/5" },
  experiences: { label: "Experiences", icon: "✨", color: "bg-purple-500/10 text-purple-600", gradient: "from-purple-500/10 to-pink-500/5" },
  newcomer: { label: "Newcomer", icon: "🏙️", color: "bg-teal-500/10 text-teal-600", gradient: "from-teal-500/10 to-cyan-500/5" },
};

function BingoContent() {
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
      toast.success("🎉 Bingo! You completed the card! Share your achievement!");
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
            CLT Bingo Cards
          </h1>
        </div>
        <p className="text-muted-foreground max-w-xl">
          Explore Charlotte through themed challenges. Check off spots as you visit them and
          share your completed cards on social media!
        </p>
        <div className="mt-3">
          <ShareButtons title="CLT Bingo Cards" description="Explore Charlotte through themed challenges" />
        </div>
      </div>

      {/* Cards */}
      {cards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Grid3X3 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No bingo cards yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Check back soon for themed Charlotte exploration challenges!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {cards.map((card: any) => {
            let squares: BingoSquare[] = [];
            try {
              squares = JSON.parse(card.squaresJson || "[]");
            } catch {
              return null;
            }

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
                <div
                  className={`px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors bg-gradient-to-r ${themeInfo.gradient}`}
                  onClick={() => setExpandedCardId(expanded ? null : card.id)}
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
                            {themeInfo.label}
                          </span>
                          <span>{completedCount}/{total} completed</span>
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
                </div>

                {/* Expanded bingo grid */}
                {expanded && (
                  <div className="px-5 pb-5 border-t border-border pt-4">
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
                        {showShare ? "Hide Share Card" : "Generate Share Card"}
                      </Button>
                    </div>

                    {/* Shareable card preview */}
                    {showShare && (
                      <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                        <h4 className="text-sm font-semibold text-foreground mb-3">
                          Share Your Progress
                        </h4>
                        <ShareablePassportCard
                          cardTitle={card.title}
                          cardTheme={card.theme}
                          squares={squares}
                          completedSquareIds={Array.from(completed)}
                          userName={user?.name || "CLT Explorer"}
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

export default function BingoCards() {
  useSEO({
    title: "CLT Bingo — Charlotte Challenge Cards",
    description: "Play CLT Bingo with themed challenge cards: Charlotte Brewery Tour, Best Coffee in CLT, Date Night, and Newcomer Challenge. Explore Charlotte one square at a time.",
    keywords: "Charlotte bingo, CLT bingo, Charlotte brewery tour, Charlotte challenges, things to do Charlotte NC, Charlotte date night ideas",
    path: "/bingo",
  });

  return (
    <PageLayout>
      <AuthGate featureLabel="play CLT Bingo">
        <BingoContent />
      </AuthGate>
    </PageLayout>
  );
}
