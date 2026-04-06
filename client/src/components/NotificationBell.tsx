import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/lib/timeUtils";

const CATEGORY_ICONS: Record<string, string> = {
  claim: "🏢",
  review: "⭐",
  payment: "💳",
  event: "📅",
  community: "🎯",
  system: "🔔",
};

const CATEGORY_COLORS: Record<string, string> = {
  claim: "bg-blue-500/10 text-blue-600",
  review: "bg-amber-500/10 text-amber-600",
  payment: "bg-green-500/10 text-green-600",
  event: "bg-purple-500/10 text-purple-600",
  community: "bg-pink-500/10 text-pink-600",
  system: "bg-gray-500/10 text-gray-600",
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const { data: notifications, refetch } = trpc.notifications.list.useQuery(
    { limit: 10, offset: 0 },
    { enabled: !!user && open }
  );

  const utils = trpc.useUtils();

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      refetch();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      refetch();
    },
  });

  const deleteNotif = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      refetch();
    },
  });

  const unreadCount = unreadData?.count ?? 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-popover text-popover-foreground border border-border rounded-xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-[360px]">
            {!notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notif.isRead ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (!notif.isRead) {
                      markRead.mutate({ id: notif.id });
                    }
                    if (notif.actionUrl) {
                      setOpen(false);
                      navigate(notif.actionUrl);
                    }
                  }}
                >
                  {/* Category icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${CATEGORY_COLORS[notif.category] || "bg-muted"}`}>
                    {CATEGORY_ICONS[notif.category] || "🔔"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!notif.isRead ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt))}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotif.mutate({ id: notif.id });
                      }}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5 bg-muted/30">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
                className="text-xs text-primary hover:underline font-medium w-full text-center"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
