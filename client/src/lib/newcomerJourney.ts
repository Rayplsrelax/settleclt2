export const NEWCOMER_PROGRESS_KEY = "settle-clt-newcomer-progress-v1";

export type NewcomerStepId =
  | "quiz"
  | "compare"
  | "services"
  | "events"
  | "passport";

export interface NewcomerStep {
  id: NewcomerStepId;
  stage: string;
  title: string;
  description: string;
  href: string;
  action: string;
}

export const NEWCOMER_STEPS: NewcomerStep[] = [
  {
    id: "quiz",
    stage: "Before your move",
    title: "Find your neighborhood fit",
    description:
      "Take the two-minute quiz to turn your priorities into a Charlotte shortlist.",
    href: "/quiz?source=newcomer-plan",
    action: "Take the quiz",
  },
  {
    id: "compare",
    stage: "Before your move",
    title: "Compare your shortlist",
    description:
      "Check rent, commute, walkability, schools, and local vibe side by side.",
    href: "/compare?source=newcomer-plan",
    action: "Compare neighborhoods",
  },
  {
    id: "services",
    stage: "Moving week",
    title: "Save move-in essentials",
    description:
      "Browse movers, storage, utilities, internet, insurance, and other settling-in services.",
    href: "/directory?group=moving-settling&source=newcomer-plan",
    action: "Browse essentials",
  },
  {
    id: "events",
    stage: "Your first week",
    title: "Pick something local to do",
    description:
      "Choose a newcomer-friendly event and start building a first-week plan.",
    href: "/events?source=newcomer-plan",
    action: "Find an event",
  },
  {
    id: "passport",
    stage: "After arrival",
    title: "Track your Charlotte discoveries",
    description:
      "Use Passport stamps to remember the businesses, events, and neighborhoods you try.",
    href: "/passport?source=newcomer-plan",
    action: "Open Passport",
  },
];

const VALID_STEP_IDS = new Set(NEWCOMER_STEPS.map(step => step.id));

export function parseNewcomerProgress(raw: string | null): NewcomerStepId[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (id): id is NewcomerStepId =>
        typeof id === "string" && VALID_STEP_IDS.has(id as NewcomerStepId)
    );
  } catch {
    return [];
  }
}

export function buildNewcomerSteps(shortlist?: string | null): NewcomerStep[] {
  const ids = (shortlist || "")
    .split(",")
    .map(id => id.trim())
    .filter(id => /^[a-z0-9-]+$/.test(id))
    .slice(0, 3);
  if (ids.length < 2) return NEWCOMER_STEPS;

  return NEWCOMER_STEPS.map(step =>
    step.id === "compare"
      ? {
          ...step,
          href: `/compare?ids=${encodeURIComponent(ids.join(","))}&source=newcomer-plan`,
        }
      : step
  );
}
