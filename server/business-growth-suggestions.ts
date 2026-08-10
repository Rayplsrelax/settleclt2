export type GrowthSuggestionKind = "action" | "post_idea";

export interface BusinessGrowthSuggestionInput {
  businessName: string;
  category: string;
  views: number;
  clicks: number;
  leads: number;
  openLeadCount: number;
  photoCount: number;
  hasPhone: boolean;
  hasWebsite: boolean;
  hasHours: boolean;
}

export interface BusinessGrowthSuggestion {
  key:
    | "complete_profile"
    | "low_click_through"
    | "add_photos"
    | "follow_up_leads"
    | "post_service_explainer"
    | "post_customer_question";
  kind: GrowthSuggestionKind;
  title: string;
  detail: string;
  isGeneratedContent: false;
}

function action(
  key: BusinessGrowthSuggestion["key"],
  title: string,
  detail: string,
): BusinessGrowthSuggestion {
  return { key, kind: "action", title, detail, isGeneratedContent: false };
}

function postIdea(
  key: BusinessGrowthSuggestion["key"],
  title: string,
  detail: string,
): BusinessGrowthSuggestion {
  return { key, kind: "post_idea", title, detail, isGeneratedContent: false };
}

export function getBusinessGrowthSuggestions(
  input: BusinessGrowthSuggestionInput,
): BusinessGrowthSuggestion[] {
  const suggestions: BusinessGrowthSuggestion[] = [];
  const clickThroughRate = input.views > 0 ? input.clicks / input.views : 0;
  const leadConversionRate = input.clicks > 0 ? input.leads / input.clicks : 0;
  const profileNeedsWork = !input.hasPhone || !input.hasWebsite || !input.hasHours;

  if (profileNeedsWork) {
    suggestions.push(action(
      "complete_profile",
      "Complete your business profile",
      "Add the missing contact or hours information so visitors can decide how to reach you.",
    ));
  }

  if (input.views >= 25 && clickThroughRate < 0.025) {
    suggestions.push(action(
      "low_click_through",
      "Improve listing conversion",
      `Your listing has ${input.views} views but only ${input.clicks} clicks. Strengthen the first photo, tagline, and primary contact call-to-action.`,
    ));
  }

  if (input.views > 0 && input.photoCount < 5) {
    suggestions.push(action(
      "add_photos",
      "Add more business photos",
      `You have ${input.photoCount} photo${input.photoCount === 1 ? "" : "s"}. Add real photos of your work, team, storefront, or service area to build confidence.`,
    ));
  }

  if (input.openLeadCount > 0) {
    suggestions.push(action(
      "follow_up_leads",
      "Follow up with open inquiries",
      `You have ${input.openLeadCount} lead${input.openLeadCount === 1 ? "" : "s"} waiting for follow-up. Respond promptly while the customer is still comparing options.`,
    ));
  }

  if (input.views >= 25 && clickThroughRate < 0.05) {
    suggestions.push(postIdea(
      "post_service_explainer",
      "Post idea: explain one service",
      `Use a short post to explain what customers should know before choosing a ${input.category.toLowerCase()} service. This is a topic suggestion, not generated copy or graphics.`,
    ));
  } else if (input.leads > 0 && leadConversionRate <= 0.2) {
    suggestions.push(postIdea(
      "post_customer_question",
      "Post idea: answer a common customer question",
      `Use a short educational post to answer a question customers ask before contacting ${input.businessName}. This is a topic suggestion, not generated copy or graphics.`,
    ));
  }

  return suggestions;
}
