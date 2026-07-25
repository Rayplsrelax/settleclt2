import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import {
  buildHermesRevenueOpsSummary,
  createHermesRevenueDraft,
  generateHermesRevenueTasks,
  type HermesRevenueOpsInput,
} from "../shared/hermesRevenueOps";

const now = new Date("2026-07-25T12:00:00Z");

const sampleInput: HermesRevenueOpsInput = {
  now,
  referrals: [
    {
      id: 101,
      name: "Avery Relocator",
      email: "avery@example.com",
      phone: "704-555-0101",
      referralType: "buying",
      status: "new",
      leadScore: 23,
      leadPriority: "hot",
      nextAction: "Reply same day and offer a discovery call",
      nextActionDueAt: "2026-07-25T09:00:00Z",
      createdAt: "2026-07-24T10:00:00Z",
      neighborhoods: "Dilworth, South End",
      timeline: "1-3months",
    },
    {
      id: 102,
      name: "Early Renter",
      email: "renter@example.com",
      referralType: "renting",
      status: "closed",
      leadScore: 9,
      leadPriority: "early",
      createdAt: "2026-07-20T10:00:00Z",
    },
  ],
  claims: [
    {
      id: 201,
      serviceKey: "queen-city-movers",
      businessName: "Queen City Movers",
      claimantName: "Mia Owner",
      claimantEmail: "mia@example.com",
      claimantPhone: "704-555-0202",
      status: "pending",
      createdAt: "2026-07-22T10:00:00Z",
    },
    {
      id: 202,
      serviceKey: "approved-cleaners",
      businessName: "Approved Cleaners",
      claimantName: "Chris Manager",
      claimantEmail: "chris@example.com",
      status: "approved",
      createdAt: "2026-07-21T10:00:00Z",
    },
  ],
  premiumListings: [
    {
      id: 301,
      serviceKey: "past-due-listing",
      tier: "premium",
      paymentStatus: "past_due",
      billingEmail: "billing@example.com",
      updatedAt: "2026-07-24T08:00:00Z",
      viewsThisPeriod: 120,
      clicksThisPeriod: 12,
      leadsThisPeriod: 2,
    },
    {
      id: 302,
      serviceKey: "active-featured",
      tier: "featured",
      paymentStatus: "active",
      billingEmail: "active@example.com",
      updatedAt: "2026-07-24T08:00:00Z",
      viewsThisPeriod: 90,
      clicksThisPeriod: 9,
      leadsThisPeriod: 1,
    },
  ],
  microsites: [
    { domain: "movingtocharlotteguide.com", campaign: "relocation", status: "ready_for_dns", primaryFunnel: "/find-your-home" },
    { domain: "charlotteweekendevents.com", campaign: "events", status: "needs_sitemap_submission", primaryFunnel: "/events" },
  ],
};

describe("Settle CLT Hermes Revenue Ops Agent", () => {
  it("creates due tasks across realtor, claim, subscription, microsite, and weekly summary lanes", () => {
    const tasks = generateHermesRevenueTasks(sampleInput);
    const taskTypes = tasks.map(task => task.type);

    expect(taskTypes).toContain("realtor_lead_followup");
    expect(taskTypes).toContain("business_claim_review");
    expect(taskTypes).toContain("listing_payment_recovery");
    expect(taskTypes).toContain("microsite_launch_check");
    expect(taskTypes).toContain("weekly_growth_summary");
    expect(tasks[0].priority).toBe("urgent");
    expect(tasks.every(task => task.status === "draft_only")).toBe(true);
    expect(tasks.every(task => task.sendAutomatically === false)).toBe(true);
  });

  it("drafts safe listing-confirmation-first messages without hard selling", () => {
    const tasks = generateHermesRevenueTasks(sampleInput);
    const claimTask = tasks.find(task => task.type === "business_claim_review");
    expect(claimTask).toBeTruthy();

    const draft = createHermesRevenueDraft(claimTask!);
    expect(draft.channel).toBe("email");
    expect(draft.body).toContain("confirm the best public information");
    expect(draft.body).toContain("Queen City Movers");
    expect(draft.body).not.toMatch(/guaranteed leads|exclusive ranking|best in Charlotte/i);
    expect(draft.requiresHumanApproval).toBe(true);
  });

  it("summarizes revenue pipeline value and next actions for Hermes weekly reports", () => {
    const summary = buildHermesRevenueOpsSummary(sampleInput);

    expect(summary.estimatedListingMrr).toBe(108);
    expect(summary.openRealtorLeads).toBe(1);
    expect(summary.pendingClaims).toBe(1);
    expect(summary.pastDueListings).toBe(1);
    expect(summary.readyMicrosites).toBe(1);
    expect(summary.nextActions[0]).toContain("Avery Relocator");
  });

  it("wires the agent into router/docs/scripts without sending outreach automatically", () => {
    const routers = readFileSync("server/routers.ts", "utf8");
    expect(routers).toContain("hermesRevenueOps");
    expect(routers).toContain("buildHermesRevenueOpsSummary");
    expect(routers).toContain("generateHermesRevenueTasks");

    expect(existsSync("scripts/hermes-revenue-ops-report.ts")).toBe(true);
    const script = readFileSync("scripts/hermes-revenue-ops-report.ts", "utf8");
    expect(script).toContain("draft_only");
    expect(script).toContain("sendAutomatically");

    expect(existsSync("docs/operations/SETTLE_CLT_HERMES_REVENUE_AGENT.md")).toBe(true);
    const manual = readFileSync("docs/operations/SETTLE_CLT_HERMES_REVENUE_AGENT.md", "utf8");
    expect(manual).toContain("Hermes Revenue + Lead Operations Agent");
    expect(manual).toContain("does not send outreach automatically");
  });
});
