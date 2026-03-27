import { trpc } from "@/lib/trpc";
import { useCallback, useRef } from "react";

/**
 * Hook for tracking tag engagement across all surfaces.
 * 
 * Provides:
 * - trackClick(tagId, contentType?, contentId?) — fire-and-forget click tracking
 * - trackView(tagId) — fire-and-forget view tracking (deduplicated per tagId per mount)
 * - trackBySlug(slug, engagementType, contentType?, contentId?) — resolve tag by slug and track
 * 
 * Uses a mutation queue to avoid blocking UI. Deduplicates view events per component mount.
 */
export function useTagTracking() {
  const trackMutation = trpc.trending.track.useMutation();
  const viewedRef = useRef<Set<number>>(new Set());

  const trackClick = useCallback(
    (tagId: number, contentType?: string, contentId?: string) => {
      trackMutation.mutate({
        tagId,
        engagementType: "click",
        contentType,
        contentId,
      });
    },
    [trackMutation]
  );

  const trackView = useCallback(
    (tagId: number, contentType?: string, contentId?: string) => {
      if (viewedRef.current.has(tagId)) return;
      viewedRef.current.add(tagId);
      trackMutation.mutate({
        tagId,
        engagementType: "view",
        contentType,
        contentId,
      });
    },
    [trackMutation]
  );

  return { trackClick, trackView };
}

/**
 * Map of known category/tag name patterns to tag IDs.
 * This maps event categories, directory categories, and neighborhood names
 * to their corresponding tag IDs in the database for engagement tracking.
 * 
 * Use getAllTags query to build this dynamically, or use this static fallback.
 */
export const TAG_SLUG_MAP: Record<string, string> = {
  // Event categories → tag slugs
  "concerts": "live-music",
  "food-drink": "food-drink",
  "sports": "sports",
  "arts-culture": "arts-culture",
  "festivals": "festivals",
  "family": "family-friendly",
  "nightlife": "nightlife",
  "free": "free-events",
  "markets": "markets",
  // Neighborhood names → tag slugs
  "South End": "south-end",
  "NoDa": "noda",
  "Plaza Midwood": "plaza-midwood",
  "Dilworth": "dilworth",
  "Myers Park": "myers-park",
  "Uptown": "uptown",
  "Elizabeth": "elizabeth",
  "Ballantyne": "ballantyne",
};

/**
 * Hook that provides tag tracking with slug-to-ID resolution.
 * Fetches all tags once and builds a lookup map.
 */
export function useTagTrackingWithLookup() {
  const { data: allTags } = trpc.tags.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  const { trackClick, trackView } = useTagTracking();

  const tagMap = allTags?.reduce(
    (acc, tag) => {
      acc.bySlug[tag.slug] = tag.id;
      acc.byName[tag.name.toLowerCase()] = tag.id;
      return acc;
    },
    { bySlug: {} as Record<string, number>, byName: {} as Record<string, number> }
  );

  const resolveTagId = useCallback(
    (identifier: string): number | null => {
      if (!tagMap) return null;
      // Try direct slug match
      if (tagMap.bySlug[identifier]) return tagMap.bySlug[identifier];
      // Try mapped slug
      const mappedSlug = TAG_SLUG_MAP[identifier];
      if (mappedSlug && tagMap.bySlug[mappedSlug]) return tagMap.bySlug[mappedSlug];
      // Try name match (case-insensitive)
      if (tagMap.byName[identifier.toLowerCase()]) return tagMap.byName[identifier.toLowerCase()];
      return null;
    },
    [tagMap]
  );

  const trackClickByName = useCallback(
    (identifier: string, contentType?: string, contentId?: string) => {
      const tagId = resolveTagId(identifier);
      if (tagId) trackClick(tagId, contentType, contentId);
    },
    [resolveTagId, trackClick]
  );

  const trackViewByName = useCallback(
    (identifier: string, contentType?: string, contentId?: string) => {
      const tagId = resolveTagId(identifier);
      if (tagId) trackView(tagId, contentType, contentId);
    },
    [resolveTagId, trackView]
  );

  return { trackClick, trackView, trackClickByName, trackViewByName, resolveTagId };
}
