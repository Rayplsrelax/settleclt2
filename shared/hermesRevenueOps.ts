export type HermesRevenueTaskType =
  | "realtor_lead_followup"
  | "business_claim_review"
  | "listing_payment_recovery"
  | "listing_cancellation_winback"
  | "monthly_value_report"
  | "microsite_launch_check"
  | "weekly_growth_summary";

export type HermesRevenuePriority = "urgent" | "high" | "normal" | "low";

export interface HermesReferralLead {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  referralType?: string | null;
  status: string;
  leadScore?: number | null;
  leadPriority?: string | null;
  nextAction?: string | null;
  nextActionDueAt?: Date | string | null;
  createdAt?: Date | string | null;
  neighborhoods?: string | null;
  timeline?: string | null;
}

export interface HermesBusinessClaim {
  id: number;
  serviceKey: string;
  businessName: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone?: string | null;
  status: string;
  createdAt?: Date | string | null;
}

export interface HermesPremiumListing {
  id: number;
  serviceKey: string;
  tier: "basic" | "featured" | "premium" | string;
  paymentStatus: "active" | "past_due" | "canceled" | "trialing" | string;
  billingEmail?: string | null;
  updatedAt?: Date | string | null;
  viewsThisPeriod?: number | null;
  clicksThisPeriod?: number | null;
  leadsThisPeriod?: number | null;
}

export interface HermesMicrositeStatus {
  domain: string;
  campaign: string;
  status: "planned" | "generated" | "ready_for_dns" | "live" | "needs_sitemap_submission" | string;
  primaryFunnel: string;
}

export interface HermesRevenueOpsInput {
  now?: Date | string;
  referrals: HermesReferralLead[];
  claims: HermesBusinessClaim[];
  premiumListings: HermesPremiumListing[];
  microsites?: HermesMicrositeStatus[];
}

export interface HermesRevenueTask {
  id: string;
  type: HermesRevenueTaskType;
  priority: HermesRevenuePriority;
  title: string;
  entityLabel: string;
  entityId?: number | string;
  channel: "email" | "phone" | "admin" | "dashboard";
  dueAt: string;
  status: "draft_only";
  sendAutomatically: false;
  reason: string;
  nextAction: string;
  context: Record<string, unknown>;
}

export interface HermesRevenueDraft {
  taskId: string;
  channel: HermesRevenueTask["channel"];
  subject: string;
  body: string;
  requiresHumanApproval: true;
}

export interface HermesRevenueOpsSummary {
  generatedAt: string;
  estimatedListingMrr: number;
  openRealtorLeads: number;
  hotRealtorLeads: number;
  pendingClaims: number;
  pastDueListings: number;
  canceledListings: number;
  readyMicrosites: number;
  dueTasks: number;
  nextActions: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function asDate(value: Date | string | null | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function iso(value: Date | string | null | undefined, fallback: Date): string {
  return asDate(value, fallback).toISOString();
}

function ageDays(value: Date | string | null | undefined, now: Date): number {
  const date = asDate(value, now);
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));
}

function listingMrr(listing: HermesPremiumListing): number {
  if (!["active", "past_due"].includes(listing.paymentStatus)) return 0;
  if (listing.tier === "premium") return 79;
  if (listing.tier === "featured") return 29;
  return 0;
}

function priorityForLead(lead: HermesReferralLead): HermesRevenuePriority {
  if (lead.leadPriority === "hot" || (lead.leadScore ?? 0) >= 21) return "urgent";
  if (lead.leadPriority === "qualified" || (lead.leadScore ?? 0) >= 16) return "high";
  if (lead.leadPriority === "nurture") return "normal";
  return "low";
}

function taskRank(priority: HermesRevenuePriority): number {
  return { urgent: 4, high: 3, normal: 2, low: 1 }[priority];
}

function typeRank(type: HermesRevenueTaskType): number {
  return {
    realtor_lead_followup: 7,
    listing_payment_recovery: 6,
    business_claim_review: 5,
    listing_cancellation_winback: 4,
    microsite_launch_check: 3,
    monthly_value_report: 2,
    weekly_growth_summary: 1,
  }[type];
}

