/**
 * Premium tier feature limits for Settle CLT directory listings.
 *
 * These constants and functions define what each paid tier entitles a
 * claimed business to, so both server and client can enforce the same
 * limits consistently.
 */

export const PHOTO_LIMITS = {
  basic: 0,
  featured: 5,
  premium: 15,
} as const;

export type PremiumTier = "basic" | "featured" | "premium";

/**
 * Returns the max number of owner-uploaded photos allowed for a tier.
 * Returns 0 if the subscription is not active (payment lapsed).
 */
export function getPhotoLimit(tier: PremiumTier, active: boolean): number {
  if (!active) return 0;
  return PHOTO_LIMITS[tier] ?? 0;
}

/**
 * Returns true if the business can upload more photos given its current
 * tier, active status, and existing photo count.
 */
export function canUploadPhoto(
  tier: PremiumTier,
  active: boolean,
  currentPhotoCount: number,
): boolean {
  return currentPhotoCount < getPhotoLimit(tier, active);
}
