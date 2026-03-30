import { Stamp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useMemo } from "react";
import { allNeighborhoods } from "@shared/neighborhoods";

interface QuickStampButtonProps {
  /** For directory places */
  serviceKey?: string;
  /** For events */
  eventSlug?: string;
  /** Area/neighborhood name for auto-matching */
  area?: string;
  className?: string;
  size?: "sm" | "md";
}

export default function QuickStampButton({
  serviceKey,
  eventSlug,
  area,
  className = "",
  size = "sm",
}: QuickStampButtonProps) {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const { data: entries = [] } = trpc.passport.getEntries.useQuery(undefined, {
    enabled: !!user,
  });

  const isStamped = useMemo(() => {
    if (eventSlug) return entries.some((e) => e.eventSlug === eventSlug);
    if (serviceKey) return entries.some((e) => e.serviceKey === serviceKey);
    return false;
  }, [entries, serviceKey, eventSlug]);

  const addEntry = trpc.passport.addEntry.useMutation({
    onSuccess: () => {
      utils.passport.getEntries.invalidate();
      toast.success("Stamp collected!");
    },
    onError: () => {
      toast.error("Failed to add stamp");
    },
  });

  const isPending = addEntry.isPending;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }

    if (isStamped) {
      toast.info("Already stamped!");
      return;
    }

    const neighborhoodId = area
      ? allNeighborhoods.find((n) => n.name === area)?.id
      : undefined;

    if (eventSlug) {
      addEntry.mutate({
        eventSlug,
        neighborhoodId,
        visitedAt: new Date(),
      });
    } else if (serviceKey) {
      addEntry.mutate({
        serviceKey,
        neighborhoodId,
        visitedAt: new Date(),
      });
    }
  }

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const btnSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";

  return (
    <button
      onClick={handleClick}
      disabled={isPending || loading}
      className={`${btnSize} rounded-full flex items-center justify-center transition-all duration-200 ${
        isStamped
          ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
          : "bg-muted/50 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500"
      } ${isPending ? "opacity-50" : ""} ${className}`}
      title={isStamped ? "Already stamped" : "Add stamp to passport"}
    >
      <Stamp className={`${iconSize} ${isStamped ? "fill-amber-500" : ""}`} />
    </button>
  );
}
