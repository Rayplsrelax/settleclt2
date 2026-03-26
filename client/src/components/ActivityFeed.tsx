import { trpc } from "@/lib/trpc";
import { Stamp, MessageCircle, Grid3X3, Activity, Clock } from "lucide-react";

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getActivityIcon(type: string) {
  switch (type) {
    case "stamp":
      return <Stamp className="w-4 h-4 text-primary" />;
    case "comment":
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case "bingo":
      return <Grid3X3 className="w-4 h-4 text-purple-500" />;
    default:
      return <Activity className="w-4 h-4 text-muted-foreground" />;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case "stamp":
      return "bg-primary/10 border-primary/20";
    case "comment":
      return "bg-blue-50 border-blue-200";
    case "bingo":
      return "bg-purple-50 border-purple-200";
    default:
      return "bg-muted border-border";
  }
}

function anonymize(name: string | null) {
  if (!name) return "A CLT explorer";
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return `${parts[0]} ${parts[1][0]}.`;
  }
  return parts[0];
}

export default function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const { data: activities, isLoading } = trpc.activity.recent.useQuery(
    { limit },
    { refetchInterval: 30000 }
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No activity yet. Be the first to explore Charlotte!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity, i) => (
        <div
          key={`${activity.type}-${activity.id}-${i}`}
          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${getActivityColor(activity.type)}`}
        >
          <div className="mt-0.5 flex-shrink-0">{getActivityIcon(activity.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{anonymize(activity.userName)}</span>{" "}
              <span className="text-muted-foreground">{activity.description}</span>
            </p>
            {activity.detail && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.detail}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground/70 flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(activity.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
