import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  User,
  Stamp,
  Heart,
  MessageSquare,
  LogOut,
  LogIn,
  Calendar,
  Shield,
  Grid3X3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const featureLinks = [
  {
    href: "/passport",
    icon: Stamp,
    label: "CLT Passport",
    description: "Track places you've visited and collect stamps",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    href: "/wishlist",
    icon: Heart,
    label: "My Wishlist",
    description: "Save places you want to visit with notes",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    href: "/bingo",
    icon: Grid3X3,
    label: "CLT Bingo",
    description: "Complete themed challenges and share your progress",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    href: "/directory",
    icon: MessageSquare,
    label: "My Reviews",
    description: "Share your experiences at local spots",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    comingSoon: true,
  },
];

export default function Profile() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                Sign in to Settle CLT
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Create an account to track your CLT Passport, save your wishlist,
                and share your experiences with the community.
              </p>
              <a
                href={getLoginUrl()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity no-underline"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </a>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-12 max-w-3xl">
        {/* Profile header */}
        <div className="flex items-start gap-5 mb-10">
          <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-primary">
              {getInitials(user.name)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-display font-bold text-foreground truncate">
              {user.name || "User"}
            </h1>
            {user.email && (
              <p className="text-muted-foreground text-sm mt-0.5 truncate">
                {user.email}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {formatDate(user.createdAt)}
              </span>
              {user.role === "admin" && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">
          Your Charlotte Journey
        </h2>
        <div className="grid gap-3 mb-10">
          {featureLinks.map((feature) => (
            <Link key={feature.href} href={feature.href} className="no-underline">
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 py-4">
                  <div
                    className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center shrink-0`}
                  >
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {feature.label}
                      </span>
                      {feature.comingSoon && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-muted-foreground shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </PageLayout>
  );
}
