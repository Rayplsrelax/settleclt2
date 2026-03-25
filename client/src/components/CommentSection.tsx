import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState, useMemo } from "react";
import {
  MessageSquare, ThumbsUp, ThumbsDown, Reply, Send, ChevronDown, ChevronUp, Trash2, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CommentSectionProps {
  targetType: "neighborhood" | "service";
  targetId: string;
}

interface CommentData {
  id: number;
  userId: number;
  userName: string | null;
  content: string;
  parentId: number | null;
  upvotes: number;
  downvotes: number;
  targetType: string;
  targetId: string;
  deleted: "yes" | "no";
  createdAt: string | Date;
  userVote?: number | null;
}

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function CommentItem({
  comment,
  replies,
  allComments,
  depth,
  onReply,
  onVote,
  onDelete,
  currentUserId,
}: {
  comment: CommentData;
  replies: CommentData[];
  allComments: CommentData[];
  depth: number;
  onReply: (parentId: number) => void;
  onVote: (commentId: number, voteType: "up" | "down") => void;
  onDelete: (commentId: number) => void;
  currentUserId?: number;
}) {
  const [showReplies, setShowReplies] = useState(depth < 2);
  const nestedReplies = (id: number) => allComments.filter(c => c.parentId === id);

  const initials = (comment.userName || "?")
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`${depth > 0 ? "ml-6 pl-4 border-l-2 border-border/50" : ""}`}>
      <div className="py-3 group">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">{initials}</span>
          </div>
          <span className="text-sm font-medium text-foreground">{comment.userName || "Anonymous"}</span>
          <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
        </div>

        {/* Content */}
        <p className="text-sm text-foreground/90 leading-relaxed mb-2">{comment.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onVote(comment.id, "up")}
              className={`p-1 rounded hover:bg-muted transition-colors ${
                comment.userVote === 1 ? "text-green-500" : "text-muted-foreground"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <span className={`text-xs font-medium min-w-[16px] text-center ${
              (comment.upvotes - comment.downvotes) > 0
                ? "text-green-500"
                : (comment.upvotes - comment.downvotes) < 0
                ? "text-red-500"
                : "text-muted-foreground"
            }`}>
              {comment.upvotes - comment.downvotes}
            </span>
            <button
              onClick={() => onVote(comment.id, "down")}
              className={`p-1 rounded hover:bg-muted transition-colors ${
                comment.userVote === -1 ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onReply(comment.id)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
            Reply
          </button>

          {currentUserId === comment.userId && (
            <button
              onClick={() => onDelete(comment.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <>
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="flex items-center gap-1 text-xs text-primary hover:underline mb-2 ml-1"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              Show {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowReplies(false)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1 ml-1"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                Hide replies
              </button>
              {replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  replies={nestedReplies(reply.id)}
                  allComments={allComments}
                  depth={depth + 1}
                  onReply={onReply}
                  onVote={onVote}
                  onDelete={onDelete}
                  currentUserId={currentUserId}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function CommentSection({ targetType, targetId }: CommentSectionProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: comments = [], isLoading } = trpc.comments.getByTarget.useQuery({
    targetType,
    targetId,
  });

  const addComment = trpc.comments.add.useMutation({
    onSuccess: () => {
      utils.comments.getByTarget.invalidate({ targetType, targetId });
      setNewComment("");
      setReplyingTo(null);
      setReplyText("");
    },
    onError: () => toast.error("Failed to post comment"),
  });

  const vote = trpc.comments.vote.useMutation({
    onSuccess: () => {
      utils.comments.getByTarget.invalidate({ targetType, targetId });
    },
  });

  const deleteComment = trpc.comments.delete.useMutation({
    onSuccess: () => {
      utils.comments.getByTarget.invalidate({ targetType, targetId });
      toast.success("Comment deleted");
    },
  });

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sortBy, setSortBy] = useState<"best" | "newest">("best");

  // Build comment tree
  const topLevel = useMemo(() => {
    const top = (comments as CommentData[]).filter((c: CommentData) => !c.parentId);
    if (sortBy === "newest") {
      return top.sort((a: CommentData, b: CommentData) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // "best" = highest net votes
    return top.sort((a: CommentData, b: CommentData) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  }, [comments, sortBy]);

  const getReplies = (parentId: number) =>
    (comments as CommentData[]).filter((c: CommentData) => c.parentId === parentId)
      .sort((a: CommentData, b: CommentData) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  function handleSubmit() {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!newComment.trim()) return;
    addComment.mutate({
      targetType,
      targetId,
      content: newComment.trim(),
    });
  }

  function handleReply(parentId: number) {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    setReplyingTo(parentId);
    setReplyText("");
  }

  function submitReply() {
    if (!replyText.trim() || replyingTo === null) return;
    addComment.mutate({
      targetType,
      targetId,
      content: replyText.trim(),
      parentId: replyingTo,
    });
  }

  function handleVote(commentId: number, voteType: "up" | "down") {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    vote.mutate({ commentId, voteType });
  }

  function handleDelete(commentId: number) {
    if (confirm("Delete this comment?")) {
      deleteComment.mutate({ id: commentId });
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Community Experiences
          </h3>
          {comments.length > 0 && (
            <span className="text-sm text-muted-foreground">({comments.length})</span>
          )}
        </div>
        {comments.length > 1 && (
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setSortBy("best")}
              className={`px-2 py-1 rounded ${
                sortBy === "best" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Best
            </button>
            <button
              onClick={() => setSortBy("newest")}
              className={`px-2 py-1 rounded ${
                sortBy === "newest" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Newest
            </button>
          </div>
        )}
      </div>

      {/* New comment form */}
      <div className="mb-6">
        {user ? (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || addComment.isPending}
                  className="gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  {addComment.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Sign in to share your experience
            </p>
            <a
              href={getLoginUrl()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity no-underline"
            >
              Sign In
            </a>
          </div>
        )}
      </div>

      {/* Reply form (floating) */}
      {replyingTo !== null && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-card border border-border rounded-xl shadow-xl p-4 z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Replying to comment</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            rows={2}
            autoFocus
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex justify-end mt-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplyingTo(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submitReply}
              disabled={!replyText.trim() || addComment.isPending}
              className="gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              Reply
            </Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-muted" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
              <div className="h-4 w-full bg-muted rounded mb-1" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No experiences shared yet. Be the first to share yours!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {topLevel.map((comment: CommentData) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              allComments={comments}
              depth={0}
              onReply={handleReply}
              onVote={handleVote}
              onDelete={handleDelete}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
