import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Star, MessageSquare, Trash2, LogIn, Loader2 } from "lucide-react";
import { trackReviewSubmit } from "@/lib/mixpanel";

const ASPECTS = [
  { value: "general", label: "General" },
  { value: "vibe", label: "Vibe & Culture" },
  { value: "food", label: "Food & Dining" },
  { value: "safety", label: "Safety" },
  { value: "transit", label: "Transit & Commute" },
  { value: "nightlife", label: "Nightlife" },
  { value: "cost", label: "Cost of Living" },
] as const;

function StarRating({ rating, onRate, interactive = false, size = "md" }: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
        >
          <Star
            className={`${sizeClass} ${
              star <= (hover || rating)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ targetType, targetId }: {
  targetType: "neighborhood" | "directory";
  targetId: string;
}) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState("");
  const [aspect, setAspect] = useState<string>("general");

  const { data, isLoading } = trpc.reviews.getByTarget.useQuery(
    { targetType, targetId },
    { enabled: !!targetId }
  );

  const createMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("Review submitted! Thanks for sharing your experience.");
      trackReviewSubmit(targetType, targetId, rating);
      setShowForm(false);
      setRating(0);
      setTip("");
      setAspect("general");
      utils.reviews.getByTarget.invalidate({ targetType, targetId });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      toast.success("Review deleted.");
      utils.reviews.getByTarget.invalidate({ targetType, targetId });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    if (tip.length < 5) { toast.error("Please write at least 5 characters"); return; }
    createMutation.mutate({ targetType, targetId, rating, tip, aspect: aspect as any });
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Community Reviews</h3>
          {data?.stats && data.stats.count > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(data.stats.avgRating)} size="sm" />
              <span className="text-sm text-muted-foreground">
                {data.stats.avgRating.toFixed(1)} ({data.stats.count} {data.stats.count === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>
        {user ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "Write a Review"}
          </Button>
        ) : (
          <a href={getLoginUrl()} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            <LogIn className="w-4 h-4" /> Sign in to review
          </a>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Rating</label>
              <StarRating rating={rating} onRate={setRating} interactive />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Aspect</label>
                <Select value={aspect} onValueChange={setAspect}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECTS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Your Tip or Review</label>
              <Textarea
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                placeholder="Share your experience — what should newcomers know?"
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">{tip.length}/500</p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Submit Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-muted/50 rounded-lg h-24" />
          ))}
        </div>
      ) : data?.reviews?.length ? (
        <div className="space-y-3">
          {data.reviews.map((review: any) => (
            <Card key={review.id} className="bg-card/50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{review.userName || "Anonymous"}</span>
                      <StarRating rating={review.rating} size="sm" />
                      {review.aspect && review.aspect !== "general" && (
                        <Badge variant="outline" className="text-xs capitalize">{review.aspect}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80">{review.tip}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  {user && (user.id === review.userId || user.role === "admin") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate({ reviewId: review.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No reviews yet. Be the first to share your experience!</p>
        </div>
      )}
    </div>
  );
}

/** Compact star rating display for cards/listings */
export function ReviewStars({ targetType, targetId }: {
  targetType: "neighborhood" | "directory";
  targetId: string;
}) {
  const { data } = trpc.reviews.stats.useQuery(
    { targetType, targetId },
    { enabled: !!targetId }
  );

  if (!data || data.count === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <StarRating rating={Math.round(data.avgRating)} size="sm" />
      <span className="text-xs text-muted-foreground">
        {data.avgRating.toFixed(1)} ({data.count})
      </span>
    </div>
  );
}
