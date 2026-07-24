import { useEffect } from "react";
import { useLocation } from "wouter";
import { trackPageView } from "@/lib/mixpanel";

/**
 * Tracks page views in Mixpanel whenever the route changes.
 * Includes full URL, referrer, and UTM parameters for attribution.
 * Call once in the top-level Router component.
 */
export function useMixpanelPageView() {
  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    trackPageView(location, {
      full_url: window.location.href,
      referrer: document.referrer || undefined,
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      utm_content: params.get("utm_content") || undefined,
      utm_term: params.get("utm_term") || undefined,
    });
  }, [location]);
}
