import { z } from "zod";

export const EVENT_PROMOTION_LEVELS = [
  "boost",
  "spotlight",
  "headliner",
] as const;
export type EventPromotionLevel = (typeof EVENT_PROMOTION_LEVELS)[number];

export const EVENT_PROMOTION_LEVEL_SCHEMA = z.enum(EVENT_PROMOTION_LEVELS);

/**
 * Plan A package definitions. Prices are one-time, in cents.
 * Mirrors docs/operations/PLAN_A_EVENT_PROMOTIONS.md (approved 2026-08-17).
 */
export const EVENT_PROMOTION_PACKAGES: Record<
  EventPromotionLevel,
  {
    name: string;
    priceCents: number;
    durationDays: number;
    socialPosts: number;
    customHeadline: boolean;
    sponsorMessage: boolean;
    organizerLogo: boolean;
  }
> = {
  boost: {
    name: "Boost",
    priceCents: 1900,
    durationDays: 7,
    socialPosts: 1,
    customHeadline: false,
    sponsorMessage: false,
    organizerLogo: false,
  },
  spotlight: {
    name: "Spotlight",
    priceCents: 4900,
    durationDays: 14,
    socialPosts: 3,
    customHeadline: false,
    sponsorMessage: true,
    organizerLogo: true,
  },
  headliner: {
    name: "Headliner",
    priceCents: 14900,
    durationDays: 30,
    socialPosts: 5,
    customHeadline: true,
    sponsorMessage: true,
    organizerLogo: true,
  },
};

export function isEventPromotionLevel(
  value: unknown
): value is EventPromotionLevel {
  return (
    typeof value === "string" &&
    (EVENT_PROMOTION_LEVELS as readonly string[]).includes(value)
  );
}
