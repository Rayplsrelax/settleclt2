export type ReferralType = "buying" | "selling" | "renting" | "relocating" | "investing";
export type LeadPriority = "hot" | "qualified" | "nurture" | "early" | "low";

export interface RealtorLeadScoringInput {
  referralType?: ReferralType | string | null;
  budget?: string | null;
  timeline?: string | null;
  neighborhoods?: string | null;
  phone?: string | null;
  currentCity?: string | null;
  notes?: string | null;
}

export interface RealtorLeadScoreBreakdown {
  timelineUrgency: number;
  buyingLikelihood: number;
  charlotteFitClarity: number;
  contactQuality: number;
  serviceNeed: number;
}

export interface RealtorLeadOpsResult {
  leadScore: number;
  leadPriority: LeadPriority;
  nextAction: string;
  nextActionDueDays: number;
  callRecommended: boolean;
  scoreBreakdown: RealtorLeadScoreBreakdown;
}

const HOT_TIMELINES = new Set(["asap", "0-30days", "1-3months", "under-3-months"]);
const QUALIFIED_TIMELINES = new Set(["3-6months", "6-12months"]);
const EARLY_TIMELINES = new Set(["just-looking", "12months-plus", "not-sure"]);

function normalize(value?: string | null): string {
  return (value || "").trim().toLowerCase();
}

function scoreTimeline(timeline?: string | null): number {
  const value = normalize(timeline);
  if (!value) return 1;
  if (HOT_TIMELINES.has(value) || value.includes("asap") || value.includes("1-3")) return 5;
  if (QUALIFIED_TIMELINES.has(value) || value.includes("3-6")) return 4;
  if (value.includes("6-12")) return 3;
  if (EARLY_TIMELINES.has(value) || value.includes("looking")) return 2;
  return 2;
}

function scoreBuyingLikelihood(input: RealtorLeadScoringInput): number {
  const type = normalize(input.referralType);
  const budget = normalize(input.budget);
  const notes = normalize(input.notes);
  if (type === "buying" || type === "selling" || type === "investing") return budget ? 5 : 4;
  if (type === "relocating") return budget || notes.includes("buy") || notes.includes("home") ? 4 : 3;
  if (type === "renting") return budget ? 3 : 2;
  return budget ? 3 : 1;
}

function scoreCharlotteFit(input: RealtorLeadScoringInput): number {
  const neighborhoods = normalize(input.neighborhoods);
  const currentCity = normalize(input.currentCity);
  const notes = normalize(input.notes);
  let score = 1;
  if (neighborhoods) score += 2;
  if (currentCity) score += 1;
  if (notes.includes("charlotte") || notes.includes("clt") || notes.includes("relocat")) score += 1;
  return Math.min(score, 5);
}

function scoreContact(input: RealtorLeadScoringInput): number {
  const phone = normalize(input.phone);
  const notes = normalize(input.notes);
  let score = 3; // email is required by form, so every lead has baseline contact.
  if (phone) score += 1;
  if (notes.length >= 25) score += 1;
  return Math.min(score, 5);
}

function scoreServiceNeed(input: RealtorLeadScoringInput): number {
  const type = normalize(input.referralType);
  const timelineScore = scoreTimeline(input.timeline);
  if (["buying", "selling", "relocating", "investing"].includes(type) && timelineScore >= 4) return 5;
  if (["buying", "selling", "relocating", "investing"].includes(type)) return 4;
  if (type === "renting" && timelineScore >= 4) return 3;
  if (type === "renting") return 2;
  return 1;
}

export function classifyLeadPriority(leadScore: number): LeadPriority {
  if (leadScore >= 21) return "hot";
  if (leadScore >= 16) return "qualified";
  if (leadScore >= 11) return "nurture";
  if (leadScore >= 6) return "early";
  return "low";
}

export function getLeadNextAction(priority: LeadPriority, callRecommended: boolean): { nextAction: string; nextActionDueDays: number } {
  if (priority === "hot") return { nextAction: "Reply same day and offer a discovery call", nextActionDueDays: 0 };
  if (priority === "qualified") return { nextAction: callRecommended ? "Reply within 24 hours and offer a discovery call" : "Reply within 24 hours and ask final qualifying questions", nextActionDueDays: 1 };
  if (priority === "nurture") return { nextAction: "Send helpful relocation guidance and set a follow-up reminder", nextActionDueDays: 3 };
  if (priority === "early") return { nextAction: "Send one useful next step and check back later", nextActionDueDays: 7 };
  return { nextAction: "Clarify fit once or close as low-fit", nextActionDueDays: 14 };
}

export function scoreRealtorLead(input: RealtorLeadScoringInput): RealtorLeadOpsResult {
  const scoreBreakdown: RealtorLeadScoreBreakdown = {
    timelineUrgency: scoreTimeline(input.timeline),
    buyingLikelihood: scoreBuyingLikelihood(input),
    charlotteFitClarity: scoreCharlotteFit(input),
    contactQuality: scoreContact(input),
    serviceNeed: scoreServiceNeed(input),
  };
  const leadScore = Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0);
  const rawPriority = classifyLeadPriority(leadScore);
  const type = normalize(input.referralType);
  const rentOnlyLead = type === "renting";
  const leadPriority = rentOnlyLead && (rawPriority === "hot" || rawPriority === "qualified") ? "nurture" : rawPriority;
  const callRecommended = !rentOnlyLead && (leadScore >= 16 || (leadScore >= 13 && scoreBreakdown.timelineUrgency >= 4 && scoreBreakdown.buyingLikelihood >= 4));
  const action = getLeadNextAction(leadPriority, callRecommended);
  return {
    leadScore,
    leadPriority,
    callRecommended,
    scoreBreakdown,
    ...action,
  };
}
