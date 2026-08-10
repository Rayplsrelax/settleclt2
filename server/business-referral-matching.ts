import type { Service } from "@shared/services";

export type ReferralMatch = {
  serviceKey: string;
  name: string;
  category: string;
  area: string;
  score: number;
  reason: string;
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  movers: ["move", "moving", "mover", "relocation", "relocate", "packing", "storage"],
  realtors: ["home", "house", "real estate", "realtor", "buy", "sell", "rent", "apartment", "mortgage"],
  plumbers: ["plumb", "pipe", "water", "drain", "leak"],
  electricians: ["electric", "wiring", "outlet", "power"],
  dentists: ["dent", "teeth", "tooth", "oral"],
  childcare: ["child", "daycare", "day care", "preschool", "kid"],
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
const toServiceKey = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function recommendBusinessMatches(need: string, category?: string, excludeServiceKey?: string, limit = 5): Promise<ReferralMatch[]> {
  const { SERVICES } = await import("@shared/services");
  const query = normalize(`${category ?? ""} ${need}`);
  const keywordMatches = Object.entries(CATEGORY_KEYWORDS)
    .filter(([, keywords]) => keywords.some(keyword => query.includes(keyword)))
    .map(([key]) => key);

  const scored = SERVICES
    .filter(service => toServiceKey(service.name) !== excludeServiceKey)
    .map((service: Service) => {
      const serviceText = normalize(`${service.name} ${service.category} ${service.description}`);
      let score = 0;
      if (category && normalize(service.category) === normalize(category)) score += 8;
      if (keywordMatches.some(key => serviceText.includes(key))) score += 5;
      if (service.featured && score > 0) score += 1;
      return {
        serviceKey: toServiceKey(service.name),
        name: service.name,
        category: service.category,
        area: service.area,
        score,
        reason: category && normalize(service.category) === normalize(category)
          ? `Matches requested category: ${service.category}`
          : `Matches need: ${service.category}`,
      };
    })
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return scored.slice(0, limit);
}
