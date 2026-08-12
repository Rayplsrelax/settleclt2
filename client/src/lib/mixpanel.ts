/**
 * Mixpanel Analytics Integration for Settle CLT
 *
 * Wraps the mixpanel-browser SDK with typed helpers for consistent event tracking.
 * Gracefully no-ops if the token is not configured (dev environments).
 *
 * The SDK is loaded LAZILY on first use to keep the initial JS payload small
 * (~420 KB shaved from main bundle). Events fired before the SDK finishes
 * loading are queued and flushed once it's ready.
 */

import { ANALYTICS_CONSENT_KEY } from "@/lib/analytics-config";
import type {
  SocialFollowSurface,
  SocialPlatform,
} from "@/lib/socialLinks";

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN as
  | string
  | undefined;

type MixpanelModule = typeof import("mixpanel-browser").default;

let mp: MixpanelModule | null = null;
let loadPromise: Promise<MixpanelModule | null> | null = null;
let initialized = false;
const queue: Array<(m: MixpanelModule) => void> = [];

function loadSdk(): Promise<MixpanelModule | null> {
  if (loadPromise) return loadPromise;
  if (!MIXPANEL_TOKEN) {
    loadPromise = Promise.resolve(null);
    return loadPromise;
  }
  loadPromise = import("mixpanel-browser")
    .then(mod => {
      mp = mod.default;
      mp.init(MIXPANEL_TOKEN, {
        track_pageview: false, // we track manually for SPA
        persistence: "localStorage",
        ignore_dnt: false,
      });
      initialized = true;
      // Flush any queued operations
      while (queue.length) {
        const op = queue.shift();
        try {
          op?.(mp!);
        } catch {
          /* swallow analytics errors */
        }
      }
      return mp;
    })
    .catch(() => {
      // If SDK fails to load (network, blocker), fall back to no-op
      return null;
    });
  return loadPromise;
}

/** Schedule an op against the SDK. Queues until ready. */
function withSdk(op: (m: MixpanelModule) => void, loadImmediately = true) {
  if (!MIXPANEL_TOKEN) return;
  if (
    typeof window !== "undefined" &&
    localStorage.getItem(ANALYTICS_CONSENT_KEY) !== "accepted"
  )
    return;
  if (initialized && mp) {
    try {
      op(mp);
    } catch {
      /* swallow analytics errors */
    }
    return;
  }
  queue.push(op);
  if (loadImmediately) {
    // Engagement before page load should still initialize analytics.
    void loadSdk();
  }
}

/**
 * Initialize Mixpanel. Call once at app boot (main.tsx).
 *
 * Schedules the SDK load via `requestIdleCallback` (or a short timeout
 * fallback) so it never competes with first paint / LCP.
 */
export function initMixpanel() {
  if (!MIXPANEL_TOKEN || loadPromise) return;
  if (
    typeof window === "undefined" ||
    localStorage.getItem(ANALYTICS_CONSENT_KEY) !== "accepted"
  )
    return;

  const scheduleLoad = () => {
    const w = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback) => number;
    };
    if (w.requestIdleCallback) {
      w.requestIdleCallback(() => void loadSdk(), { timeout: 2000 });
    } else {
      setTimeout(() => void loadSdk(), 0);
    }
  };

  if (document.readyState === "complete") {
    scheduleLoad();
  } else {
    window.addEventListener("load", scheduleLoad, { once: true });
  }
}

/** Begin analytics only after the user has explicitly accepted. */
export function enableAnalytics() {
  initMixpanel();
  trackPageView(window.location.pathname, {
    full_url: window.location.href,
    referrer: document.referrer || undefined,
  });
}

/** Stop future tracking and opt out an already-loaded Mixpanel instance. */
export function disableAnalytics() {
  queue.length = 0;
  if (mp) {
    try {
      mp.opt_out_tracking();
    } catch {
      /* swallow analytics errors */
    }
  }
  if (typeof window !== "undefined") {
    (window as unknown as { [key: string]: unknown })["umami.disabled"] = true;
  }
}

/** Identify a logged-in user so events are attributed correctly. */
export function identifyUser(user: {
  id: number;
  name?: string | null;
  email?: string | null;
  role?: string;
}) {
  withSdk(m => {
    m.identify(String(user.id));
    m.people.set({
      $name: user.name ?? "Unknown",
      $email: user.email ?? undefined,
      role: user.role,
      last_login: new Date().toISOString(),
    });
  });
}

