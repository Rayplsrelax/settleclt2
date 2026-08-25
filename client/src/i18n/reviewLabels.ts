import type { TranslationKey } from "./locales/en";

export const ASPECTS = [
  { value: "general", labelKey: "reviews.aspect.general" },
  { value: "vibe", labelKey: "reviews.aspect.vibe" },
  { value: "food", labelKey: "reviews.aspect.food" },
  { value: "safety", labelKey: "reviews.aspect.safety" },
  { value: "transit", labelKey: "reviews.aspect.transit" },
  { value: "nightlife", labelKey: "reviews.aspect.nightlife" },
  { value: "cost", labelKey: "reviews.aspect.cost" },
] as const;

export type ReviewAspect = (typeof ASPECTS)[number]["value"];

export function getAspectLabel(
  aspect: string,
  t: (key: TranslationKey) => string
): string {
  const match = ASPECTS.find(candidate => candidate.value === aspect);
  return match ? t(match.labelKey) : aspect;
}
