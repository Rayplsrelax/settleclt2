import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Download, Share2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BingoSquare {
  id: number;
  label: string;
  serviceKey?: string;
  category?: string;
}

interface ShareablePassportCardProps {
  cardTitle: string;
  cardTheme: string;
  squares: BingoSquare[];
  completedSquareIds: number[];
  userName: string;
  completedAt?: Date | null;
  totalStamps: number;
  neighborhoodCount: number;
}

const THEME_COLORS: Record<string, { bg: string; accent: string; badge: string; icon: string }> = {
  "food-drink": {
    bg: "from-amber-600 via-orange-500 to-red-500",
    accent: "bg-amber-400/20",
    badge: "bg-amber-400 text-amber-900",
    icon: "🍺",
  },
  experiences: {
    bg: "from-purple-600 via-pink-500 to-rose-500",
    accent: "bg-purple-400/20",
    badge: "bg-purple-400 text-purple-900",
    icon: "✨",
  },
  newcomer: {
    bg: "from-teal-600 via-cyan-500 to-blue-500",
    accent: "bg-teal-400/20",
    badge: "bg-teal-400 text-teal-900",
    icon: "🏙️",
  },
};

function getGridSize(total: number): number {
  if (total <= 9) return 3;
  if (total <= 16) return 4;
  return 5;
}

export default function ShareablePassportCard({
  cardTitle,
  cardTheme,
  squares,
  completedSquareIds,
  userName,
  completedAt,
  totalStamps,
  neighborhoodCount,
}: ShareablePassportCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const theme = THEME_COLORS[cardTheme] || THEME_COLORS.newcomer;
  const gridSize = getGridSize(squares.length);
  const completedCount = completedSquareIds.length;
  const isComplete = completedCount === squares.length;
  const progressPct = Math.round((completedCount / squares.length) * 100);

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return null;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#1a1a2e",
      });
      return dataUrl;
    } catch (err) {
      console.error("Failed to generate image:", err);
      toast.error("Failed to generate image. Please try again.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `clt-passport-${cardTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Card downloaded! Share it on social media 🎉");
  }, [generateImage, cardTitle]);

  const handleShare = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    // Convert data URL to blob for sharing
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `clt-passport-${cardTitle.toLowerCase().replace(/\s+/g, "-")}.png`, {
      type: "image/png",
    });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `My CLT Passport - ${cardTitle}`,
          text: `I'm exploring Charlotte! ${completedCount}/${squares.length} spots checked off on my ${cardTitle} card. #SettleCLT #CharlotteNC`,
          files: [file],
        });
      } catch (err) {
        // User cancelled share — that's fine
        if ((err as Error).name !== "AbortError") {
          toast.error("Sharing failed. Try downloading instead.");
        }
      }
    } else {
      // Fallback: copy text to clipboard
      try {
        await navigator.clipboard.writeText(
          `I'm exploring Charlotte! ${completedCount}/${squares.length} spots checked off on my ${cardTitle} card 🏙️ #SettleCLT #CharlotteNC`
        );
        toast.success("Share text copied to clipboard! Download the image to share together.");
        handleDownload();
      } catch {
        handleDownload();
      }
    }
  }, [generateImage, cardTitle, completedCount, squares.length, handleDownload]);

  return (
    <div className="space-y-4">
      {/* The card that will be rendered to image */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl"
        style={{ width: "480px", maxWidth: "100%" }}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-95`} />
        
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px),
                           radial-gradient(circle at 80% 20%, white 1px, transparent 1px),
                           radial-gradient(circle at 50% 50%, white 0.5px, transparent 0.5px)`,
          backgroundSize: "60px 60px, 80px 80px, 40px 40px",
        }} />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{theme.icon}</span>
              <div>
                <div className="text-white/60 text-[10px] font-semibold tracking-widest uppercase">
                  CLT Passport
                </div>
                <h3 className="text-white font-bold text-lg leading-tight">
                  {cardTitle}
                </h3>
              </div>
            </div>
            {isComplete && (
              <div className={`${theme.badge} px-3 py-1 rounded-full text-xs font-bold`}>
                COMPLETE ✓
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 mb-4 mt-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{userName}</div>
              <div className="text-white/50 text-[10px]">
                {totalStamps} stamps · {neighborhoodCount} neighborhoods
              </div>
            </div>
          </div>

          {/* Bingo grid */}
          <div
            className="grid gap-1.5 mb-4"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
          >
            {squares.slice(0, gridSize * gridSize).map((sq) => {
              const done = completedSquareIds.includes(sq.id);
              return (
                <div
                  key={sq.id}
                  className={`relative rounded-lg p-1.5 text-center flex flex-col items-center justify-center aspect-square transition-all ${
                    done
                      ? "bg-white/25 ring-1 ring-white/40"
                      : "bg-black/20"
                  }`}
                >
                  {done && (
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-green-400 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-green-900" strokeWidth={3} />
                    </div>
                  )}
                  {!done && (
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                      <X className="w-2.5 h-2.5 text-white/30" strokeWidth={2} />
                    </div>
                  )}
                  <span
                    className={`text-[9px] leading-tight font-medium ${
                      done ? "text-white" : "text-white/40"
                    }`}
                  >
                    {sq.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-white/60 mb-1">
              <span>{completedCount}/{squares.length} completed</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="text-white/40 text-[9px]">
              {completedAt
                ? `Completed ${new Date(completedAt).toLocaleDateString()}`
                : "In progress..."}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="text-white/60 text-[9px] font-semibold">
                settleclt.com
              </div>
              <div className="w-5 h-5 rounded bg-white/15 flex items-center justify-center">
                <span className="text-[10px]">🏙️</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons (not rendered in the image) */}
      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex-1 gap-2"
          variant="outline"
        >
          <Download className="w-4 h-4" />
          {isGenerating ? "Generating..." : "Download Card"}
        </Button>
        <Button
          onClick={handleShare}
          disabled={isGenerating}
          className="flex-1 gap-2"
        >
          <Share2 className="w-4 h-4" />
          {isGenerating ? "Generating..." : "Share"}
        </Button>
      </div>
    </div>
  );
}