export function generateHermesRevenueTasks(input: HermesRevenueOpsInput, options: { includeWeeklySummary?: boolean } = {}): HermesRevenueTask[] {
  const now = asDate(input.now, new Date());
  const includeWeeklySummary = options.includeWeeklySummary ?? true;
  const tasks: HermesRevenueTask[] = [];

  for (const lead of input.referrals) {
    const dueAt = lead.nextActionDueAt ? asDate(lead.nextActionDueAt, now) : asDate(lead.createdAt, now);
    if (!["closed", "lost"].includes(lead.status) && dueAt.getTime() <= now.getTime()) {
      tasks.push({
        id: `realtor-${lead.id}`,
        type: "realtor_lead_followup",
        priority: priorityForLead(lead),
        title: `Follow up with realtor lead: ${lead.name}`,
        entityLabel: lead.name,
        entityId: lead.id,
        channel: lead.phone ? "phone" : "email",
        dueAt: dueAt.toISOString(),
        status: "draft_only",
        sendAutomatically: false,
        reason: `${lead.leadPriority || "unscored"} lead due for next action`,
        nextAction: lead.nextAction || "Reply with helpful Charlotte relocation guidance and ask the next qualifying question.",
        context: {
          email: lead.email,
          phone: lead.phone,
          referralType: lead.referralType,
          score: lead.leadScore,
          neighborhoods: lead.neighborhoods,
          timeline: lead.timeline,
        },
      });
    }
  }

  for (const claim of input.claims) {
    if (claim.status === "pending") {
      const claimAge = ageDays(claim.createdAt, now);
      tasks.push({
        id: `claim-${claim.id}`,
        type: "business_claim_review",
        priority: claimAge >= 2 ? "high" : "normal",
        title: `Review business claim: ${claim.businessName}`,
        entityLabel: claim.businessName,
        entityId: claim.id,
        channel: "email",
        dueAt: iso(claim.createdAt, now),
        status: "draft_only",
        sendAutomatically: false,
        reason: `Claim has been pending ${claimAge} day(s)` ,
        nextAction: "Verify claimant identity, confirm public listing details, then approve/reject. Only mention paid upgrades after confirmation.",
        context: {
          serviceKey: claim.serviceKey,
          claimantName: claim.claimantName,
          claimantEmail: claim.claimantEmail,
          claimantPhone: claim.claimantPhone,
        },
      });
    }
  }

  for (const listing of input.premiumListings) {
    if (listing.paymentStatus === "past_due") {
      tasks.push({
        id: `payment-${listing.id}`,
        type: "listing_payment_recovery",
        priority: "urgent",
        title: `Recover failed listing payment: ${listing.serviceKey}`,
        entityLabel: listing.serviceKey,
        entityId: listing.id,
        channel: "email",
        dueAt: iso(listing.updatedAt, now),
        status: "draft_only",
        sendAutomatically: false,
        reason: "Premium/featured listing payment is past due",
        nextAction: "Send billing-help message, confirm the listing is paused only if Stripe remains past due, and offer manual help updating payment.",
        context: { tier: listing.tier, billingEmail: listing.billingEmail },
      });
    }
    if (listing.paymentStatus === "canceled") {
      tasks.push({
        id: `winback-${listing.id}`,
        type: "listing_cancellation_winback",
        priority: "high",
        title: `Win back canceled listing: ${listing.serviceKey}`,
        entityLabel: listing.serviceKey,
        entityId: listing.id,
        channel: "email",
        dueAt: iso(listing.updatedAt, now),
        status: "draft_only",
        sendAutomatically: false,
        reason: "Premium/featured listing subscription canceled",
        nextAction: "Ask what changed, offer listing-performance recap, and invite them to restart only if useful.",
        context: { tier: listing.tier, billingEmail: listing.billingEmail },
      });
    }
    if (listing.paymentStatus === "active" && listing.tier !== "basic") {
      tasks.push({
        id: `value-${listing.id}`,
        type: "monthly_value_report",
        priority: "low",
        title: `Prepare value report: ${listing.serviceKey}`,
        entityLabel: listing.serviceKey,
        entityId: listing.id,
        channel: "email",
        dueAt: now.toISOString(),
        status: "draft_only",
        sendAutomatically: false,
        reason: "Active paid listing needs a monthly value touchpoint",
        nextAction: "Summarize views, clicks, leads, and one recommended listing improvement.",
        context: {
          tier: listing.tier,
          billingEmail: listing.billingEmail,
          viewsThisPeriod: listing.viewsThisPeriod ?? 0,
          clicksThisPeriod: listing.clicksThisPeriod ?? 0,
          leadsThisPeriod: listing.leadsThisPeriod ?? 0,
        },
      });
    }
  }

  for (const microsite of input.microsites || []) {
    if (["generated", "ready_for_dns", "needs_sitemap_submission"].includes(microsite.status)) {
      tasks.push({
        id: `microsite-${microsite.domain}`,
        type: "microsite_launch_check",
        priority: microsite.status === "needs_sitemap_submission" ? "normal" : "high",
        title: `Finish microsite launch: ${microsite.domain}`,
        entityLabel: microsite.domain,
        entityId: microsite.domain,
        channel: "admin",
        dueAt: now.toISOString(),
        status: "draft_only",
        sendAutomatically: false,
        reason: `Microsite status is ${microsite.status}`,
        nextAction: "Verify DNS/HTTPS, click UTM CTAs, submit sitemap, and check analytics for utm_source.",
        context: { campaign: microsite.campaign, primaryFunnel: microsite.primaryFunnel },
      });
    }
  }

  if (includeWeeklySummary) {
    tasks.push({
      id: `weekly-summary-${now.toISOString().slice(0, 10)}`,
      type: "weekly_growth_summary",
      priority: "normal",
      title: "Prepare weekly Settle CLT revenue growth summary",
      entityLabel: "Settle CLT Revenue OS",
      channel: "dashboard",
      dueAt: now.toISOString(),
      status: "draft_only",
      sendAutomatically: false,
      reason: "Weekly operator summary for revenue lanes",
      nextAction: "Review due tasks, top revenue lane, blockers, and next 5 manual actions.",
      context: buildHermesRevenueOpsSummary(input) as unknown as Record<string, unknown>,
    });
  }

  return tasks.sort((a, b) => {
    const priorityDiff = taskRank(b.priority) - taskRank(a.priority);
    if (priorityDiff) return priorityDiff;
    const typeDiff = typeRank(b.type) - typeRank(a.type);
    if (typeDiff) return typeDiff;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

export function createHermesRevenueDraft(task: HermesRevenueTask): HermesRevenueDraft {
  if (task.type === "business_claim_review") {
    return {
      taskId: task.id,
      channel: "email",
      subject: `Confirming ${task.entityLabel} on Settle CLT`,
      body: `Hi ${String(task.context.claimantName || "there")},\n\nThanks for submitting a claim for ${task.entityLabel} on Settle CLT. We are reviewing the claim and want to confirm the best public information for the listing before making any changes.\n\nCan you confirm the correct website, phone number, service area, and the best public contact method for customers?\n\nOnce the information is confirmed, we can approve the claim and you can keep the public listing accurate.\n\nThanks,\nSettle CLT`,
      requiresHumanApproval: true,
    };
  }

  if (task.type === "realtor_lead_followup") {
    return {
      taskId: task.id,
      channel: task.channel,
      subject: `Following up on your Charlotte move`,
      body: `Hi ${task.entityLabel},\n\nThanks for reaching out through Settle CLT. Based on what you shared, the next best step is: ${task.nextAction}\n\nIf you are still planning your Charlotte move, reply with your timeline, preferred neighborhoods, and whether you want a quick call.\n\nBest,\nSettle CLT`,
      requiresHumanApproval: true,
    };
  }

  if (task.type === "listing_payment_recovery") {
    return {
      taskId: task.id,
      channel: "email",
      subject: `Billing help for your Settle CLT listing`,
      body: `Hi,\n\nWe noticed the payment for ${task.entityLabel} did not go through. If you want to keep the paid listing active, please update the payment method or reply and we can help.\n\nNo pressure — we can also keep the basic public listing active if the paid placement is not useful right now.\n\nThanks,\nSettle CLT`,
      requiresHumanApproval: true,
    };
  }

  return {
    taskId: task.id,
    channel: task.channel,
    subject: task.title,
    body: `${task.title}\n\nReason: ${task.reason}\n\nRecommended next action: ${task.nextAction}\n\nThis is a draft-only Hermes task. Review before sending or acting.`,
    requiresHumanApproval: true,
  };
}

export function buildHermesRevenueOpsSummary(input: HermesRevenueOpsInput): HermesRevenueOpsSummary {
  const now = asDate(input.now, new Date());
  const openRealtorLeads = input.referrals.filter(lead => !["closed", "lost"].includes(lead.status)).length;
  const hotRealtorLeads = input.referrals.filter(lead => !["closed", "lost"].includes(lead.status) && (lead.leadPriority === "hot" || (lead.leadScore ?? 0) >= 21)).length;
  const pendingClaims = input.claims.filter(claim => claim.status === "pending").length;
  const pastDueListings = input.premiumListings.filter(listing => listing.paymentStatus === "past_due").length;
  const canceledListings = input.premiumListings.filter(listing => listing.paymentStatus === "canceled").length;
  const readyMicrosites = (input.microsites || []).filter(site => ["generated", "ready_for_dns"].includes(site.status)).length;
  const estimatedListingMrr = input.premiumListings.reduce((sum, listing) => sum + listingMrr(listing), 0);
  const tasks = generateHermesRevenueTasks({ ...input, now }, { includeWeeklySummary: false });
  return {
    generatedAt: now.toISOString(),
    estimatedListingMrr,
    openRealtorLeads,
    hotRealtorLeads,
    pendingClaims,
    pastDueListings,
    canceledListings,
    readyMicrosites,
    dueTasks: tasks.length,
    nextActions: tasks.slice(0, 5).map(task => `${task.entityLabel}: ${task.nextAction}`),
  };
}
