import PageLayout from "@/components/PageLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Trophy, Stamp, Grid3X3, MapPin, Crown, Medal, Award
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ShareButtons from "@/components/ShareButtons";
import { useSEO } from "@/hooks/useSEO";

type Tab = "stamps" | "bingo" | "neighborhoods";

const TABS: { id: Tab; label: string; icon: typeof Trophy; description: string }[] = [
  { id: "stamps", label: "Most Stamps", icon: Stamp, description: "Places visited via CLT Passport" },
  { id: "bingo", label: "Bingo Champs", icon: Grid3X3, description: "Bingo cards completed" },
  { id: "neighborhoods", label: "Explorer", icon: MapPin, description: "Unique neighborhoods visited" },
];

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
}

function getRankBg(rank: number) {
  if (rank === 1) return "bg-amber-500/10 border-amber-400/30";
  if (rank === 2) return "bg-gray-500/5 border-gray-400/20";
  if (rank === 3) return "bg-amber-600/5 border-amber-600/20";
  return "bg-muted/20 border-border";
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
}

function LeaderboardTable({
  data,
  valueLabel,
  valueKey,
  currentUserId,
}: {
  data: { userId: number; userName: string | null; [key: string]: any }[];
  valueLabel: string;
  valueKey: string;
  currentUserId: number | null;
}) {
  if (data.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No explorers yet</h3>
          <p className="text-sm text-muted-foreground">
            Be the first to explore Charlotte and claim the top spot!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((entry, idx) => {
        const rank = idx + 1;
        const isCurrentUser = currentUserId === entry.userId;
        const value = entry[valueKey];

        return (
          <div
            key={entry.userId}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${getRankBg(rank)} ${
              isCurrentUser ? "ring-2 ring-primary/30" : ""
            }`}
          >
            {/* Rank */}
            <div className="w-8 flex items-center justify-center shrink-0">
              {getRankIcon(rank)}
            </div>

            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              rank === 1
                ? "bg-amber-500 text-white"
                : rank === 2
                ? "bg-gray-400 text-white"
                : rank === 3
                ? "bg-amber-600 text-white"
                : "bg-muted text-muted-foreground"
            }`}>
              {getInitials(entry.userName)}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                {entry.userName || "Anonymous Explorer"}
                {isCurrentUser && (
                  <span className="ml-2 text-xs font-medium text-primary/70">(You)</span>
                )}
              </p>
            </div>

            {/* Value */}
            <div className="text-right shrink-0">
              <p className={`text-lg font-bold ${rank <= 3 ? "text-foreground" : "text-muted-foreground"}`}>
                {value}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {valueLabel}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Leaderboard() {
  useSEO({
    title: "CLT Leaderboard — Top Charlotte Explorers",
    description: "See who's exploring Charlotte the most. Leaderboard rankings by passport stamps, bingo completions, and neighborhoods visited. Join the community and climb the ranks.",
    keywords: "Charlotte leaderboard, CLT explorers, Charlotte community, Charlotte passport rankings, explore Charlotte NC",
    path: "/leaderboard",
  });

  const [activeTab, setActiveTab] = useState<Tab>("stamps");
  const { user } = useAuth();

  const { data: stamps = [], isLoading: stampsLoading } = trpc.leaderboard.byStamps.useQuery();
  const { data: bingo = [], isLoading: bingoLoading } = trpc.leaderboard.byBingo.useQuery();
  const { data: neighborhoods = [], isLoading: neighborhoodsLoading } = trpc.leaderboard.byNeighborhoods.useQuery();

  const isLoading = activeTab === "stamps" ? stampsLoading : activeTab === "bingo" ? bingoLoading : neighborhoodsLoading;

  return (
    <PageLayout>
      <div className="container py-12 max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            CLT Explorer Leaderboard
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            See who's exploring Charlotte the most. Earn stamps, complete bingo cards,
            and visit neighborhoods to climb the ranks!
          </p>
          <div className="mt-3">
            <ShareButtons title="CLT Explorer Leaderboard" description="See who's exploring Charlotte the most" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`gap-2 shrink-0 ${isActive ? "" : "bg-transparent"}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">
          {TABS.find(t => t.id === activeTab)?.description}
        </p>

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {activeTab === "stamps" && (
              <LeaderboardTable
                data={stamps}
                valueLabel="stamps"
                valueKey="stampCount"
                currentUserId={user?.id ?? null}
              />
            )}
            {activeTab === "bingo" && (
              <LeaderboardTable
                data={bingo}
                valueLabel="completed"
                valueKey="completedCards"
                currentUserId={user?.id ?? null}
              />
            )}
            {activeTab === "neighborhoods" && (
              <LeaderboardTable
                data={neighborhoods}
                valueLabel="areas"
                valueKey="neighborhoodCount"
                currentUserId={user?.id ?? null}
              />
            )}
          </>
        )}

        {/* CTA for non-logged-in users */}
        {!user && (
          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardContent className="py-6 text-center">
              <p className="text-sm font-medium text-foreground mb-2">
                Want to join the leaderboard?
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Sign in and start exploring Charlotte to earn your spot!
              </p>
              <Button size="sm" asChild>
                <a href={`/passport`}>Start Exploring</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
