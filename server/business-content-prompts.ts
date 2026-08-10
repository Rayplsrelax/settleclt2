import type { BusinessContext } from "./business-assistant";

type ContentPrompt = {
  channel: "instagram" | "facebook" | "google_business_profile" | "newsletter";
  title: string;
  prompt: string;
};

const FALLBACK_CHANNELS: ContentPrompt["channel"][] = [
  "instagram",
  "facebook",
  "google_business_profile",
  "newsletter",
];

function fallbackPrompts(business: BusinessContext): ContentPrompt[] {
  const name = business.displayName || business.serviceKey;
  const service = business.category || "local service";
  return FALLBACK_CHANNELS.map(channel => ({
    channel,
    title: `${channel.replace(/_/g, " ")} prompt for ${name}`,
    prompt: `Create a ${channel.replace(/_/g, " ")} post for ${name}, a ${service} business in Charlotte. Focus on one specific customer problem, use only verified business facts, include a clear contact or booking call to action, and do not invent prices, availability, guarantees, or testimonials.`,
  }));
}

export async function generateBusinessContentPrompts(
  business: BusinessContext
): Promise<ContentPrompt[]> {
  const apiUrl = process.env.OPENAI_API_BASE_URL || process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiUrl || !apiKey) return fallbackPrompts(business);

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
        temperature: 0.4,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Return JSON only with a prompts array containing exactly four objects: channel, title, prompt. Channels must be instagram, facebook, google_business_profile, or newsletter. Create prompts, not finished posts. Use only the supplied business facts. Never invent pricing, availability, guarantees, reviews, or credentials.",
          },
          { role: "user", content: JSON.stringify({ business }) },
        ],
      }),
    }
  );
  if (!response.ok) return fallbackPrompts(business);

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    if (!Array.isArray(parsed.prompts) || parsed.prompts.length !== 4)
      return fallbackPrompts(business);
    const allowed = new Set(FALLBACK_CHANNELS);
    const prompts = parsed.prompts.filter(
      (item: unknown): item is ContentPrompt => {
        if (!item || typeof item !== "object") return false;
        const value = item as Record<string, unknown>;
        return (
          allowed.has(value.channel as ContentPrompt["channel"]) &&
          typeof value.title === "string" &&
          typeof value.prompt === "string" &&
          value.title.length <= 160 &&
          value.prompt.length <= 1200
        );
      }
    );
    return prompts.length === 4 ? prompts : fallbackPrompts(business);
  } catch {
    return fallbackPrompts(business);
  }
}
