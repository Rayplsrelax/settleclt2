import DOMPurify from "dompurify";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Sparkles, Send, Eye, Building2, Calendar, FileText, TrendingUp, Users, Loader2 } from "lucide-react";

export default function AdminDigest() {
  const { user, loading: authLoading } = useAuth();
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const preview = trpc.digest.preview.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const generateMutation = trpc.digest.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedHtml(typeof data.html === 'string' ? data.html : '');
      setShowPreview(true);
      toast.success(`Digest generated! ${data.stats.listings} listings, ${data.stats.events} events, ${data.stats.posts} posts included.`);
    },
    onError: (err) => toast.error(err.message),
  });

  const sendMutation = trpc.digest.send.useMutation({
    onSuccess: (data) => {
      toast.success(`Digest notification sent! ${data.recipientCount} recipients.`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="text-muted-foreground mt-2">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  const data = preview.data;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">What's New This Month</h1>
            <p className="text-muted-foreground">Generate and send monthly digest to newsletter subscribers</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Building2 className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{data?.newListings?.length ?? "—"}</div>
              <div className="text-xs text-muted-foreground">New Listings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{data?.upcomingEvents?.length ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Upcoming Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{data?.recentPosts?.length ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Blog Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{data?.trending?.length ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Trending Tags</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{data?.totalRecipients ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Recipients</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Preview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" /> New Listings
              </CardTitle>
              <CardDescription>Added in the past 30 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {data?.newListings?.length ? data.newListings.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate">{l.name}</span>
                  <Badge variant="outline" className="text-xs ml-2 shrink-0">{l.category}</Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No new listings this month</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Upcoming Events
              </CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {data?.upcomingEvents?.length ? data.upcomingEvents.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate">{e.title}</span>
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">
                    {new Date(e.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Trending Topics
              </CardTitle>
              <CardDescription>Most engaged tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data?.trending?.length ? data.trending.map((t: any, i: number) => (
                <div key={t.id || i} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t.name}</span>
                  <Badge className="text-xs">{t.engagementCount} engagements</Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No trending data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            size="lg"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {generateMutation.isPending ? "Generating..." : "Generate Digest with AI"}
          </Button>

          {generatedHtml && (
            <>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>

              <Button
                size="lg"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => sendMutation.mutate({
                  html: generatedHtml,
                  subject: "What's New This Month in Charlotte — Settle CLT",
                })}
                disabled={sendMutation.isPending}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {sendMutation.isPending ? "Sending..." : `Send to ${data?.totalRecipients ?? 0} Recipients`}
              </Button>
            </>
          )}
        </div>

        {/* Generated Email Preview */}
        {showPreview && generatedHtml && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" /> Email Preview
              </CardTitle>
              <CardDescription>This is how the digest will appear in subscribers' inboxes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-white">
                <div
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generatedHtml) }}
                  className="prose max-w-none"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
