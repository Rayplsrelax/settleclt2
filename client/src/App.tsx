import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./pages/Home"));
const Neighborhoods = lazy(() => import("./pages/Neighborhoods"));
const NeighborhoodDetail = lazy(() => import("./pages/NeighborhoodDetail"));
const Directory = lazy(() => import("./pages/Directory"));
const Blog = lazy(() => import("./pages/Blog"));
const ListYourBusiness = lazy(() => import("./pages/ListYourBusiness"));
const Compare = lazy(() => import("./pages/Compare"));
const Quiz = lazy(() => import("./pages/Quiz"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground text-lg font-display">Loading...</div>
    </div>
  );
}

function Router() {
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
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
