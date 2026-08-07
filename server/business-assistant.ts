/**
 * AI Business Assistant — answers visitor questions using business data.
 *
 * Builds a grounded system prompt from the business's public listing data,
 * enrichment info, and owner-managed FAQs, then calls the Nous Portal LLM API.
 */

import { ENV } from "./_core/env";

interface BusinessContext {
  displayName: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  tagline: string | null;
  serviceKey: string;
  category: string;
  googleRating?: string | null;
  reviewCount?: number | null;
  verifiedAddress?: string | null;
}

interface FaqEntry {
  question: string;
  answer: string;
}

interface AssistantResponse {
  reply: string;
  bookingIntent: boolean;
}

function buildSystemPrompt(business: BusinessContext, faqs: FaqEntry[]): string {
  const faqText = faqs.length > 0
    ? faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")
    : "No FAQs have been configured yet.";

  const hoursText = business.hours
    ? (() => {
        try {
          const parsed = JSON.parse(business.hours);
          const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
          const labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          return days.map((d, i) => {
            const h = parsed[d];
            if (!h || h.closed) return `${labels[i]}: Closed`;
            return `${labels[i]}: ${h.open || "9:00"} - ${h.close || "17:00"}`;
          }).join("\n");
        } catch {
          return "Hours not specified";
        }
      })()
    : "Hours not specified";

  return `You are the AI assistant for ${business.displayName || business.serviceKey}, a ${business.category} business in Charlotte, NC.
You help website visitors with questions about this business.

Business information:
- Name: ${business.displayName || business.serviceKey}
- Phone: ${business.phone || "Not available"}
- Hours:
${hoursText}
- Website: ${business.website || "Not available"}
- Address: ${business.verifiedAddress || "Not available"}
${business.googleRating ? `- Google Rating: ${business.googleRating} stars (${business.reviewCount ?? 0} reviews)` : ""}
- Description: ${business.description || "No description available."}
- Tagline: ${business.tagline || ""}

Frequently asked questions:
${faqText}

Rules:
- Be friendly, concise, and helpful. Keep responses under 150 words.
- Only share information about THIS business. Never discuss competitors.
- If you don't know something (prices, availability, specific policies), suggest they call ${business.phone || "the business"}.
- Never make up prices, availability, or policies not in the data above.
- If the visitor seems to want to book, schedule, or make an appointment, include "[BOOKING_INTENT]" at the end of your response.
- Do not include any URLs unless they are from the business info above.
- If asked about something completely unrelated to this business, politely redirect them.`;
}

export async function askBusinessAssistant(
  business: BusinessContext,
  faqs: FaqEntry[],
  visitorQuestion: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
): Promise<AssistantResponse> {
  const systemPrompt = buildSystemPrompt(business, faqs);

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-6).map(m => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: visitorQuestion },
  ];

  // Use the Nous Portal API (OpenAI-compatible) if configured
  const apiUrl = process.env.OPENAI_API_BASE_URL || process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiUrl || !apiKey) {
    return {
      reply: `I'd be happy to help! For specific questions, please call ${business.phone || "the business"} directly.`,
      bookingIntent: false,
    };
  }

  try {
    const response = await fetch(`${apiUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "claude-sonnet-4-5",
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("[BusinessAssistant] LLM API error:", response.status, await response.text().catch(() => ""));
      return {
        reply: `I'd be happy to help! For specific questions, please call ${business.phone || "the business"} directly.`,
        bookingIntent: false,
      };
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? "";

    const bookingIntent = content.includes("[BOOKING_INTENT]");
    const cleanReply = content.replace("[BOOKING_INTENT]", "").trim();

    return {
      reply: cleanReply || `I'd be happy to help! Please call ${business.phone || "the business"} for more details.`,
      bookingIntent,
    };
  } catch (error) {
    console.error("[BusinessAssistant] Failed to get LLM response:", error);
    return {
      reply: `I'd be happy to help! For specific questions, please call ${business.phone || "the business"} directly.`,
      bookingIntent: false,
    };
  }
}