/** Reset identity on logout. */
export function resetUser() {
  withSdk(m => m.reset());
}

/** Track a named event with optional properties. */
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  withSdk(m => m.track(event, properties));
}

// ─── Typed Event Helpers ────────────────────────────────────────

export function trackPageView(
  page: string,
  properties?: Record<string, unknown>
) {
  // Queue page views without forcing the SDK onto the LCP critical path.
  withSdk(m => m.track("Page View", { page, ...properties }), false);
}

export function trackSearch(
  query: string,
  resultCount: number,
  source = "global-search"
) {
  trackEvent("Search", { query, result_count: resultCount, source });
}

export function trackTagClick(
  tagName: string,
  tagSlug: string,
  surface: string
) {
  trackEvent("Tag Click", { tag_name: tagName, tag_slug: tagSlug, surface });
}

export function trackReviewSubmit(
  targetType: string,
  targetId: string,
  rating: number
) {
  trackEvent("Review Submit", {
    target_type: targetType,
    target_id: targetId,
    rating,
  });
}

export function trackStamp(serviceKey: string, neighborhood?: string) {
  trackEvent("Stamp Collected", { service_key: serviceKey, neighborhood });
}

export function trackWishlistAdd(serviceKey: string) {
  trackEvent("Wishlist Add", { service_key: serviceKey });
}

export function trackEventView(eventSlug: string, eventTitle: string) {
  trackEvent("Event View", { event_slug: eventSlug, event_title: eventTitle });
}

export function trackDirectoryView(serviceKey: string, category: string) {
  trackEvent("Directory View", { service_key: serviceKey, category });
}

export function trackBusinessAction(
  action: "phone_click" | "website_click" | "directions_click" | "claim_click" | "booking_click",
  properties: {
    service_key: string;
    business_name?: string;
    category?: string;
    area?: string;
    surface?: string;
    premium_tier?: string | null;
  }
) {
  trackEvent("Business Action", { action, ...properties });
}

export function trackClaimSubmit(properties: {
  service_key: string;
  business_name: string;
  claimant_role?: string;
}) {
  trackEvent("Business Claim Submitted", properties);
}

export function trackFindHomeLead(properties: {
  referral_type: string;
  budget?: string;
  neighborhoods?: string;
  timeline?: string;
  referral_source?: string;
  current_city?: string;
}) {
  trackEvent("Find Home Lead Submitted", properties);
}

export function trackFindHomeIntent(properties: {
  surface: string;
  source?: string;
  neighborhoods?: string;
  referral_type?: string;
}) {
  trackEvent("Find Home Intent", properties);
}

export function trackEventAction(
  action:
    | "event_view"
    | "directions_click"
    | "external_click"
    | "submit_event_click"
    | "filter_click"
    | "search",
  properties: {
    event_slug?: string;
    event_title?: string;
    category?: string;
    neighborhood?: string;
    venue_name?: string | null;
    search_query?: string;
    surface?: string;
  }
) {
  trackEvent("Event Action", { action, ...properties });
}

export function trackQuizComplete(properties: {
  top_neighborhood?: string;
  top_matches?: string[];
  answer_count: number;
}) {
  trackEvent("Quiz Complete", properties);
}

export function trackNeighborhoodView(neighborhoodId: string) {
  trackEvent("Neighborhood View", { neighborhood_id: neighborhoodId });
}

export function trackBlogView(slug: string, category?: string) {
  trackEvent("Blog View", { slug, category });
}

export function trackSignup() {
  trackEvent("Signup");
}

export function trackNewsletterOptIn(optedIn: boolean) {
  trackEvent("Newsletter Toggle", { opted_in: optedIn });
}

export function trackSocialFollowClick(
  platform: SocialPlatform,
  surface: SocialFollowSurface
) {
  trackEvent("Social Follow Click", { platform, surface });
}

export function trackNewcomerJourneyAction(
  action: "start" | "step_click" | "progress_toggle",
  properties: Record<string, unknown> = {}
) {
  trackEvent("Newcomer Journey", { action, ...properties });
}
