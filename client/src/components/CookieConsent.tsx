import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { disableAnalytics, enableAnalytics } from "@/lib/mixpanel";
import { ANALYTICS_CONSENT_KEY } from "@/lib/analytics-config";
import { useI18n } from "@/i18n/I18nContext";

const UMAMI_SCRIPT_ID = "settle-clt-umami";

function loadUmami() {
  if (typeof document === "undefined") return;
  if (document.getElementById(UMAMI_SCRIPT_ID)) return;
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as
    | string
    | undefined;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as
    | string
    | undefined;
  if (!endpoint || !websiteId) return;
  const script = document.createElement("script");
  script.id = UMAMI_SCRIPT_ID;
  script.defer = true;
  script.src = `${endpoint}/umami`;
  script.dataset.websiteId = websiteId;
  document.head.appendChild(script);
}

function enableConsentedAnalytics() {
  enableAnalytics();
  loadUmami();
}

export default function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (consent === "accepted") enableConsentedAnalytics();
    if (consent === "declined") disableAnalytics();
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, "accepted");
    enableConsentedAnalytics();
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, "declined");
    setVisible(false);
    disableAnalytics();
  };

  // Neutral dismiss — does NOT record a choice; banner will reappear next session
  // so users can revisit consent without being silently opted out of analytics.
  const dismiss = () => setVisible(false);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t("cookies.ariaLabel")}
      className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-4 duration-500 sm:bottom-6 sm:right-6"
    >
      <div className="bg-card border border-border rounded-xl shadow-lg p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <Cookie className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium mb-1">
              {t("cookies.title")}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("cookies.description")} {" "}
              <a
                href="/privacy"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                {t("cookies.privacyPolicy")}
              </a>{" "}
              {t("cookies.details")}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={accept} className="text-xs h-8 px-4">
                {t("cookies.accept")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={decline}
                className="text-xs h-8 px-4"
              >
                {t("cookies.decline")}
              </Button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 min-h-11 min-w-11 inline-flex items-center justify-center"
            aria-label={t("cookies.dismiss")}
            title={t("cookies.dismissTitle")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
