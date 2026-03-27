import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, BarChart3, TrendingUp, Search, Download, Calendar,
  Eye, MousePointer, Award, Share2, ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";

const COLORS = [
  "#06d6a0", "#118ab2", "#ef476f", "#ffd166", "#073b4c",
  "#8338ec", "#ff006e", "#3a86ff", "#fb5607", "#8ac926"
];

const ENGAGEMENT_COLORS: Record<string, string> = {
  view: "#3a86ff",
  click: "#06d6a0",
  stamp: "#ffd166",
  share: "#ef476f",
};

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);

  const tagAnalytics = trpc.analytics.tags.useQuery({ days });
  const searchAnalytics = trpc.analytics.searches.useQuery({ days });
  const popularSearches = trpc.analytics.popularSearches.useQuery({ limit: 20, days });

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin Only</h1>
          <p className="text-muted-foreground">You need admin access to view analytics.</p>
          <Link href="/" className="text-primary hover:underline mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  const velocityData = useMemo(() => {
    if (!tagAnalytics.data?.velocityData) return [];
    return tagAnalytics.data.velocityData.map(v => {
      const thisWeek = Number(v.thisWeek) || 0;
      const lastWeek = Number(v.lastWeek) || 0;
      const change = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek * 100) : (thisWeek > 0 ? 100 : 0);
      return { ...v, thisWeek, lastWeek, change: Math.round(change) };
    });
  }, [tagAnalytics.data?.velocityData]);

  const exportCSV = () => {
    if (!tagAnalytics.data?.topTags) return;
    const headers = "Tag,Category,Total,Views,Clicks,Stamps,Shares\n";
    const rows = tagAnalytics.data.topTags.map(t =>
      `"${t.tagName}","${t.tagCategory}",${t.total},${t.views},${t.clicks},${t.stamps},${t.shares}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settle-clt-analytics-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = tagAnalytics.isLoading || searchAnalytics.isLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/blog" className="p-2 rounded-lg hover:bg-accent transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Tag engagement, search trends, and content performance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg bg-accent border border-border text-sm text-foreground"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl py-8 space-y-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                icon={<Eye className="w-5 h-5" />}
                label="Total Tag Engagements"
                value={tagAnalytics.data?.topTags?.reduce((sum, t) => sum + Number(t.total), 0) || 0}
                color="text-blue-400"
              />
              <SummaryCard
                icon={<Search className="w-5 h-5" />}
                label="Total Searches"
                value={Number(searchAnalytics.data?.totalSearches) || 0}
                color="text-emerald-400"
              />
              <SummaryCard
                icon={<BarChart3 className="w-5 h-5" />}
                label="Unique Search Terms"
                value={Number(searchAnalytics.data?.uniqueQueries) || 0}
                color="text-amber-400"
              />
              <SummaryCard
                icon={<Search className="w-5 h-5" />}
                label="Zero-Result Searches"
                value={Number(searchAnalytics.data?.zeroResultQueries) || 0}
                color="text-red-400"
                subtitle="Content gaps"
              />
            </div>

            {/* Tag Engagement Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Top Tags by Engagement
                </h2>
                {tagAnalytics.data?.topTags && tagAnalytics.data.topTags.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={tagAnalytics.data.topTags.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="tagName"
                        width={120}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="views" name="Views" fill={ENGAGEMENT_COLORS.view} stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="clicks" name="Clicks" fill={ENGAGEMENT_COLORS.click} stackId="a" />
                      <Bar dataKey="stamps" name="Stamps" fill={ENGAGEMENT_COLORS.stamp} stackId="a" />
                      <Bar dataKey="shares" name="Shares" fill={ENGAGEMENT_COLORS.share} stackId="a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No tag engagement data yet
                  </div>
                )}
              </div>

              {/* Engagement by Content Type */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  By Content Type
                </h2>
                {tagAnalytics.data?.engagementByType && tagAnalytics.data.engagementByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tagAnalytics.data.engagementByType.filter(e => e.contentType)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="contentType"
                        label={({ contentType, percent }) =>
                          `${contentType || 'other'} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {tagAnalytics.data.engagementByType.filter(e => e.contentType).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No content type data yet
                  </div>
                )}
              </div>
            </div>

            {/* Daily Engagement Trend */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Daily Engagement Trend
              </h2>
              {tagAnalytics.data?.dailyEngagement && tagAnalytics.data.dailyEngagement.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={tagAnalytics.data.dailyEngagement}>
                    <defs>
                      <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06d6a0" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06d6a0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                      labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    />
                    <Area type="monotone" dataKey="count" stroke="#06d6a0" fill="url(#engagementGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No daily data yet
                </div>
              )}
            </div>

            {/* Trending Velocity + Popular Searches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trending Velocity */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Trending Velocity
                  <span className="text-xs text-muted-foreground font-normal ml-1">(this week vs last week)</span>
                </h2>
                <div className="space-y-3">
                  {velocityData.length > 0 ? velocityData.slice(0, 10).map((v, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-5">{i + 1}</span>
                        <span className="text-sm font-medium text-foreground">{v.tagName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {v.lastWeek} → {v.thisWeek}
                        </span>
                        <span className={`flex items-center gap-1 text-sm font-semibold ${
                          v.change > 0 ? 'text-emerald-400' : v.change < 0 ? 'text-red-400' : 'text-muted-foreground'
                        }`}>
                          {v.change > 0 ? <ArrowUpRight className="w-4 h-4" /> :
                           v.change < 0 ? <ArrowDownRight className="w-4 h-4" /> :
                           <Minus className="w-4 h-4" />}
                          {Math.abs(v.change)}%
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No velocity data yet</p>
                  )}
                </div>
              </div>

              {/* Popular Searches */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Popular Searches
                </h2>
                <div className="space-y-3">
                  {popularSearches.data && popularSearches.data.length > 0 ? popularSearches.data.slice(0, 10).map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-5">{i + 1}</span>
                        <span className="text-sm font-medium text-foreground">"{s.query}"</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {s.searchCount} searches
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          Number(s.avgResults) === 0
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          ~{s.avgResults} results
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No search data yet — searches will appear here as users use the search bar</p>
                  )}
                </div>
              </div>
            </div>

            {/* Daily Search Trend */}
            {searchAnalytics.data?.dailySearches && searchAnalytics.data.dailySearches.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Daily Search Volume
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={searchAnalytics.data.dailySearches}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                      labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    />
                    <Line type="monotone" dataKey="count" stroke="#3a86ff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color, subtitle }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className={`${color} mb-2`}>{icon}</div>
      <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {subtitle && <div className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</div>}
    </div>
  );
}
