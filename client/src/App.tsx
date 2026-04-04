import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense } from "react";
import { useMixpanelPageView } from "@/hooks/useMixpanelPageView";

const Home = lazy(() => import("./pages/Home"));
const Neighborhoods = lazy(() => import("./pages/Neighborhoods"));
const NeighborhoodDetail = lazy(() => import("./pages/NeighborhoodDetail"));
const Directory = lazy(() => import("./pages/Directory"));
const Blog = lazy(() => import("./pages/Blog"));
const ListYourBusiness = lazy(() => import("./pages/ListYourBusiness"));
const Compare = lazy(() => import("./pages/Compare"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Profile = lazy(() => import("./pages/Profile"));
const Passport = lazy(() => import("./pages/Passport"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const AdminEnrich = lazy(() => import("./pages/AdminEnrich"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const BingoCards = lazy(() => import("./pages/BingoCards"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Events = lazy(() => import("./pages/Events"));
const AdminEvents = lazy(() => import("./pages/AdminEvents"));
const TagPage = lazy(() => import("./pages/TagPage"));
const SubmitEvent = lazy(() => import("./pages/SubmitEvent"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminDigest = lazy(() => import("./pages/AdminDigest"));
const FindYourHome = lazy(() => import("./pages/FindRealtor"));
const AdminReferrals = lazy(() => import("./pages/AdminReferrals"));
const AdminClaims = lazy(() => import("./pages/AdminClaims"));
const MyBusiness = lazy(() => import("./pages/MyBusiness"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const BusinessDetail = lazy(() => import("./pages/BusinessDetail"));
const Contact = lazy(() => import("./pages/Contact"));
import CookieConsent from "./components/CookieConsent";

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground text-lg font-display">Loading...</div>
    </div>
  );
}

function Router() {
  useMixpanelPageView();
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/neighborhoods" component={Neighborhoods} />
        <Route path="/neighborhood/:id" component={NeighborhoodDetail} />
        <Route path="/directory" component={Directory} />
        <Route path="/blog" component={Blog} />
        <Route path="/list-your-business" component={ListYourBusiness} />
        <Route path="/compare" component={Compare} />
        <Route path="/quiz" component={Quiz} />
        <Route path="/profile" component={Profile} />
        <Route path="/passport" component={Passport} />
        <Route path="/wishlist" component={Wishlist} />
        <Route path="/bingo" component={BingoCards} />
        <Route path="/events" component={Events} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/admin/enrich" component={AdminEnrich} />
        <Route path="/admin/blog" component={AdminBlog} />
        <Route path="/admin/events" component={AdminEvents} />
        <Route path="/submit-event" component={SubmitEvent} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/digest" component={AdminDigest} />
        <Route path="/admin/referrals" component={AdminReferrals} />
        <Route path="/admin/claims" component={AdminClaims} />
        <Route path="/my-business" component={MyBusiness} />
        <Route path="/find-your-home" component={FindYourHome} />
        <Route path="/find-a-realtor">{() => <Redirect to="/find-your-home" />}</Route>
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/tag/:slug" component={TagPage} />
        <Route path="/directory/:slug" component={BusinessDetail} />
        <Route path="/blog/:slug" component={BlogArticle} />
        <Route path="/contact" component={Contact} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieConsent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
