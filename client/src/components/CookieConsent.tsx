import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "settle-clt-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
    // Disable analytics tracking
    if (typeof window !== "undefined") {
      (window as any)["umami.disabled"] = true;
    }
  };

  // Neutral dismiss — does NOT record a choice; banner will reappear next session
  // so users can revisit consent without being silently opted out of analytics.
  const dismiss = () => setVisible(false);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl shadow-lg p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Cookie className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium mb-1">We use cookies</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We use cookies and analytics tools to understand how you use Settle CLT so we can improve your experience.
              Read our{" "}
              <a href="/privacy" className="text-primary underline underline-offset-2 hover:no-underline">Privacy Policy</a>
              {" "}for details.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={accept} className="text-xs h-8 px-4">
                Accept All
              </Button>
              <Button size="sm" variant="outline" onClick={decline} className="text-xs h-8 px-4">
                Decline
              </Button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Dismiss cookie banner (decide later)"
            title="Dismiss — we'll ask again next visit"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
