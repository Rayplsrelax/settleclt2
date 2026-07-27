import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { classifyLeadPriority, scoreRealtorLead } from "../shared/realtorLeadOps";

describe("Realtor lead operations scoring", () => {
  it("classifies hot relocation buyers for same-day follow-up", () => {
    const result = scoreRealtorLead({
      referralType: "buying",
      budget: "$550k-$700k",
      timeline: "1-3months",
      neighborhoods: "South Charlotte, Dilworth",
      phone: "704-555-1234",
      currentCity: "Raleigh",
      notes: "Relocating to Charlotte for work and want to buy a home near good commute options.",
    });

    expect(result.leadScore).toBeGreaterThanOrEqual(21);
    expect(result.leadPriority).toBe("hot");
    expect(result.callRecommended).toBe(true);
    expect(result.nextAction).toContain("same day");
    expect(result.nextActionDueDays).toBe(0);
  });

  it("classifies rent-first leads as nurture when they are useful but not buyer-ready", () => {
    const result = scoreRealtorLead({
      referralType: "renting",
      budget: "$1,800-$2,200/mo",
      timeline: "6-12months",
      neighborhoods: "NoDa, South End",
      notes: "Thinking about renting first before buying later.",
    });

    expect(result.leadPriority).toBe("nurture");
    expect(result.callRecommended).toBe(false);
    expect(result.nextAction).toContain("relocation guidance");
  });

  it("keeps vague low-information leads out of the hot queue", () => {
    const result = scoreRealtorLead({
      referralType: "renting",
      timeline: "just-looking",
    });

    expect(result.leadScore).toBeLessThan(11);
    expect(["early", "low"]).toContain(result.leadPriority);
    expect(result.callRecommended).toBe(false);
  });

  it("uses the documented 0-25 priority thresholds", () => {
    expect(classifyLeadPriority(25)).toBe("hot");
    expect(classifyLeadPriority(21)).toBe("hot");
    expect(classifyLeadPriority(20)).toBe("qualified");
    expect(classifyLeadPriority(16)).toBe("qualified");
    expect(classifyLeadPriority(15)).toBe("nurture");
    expect(classifyLeadPriority(11)).toBe("nurture");
    expect(classifyLeadPriority(10)).toBe("early");
    expect(classifyLeadPriority(6)).toBe("early");
    expect(classifyLeadPriority(5)).toBe("low");
  });

  it("includes a safe production backfill script for existing referrals", () => {
    const script = readFileSync("scripts/backfill-referral-lead-ops.ts", "utf8");
    expect(script).toContain("scoreRealtorLead");
    expect(script).toContain("--dry-run");
    expect(script).toContain("missing_ops_only");
  });
});
