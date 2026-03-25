import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { LogIn } from "lucide-react";
import { ReactNode } from "react";

interface AuthGateProps {
  /** Content to render when authenticated */
  children: ReactNode;
  /** What the user is trying to do (shown in the prompt) */
  featureLabel?: string;
  /** Optional: render inline instead of full-page */
  inline?: boolean;
}

/**
 * Wraps protected features. If the user is not logged in,
 * shows a friendly sign-in prompt instead of the children.
 * All public browsing remains unaffected.
 */
export default function AuthGate({
  children,
  featureLabel = "this feature",
  inline = false,
}: AuthGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    if (inline) {
      return (
        <div className="py-4 text-center text-muted-foreground text-sm animate-pulse">
          Loading...
        </div>
      );
    }
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Sign in to {featureLabel}
        </p>
        <a
          href={getLoginUrl()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity no-underline"
        >
          <LogIn className="w-3.5 h-3.5" />
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-display font-bold text-foreground mb-2">
          Sign in required
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Create a free account to {featureLabel}. Browsing neighborhoods, the
          directory, and all guides is always free — no account needed.
        </p>
        <a
          href={getLoginUrl()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity no-underline"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </a>
      </div>
    </div>
  );
}
