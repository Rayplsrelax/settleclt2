import { useEffect } from "react";
import { useLocation } from "wouter";
import { trackPageView } from "@/lib/mixpanel";

/**
 * Tracks page views in Mixpanel whenever the route changes.
 * Call once in the top-level Router component.
 */
export function useMixpanelPageView() {
  const [location] = useLocation();

  useEffect(() => {
    trackPageView(location);
  }, [location]);
}
