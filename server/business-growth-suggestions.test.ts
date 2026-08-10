import { describe, expect, it } from "vitest";
import { getBusinessGrowthSuggestions } from "./business-growth-suggestions";

describe("business growth suggestions", () => {
  it("suggests profile and photo improvements when attention is not converting", () => {
    const suggestions = getBusinessGrowthSuggestions({
      businessName: "Queen City Movers",
      category: "Moving company",
      views: 120,
      clicks: 1,
      leads: 0,
      openLeadCount: 0,
      photoCount: 1,
      hasPhone: true,
      hasWebsite: true,
      hasHours: true,
    });

    expect(suggestions.map(s => s.key)).toEqual([
      "low_click_through",
      "add_photos",
      "post_service_explainer",
    ]);
    expect(suggestions.every(s => s.kind === "action" || s.kind === "post_idea")).toBe(true);
    expect(suggestions.find(s => s.key === "post_service_explainer")?.isGeneratedContent).toBe(false);
  });

  it("suggests follow-up and conversion improvements when clicks produce leads", () => {
    const suggestions = getBusinessGrowthSuggestions({
      businessName: "Queen City Movers",
      category: "Moving company",
      views: 100,
      clicks: 20,
      leads: 4,
      openLeadCount: 2,
      photoCount: 5,
      hasPhone: true,
      hasWebsite: true,
      hasHours: true,
    });

    expect(suggestions.map(s => s.key)).toEqual([
      "follow_up_leads",
      "post_customer_question",
    ]);
  });

  it("returns no recommendations for a complete, well-converting profile", () => {
    const suggestions = getBusinessGrowthSuggestions({
      businessName: "Queen City Movers",
      category: "Moving company",
      views: 100,
      clicks: 12,
      leads: 3,
      openLeadCount: 0,
      photoCount: 5,
      hasPhone: true,
      hasWebsite: true,
      hasHours: true,
    });

    expect(suggestions).toEqual([]);
  });
});
