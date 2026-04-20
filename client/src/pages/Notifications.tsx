import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Bell, Check, CheckCheck, Trash2, Settings2, ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "@/lib/timeUtils";
import { useSEO } from "@/hooks/useSEO";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const CATEGORY_ICONS: Record<string, string> = {
  claim: "🏢",
  review: "⭐",
  payment: "💳",
  event: "📅",
  community: "🎯",
  system: "🔔",
};

const CATEGORY_LABELS: Record<string, string> = {
  claim: "Business Claims",
  review: "Reviews",
  payment: "Payments",
  event: "Events",
  community: "Community",
  system: "System",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  claim: "Updates when your business claim is approved or denied",
  review: "New reviews on your claimed businesses",
  payment: "Payment confirmations, failures, and subscription renewals",
  event: "New events in Charlotte and your favorite neighborhoods",
  community: "Bingo completions, leaderboard updates, and referrals",
  system: "Welcome messages, announcements, and platform updates",
};

const ALL_CATEGORIES = ["claim", "review", "payment", "event", "community", "system"] as const;

export default function Notifications() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("inbox");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const { state: pushState, isSubscribed: isPushSubscribed, subscribe: subscribePush, unsubscribe: unsubscribePush, isSupported: isPushSupported } = usePushNotifications();

  useSEO({
    title: "Notifications | Settle CLT",
    description: "Manage your notification preferences and view your notification history.",
    path: "/notifications",
  });

  const { data: notifications, refetch, isLoading: loadingNotifs } = trpc.notifications.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!user }
  );

  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: preferences, refetch: refetchPrefs } = trpc.notifications.getPreferences.useQuery(undefined, {
    enabled: !!user,
  });

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

  const updatePref = trpc.notifications.updatePreference.useMutation({
    onSuccess: () => refetchPrefs(),
  });

  const unreadCount = unreadData?.count ?? 0;

  // Build preferences map
  const prefsMap = useMemo(() => {
    const map: Record<string, { inApp: boolean; email: boolean; push: boolean }> = {};
    ALL_CATEGORIES.forEach((cat) => {
      map[cat] = { inApp: true, email: true, push: false }; // defaults
    });
    if (preferences) {
      for (const p of preferences) {
        map[p.category] = { inApp: p.inApp, email: p.email, push: p.push };
      }
    }
    return map;
  }, [preferences]);

  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    if (!filterCategory) return notifications;
    return notifications.filter((n) => n.category === filterCategory);
  }, [notifications, filterCategory]);

  if (loading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view notifications</h2>
        <p className="text-muted-foreground mb-6">Get updates on business claims, reviews, events, and more.</p>
        <Button onClick={() => (window.location.href = getLoginUrl())}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="inbox" className="gap-1.5">
            <Bell className="w-4 h-4" />
            Inbox
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings2 className="w-4 h-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          {/* Filter bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  !filterCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 shrink-0"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notification list */}
          {loadingNotifs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-muted rounded-lg h-20" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                {filterCategory ? `No ${CATEGORY_LABELS[filterCategory]?.toLowerCase()} notifications` : "No notifications yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`group flex gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    !notif.isRead
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    if (!notif.isRead) markRead.mutate({ id: notif.id });
                    if (notif.actionUrl) navigate(notif.actionUrl);
                  }}
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center text-base">
                    {CATEGORY_ICONS[notif.category] || "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!notif.isRead ? "font-semibold" : ""}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotif.mutate({ id: notif.id });
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {CATEGORY_LABELS[notif.category]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(notif.createdAt))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
              <CardDescription>
                Choose which notifications you want to receive and how you want to receive them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {/* Header row */}
                <div className="grid grid-cols-[1fr_60px_60px_60px] gap-4 pb-3 border-b border-border mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">In-App</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Email</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Push</span>
                </div>

                {ALL_CATEGORIES.map((cat) => (
                  <div key={cat} className="grid grid-cols-[1fr_60px_60px_60px] gap-4 py-3 border-b border-border/50 items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{CATEGORY_ICONS[cat]}</span>
                        <span className="text-sm font-medium">{CATEGORY_LABELS[cat]}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 ml-7">{CATEGORY_DESCRIPTIONS[cat]}</p>
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={prefsMap[cat]?.inApp ?? true}
                        onCheckedChange={(checked) =>
                          updatePref.mutate({ category: cat, inApp: checked })
                        }
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={prefsMap[cat]?.email ?? true}
                        onCheckedChange={(checked) =>
                          updatePref.mutate({ category: cat, email: checked })
                        }
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={prefsMap[cat]?.push ?? false}
                        onCheckedChange={(checked) =>
                          updatePref.mutate({ category: cat, push: checked })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Push notification global toggle */}
              <div className="mt-6 p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Browser Push Notifications</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {!isPushSupported
                        ? "Push notifications are not supported in this browser."
                        : pushState === "denied"
                        ? "Push notifications are blocked. Please enable them in your browser settings."
                        : isPushSubscribed
                        ? "Push notifications are enabled. You'll receive alerts even when the site is closed."
                        : "Enable push notifications to receive alerts even when you're not on the site."}
                    </p>
                  </div>
                  <Button
                    variant={isPushSubscribed ? "outline" : "default"}
                    size="sm"
                    disabled={!isPushSupported || pushState === "denied" || pushState === "loading"}
                    onClick={isPushSubscribed ? unsubscribePush : subscribePush}
                  >
                    {isPushSubscribed ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Push notifications require browser permission. You'll be prompted to allow notifications when you enable push for the first time.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
