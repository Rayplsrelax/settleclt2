import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import {
  Menu,
  X,
  LogIn,
  User,
  LogOut,
  Heart,
  Stamp,
  ChevronDown,
  Shield,
  Grid3X3,
  Trophy,
  Building2,
  Settings,
  Home,
  DollarSign,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import GlobalSearch from "@/components/GlobalSearch";
import { useI18n } from "@/i18n/I18nContext";
import type { TranslationKey } from "@/i18n/locales/en";

const navLinkDefs: Array<{ href: string; key: TranslationKey }> = [
  { href: "/", key: "nav.home" },
  { href: "/neighborhoods", key: "nav.neighborhoods" },
  { href: "/directory", key: "nav.directory" },
  { href: "/events", key: "nav.events" },
  { href: "/blog", key: "nav.blog" },
];
const navLinks = navLinkDefs;

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function UserMenu() {
  const { t } = useI18n();
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
          <p className="text-sm font-medium text-foreground truncate">
            {user.name || "User"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user.email || ""}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="w-4 h-4 mr-2" />
          {t("user.myProfile")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/my-business")}>
          <Building2 className="w-4 h-4 mr-2" />
          {t("user.myBusiness")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/passport")}>
          <Stamp className="w-4 h-4 mr-2" />
          {t("user.cltPassport")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/find-your-home")}>
          <Home className="w-4 h-4 mr-2" />
          {t("user.findYourHome")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/business-pricing")}>
          <DollarSign className="w-4 h-4 mr-2" />
          {t("user.businessPricing")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/wishlist")}>
          <Heart className="w-4 h-4 mr-2" />
          {t("user.myWishlist")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/bingo")}>
          <Grid3X3 className="w-4 h-4 mr-2" />
          {t("user.cltBingo")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/leaderboard")}>
          <Trophy className="w-4 h-4 mr-2" />
          {t("user.leaderboard")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/notifications")}>
          <Settings className="w-4 h-4 mr-2" />
          {t("user.notificationSettings")}
        </DropdownMenuItem>
        {user.role === "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin/enrich")}>
              <Shield className="w-4 h-4 mr-2" />
              {t("user.adminDashboard")}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t("nav.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { t } = useI18n();
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
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
                location === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {t(link.key)}
            </Link>
          ))}
          <div className="ml-2">
            <GlobalSearch />
          </div>
          <Link
            href="/list-your-business"
            className="ml-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity no-underline"
          >
            {t("nav.listYourBusiness")}
          </Link>

          {/* Auth section */}
          <LanguageToggle />
          <ThemeToggle />
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
                  {t("nav.signIn")}
                </button>
              )}
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <GlobalSearch />
          <LanguageToggle />
          <ThemeToggle />
          {!loading && user && (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
            aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg"
        >
          <div className="container py-4 flex flex-col gap-1">
            {navLinks.map(link => (
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
                {t(link.key)}
              </Link>
            ))}
            <Link
              href="/list-your-business"
              onClick={() => setMobileOpen(false)}
              className="mt-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold text-center no-underline"
            >
              {t("nav.listYourBusiness")}
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
                {t("nav.signIn")}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
