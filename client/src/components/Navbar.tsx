import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { Menu, X, LogIn, User, LogOut, Heart, Stamp, ChevronDown, Shield, Grid3X3, Trophy, Building2, Settings } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import GlobalSearch from "@/components/GlobalSearch";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/neighborhoods", label: "Neighborhoods" },
  { href: "/directory", label: "Directory" },
  { href: "/events", label: "Events" },
  { href: "/blog", label: "Blog" },
  { href: "/passport", label: "CLT Passport" },
  { href: "/find-your-home", label: "Find Your Home" },
];

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

function UserMenu() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors outline-none">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground hidden lg:inline max-w-[100px] truncate">
            {user.name || "User"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden lg:inline" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-foreground truncate">{user.name || "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email || ""}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="w-4 h-4 mr-2" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/passport")}>
          <Stamp className="w-4 h-4 mr-2" />
          CLT Passport
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/wishlist")}>
          <Heart className="w-4 h-4 mr-2" />
          My Wishlist
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/bingo")}>
          <Grid3X3 className="w-4 h-4 mr-2" />
          CLT Bingo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/leaderboard")}>
          <Trophy className="w-4 h-4 mr-2" />
          Leaderboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/my-business")}>
          <Building2 className="w-4 h-4 mr-2" />
          My Business
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/notifications")}>
          <Settings className="w-4 h-4 mr-2" />
          Notification Settings
        </DropdownMenuItem>
        {user.role === 'admin' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin/enrich")}>
              <Shield className="w-4 h-4 mr-2" />
              Admin: Enrich Directory
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/blog")}>
              <Shield className="w-4 h-4 mr-2" />
              Admin: Blog Editor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/events")}>
              <Shield className="w-4 h-4 mr-2" />
              Admin: Events Manager
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/analytics")}>
              <Shield className="w-4 h-4 mr-2" />
              Admin: Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/digest")}>
              <Shield className="w-4 h-4 mr-2" />
              Admin: Monthly Digest
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/referrals")}>
              <Shield className="w-4 h-4 mr-2" />
              Admin: Referrals
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/claims")}>
              <Shield className="w-4 h-4 mr-2" />
              Admin: Business Claims
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <nav className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="font-display font-extrabold text-xl tracking-tight text-foreground">
            Settle<span className="text-primary">CLT</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
                location === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-2">
            <GlobalSearch />
          </div>
          <Link
            href="/list-your-business"
            className="ml-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity no-underline"
          >
            List Your Business
          </Link>

          {/* Auth section */}
          {!loading && (
            <>
              {user ? (
                <div className="ml-2 flex items-center gap-1">
                  <NotificationBell />
                  <UserMenu />
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </>
          )}

        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <GlobalSearch />
          {!loading && user && (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
          <div className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-md text-sm font-medium no-underline ${
                  location === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/list-your-business"
              onClick={() => setMobileOpen(false)}
              className="mt-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold text-center no-underline"
            >
              List Your Business
            </Link>
            {!loading && !user && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogin();
                }}
                className="mt-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
