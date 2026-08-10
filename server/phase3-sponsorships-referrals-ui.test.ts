import { describe, expect, it } from "vitest";
import * as schema from "../drizzle/schema";
import { appRouter } from "./routers";

describe("Phase 3 sponsorships, referrals, and directory UI contracts", () => {
  it("exports sponsorship and general referral tables", () => {
    expect(schema.eventSponsorships.eventId).toBeDefined();
    expect(schema.eventSponsorships.serviceKey).toBeDefined();
    expect(schema.businessReferrals.serviceKey).toBeDefined();
    expect(schema.businessReferrals.need).toBeDefined();
    expect(schema.businessListingOverrides.newcomerAttributes).toBeDefined();
  });

  it("exposes the new premium procedures", () => {
    for (const name of [
      "premium.getActiveDirectoryPromotions",
      "premium.getEventSponsors",
      "premium.createSponsorship",
      "premium.submitBizReferral",
      "premium.getBizReferrals",
      "premium.updateBizReferralStatus",
    ]) {
      expect(appRouter._def.procedures).toHaveProperty(name);
    }
  });
});
