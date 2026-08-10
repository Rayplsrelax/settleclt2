import type { BusinessContext } from "./business-assistant";

type ReviewInput = {
  rating: number;
  tip: string | null;
  aspect: string | null;
};

export async function generateBusinessReviewResponse(
  business: BusinessContext,
  review: ReviewInput
): Promise<string> {
  const fallback =
    review.rating >= 4
      ? `Thank you for your ${review.rating}-star review. We appreciate you choosing ${business.displayName || "our business"} and are glad we could help.`
      : `Thank you for sharing your feedback. We’re sorry your experience did not fully meet expectations. Please contact ${business.displayName || "our business"} directly so we can understand what happened and work toward a better experience.`;
  const apiUrl = process.env.OPENAI_API_BASE_URL || process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiUrl || !apiKey) return fallback;

  const response = await fetch(
    `${apiUrl.replace(/\/+$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "claude-sonnet-4-5",
        temperature: 0.3,
        max_tokens: 180,
        messages: [
          {
            role: "system",
            content:
              "Draft one concise, professional business-owner response to a customer review. Do not claim facts not supplied, do not offer compensation, do not mention automation, and do not include private information. Return only the draft.",
          },
          {
            role: "user",
            content: JSON.stringify({
              business: {
                name: business.displayName,
                category: business.category,
              },
              review,
            }),
          },
        ],
      }),
    }
  );
  if (!response.ok) return fallback;
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const draft = data.choices?.[0]?.message?.content?.trim();
  return draft && draft.length <= 900 ? draft : fallback;
}
