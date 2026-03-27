/**
 * Mixpanel Analytics Integration for Settle CLT
 * 
 * Wraps the mixpanel-browser SDK with typed helpers for consistent event tracking.
 * Gracefully no-ops if the token is not configured (dev environments).
 */
import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined;

let initialized = false;

/** Initialize Mixpanel. Call once at app boot (main.tsx). */
export function initMixpanel() {
  if (!MIXPANEL_TOKEN || initialized) return;
  mixpanel.init(MIXPANEL_TOKEN, {
    track_pageview: false, // we track manually for SPA
    persistence: "localStorage",
    ignore_dnt: false,
  });
  initialized = true;
}

/** Identify a logged-in user so events are attributed correctly. */
export function identifyUser(user: { id: number; name?: string | null; email?: string | null; role?: string }) {
  if (!initialized) return;
  mixpanel.identify(String(user.id));
  mixpanel.people.set({
    $name: user.name ?? "Unknown",
    $email: user.email ?? undefined,
    role: user.role,
    last_login: new Date().toISOString(),
  });
}

/** Reset identity on logout. */
export function resetUser() {
  if (!initialized) return;
  mixpanel.reset();
}

/** Track a named event with optional properties. */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  mixpanel.track(event, properties);
}

// ─── Typed Event Helpers ────────────────────────────────────────

export function trackPageView(page: string, properties?: Record<string, unknown>) {
  trackEvent("Page View", { page, ...properties });
}

export function trackSearch(query: string, resultCount: number, source = "global-search") {
  trackEvent("Search", { query, result_count: resultCount, source });
}

export function trackTagClick(tagName: string, tagSlug: string, surface: string) {
  trackEvent("Tag Click", { tag_name: tagName, tag_slug: tagSlug, surface });
}

export function trackReviewSubmit(targetType: string, targetId: string, rating: number) {
  trackEvent("Review Submit", { target_type: targetType, target_id: targetId, rating });
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
