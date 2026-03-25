import { Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useMemo } from "react";

interface WishlistButtonProps {
  serviceKey: string;
  className?: string;
  size?: "sm" | "md";
}

export default function WishlistButton({ serviceKey, className = "", size = "sm" }: WishlistButtonProps) {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  // Only fetch wishlist if user is logged in
  const { data: wishlistEntries = [] } = trpc.wishlist.getEntries.useQuery(
    undefined,
    { enabled: !!user }
  );

  const isWishlisted = useMemo(
    () => wishlistEntries.some(e => e.serviceKey === serviceKey),
    [wishlistEntries, serviceKey]
  );

  const addMutation = trpc.wishlist.add.useMutation({
    onSuccess: () => {
      utils.wishlist.getEntries.invalidate();
      toast.success("Added to wishlist");
    },
    onError: () => {
      toast.error("Failed to add to wishlist");
    },
  });

  const removeMutation = trpc.wishlist.remove.useMutation({
    onSuccess: () => {
      utils.wishlist.getEntries.invalidate();
      toast.success("Removed from wishlist");
    },
    onError: () => {
      toast.error("Failed to remove from wishlist");
    },
  });

  const isPending = addMutation.isPending || removeMutation.isPending;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Redirect to login
      window.location.href = getLoginUrl();
      return;
    }

    if (isWishlisted) {
      removeMutation.mutate({ serviceKey });
    } else {
      addMutation.mutate({ serviceKey });
    }
  }

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const btnSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";

  return (
    <button
      onClick={handleClick}
      disabled={isPending || loading}
      className={`${btnSize} rounded-full flex items-center justify-center transition-all duration-200 ${
        isWishlisted
          ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
          : "bg-muted/50 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
      } ${isPending ? "opacity-50" : ""} ${className}`}
      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`${iconSize} ${isWishlisted ? "fill-rose-500" : ""}`}
      />
    </button>
  );
}
