import type { Service } from "@shared/services";
import type { Locale } from "@shared/i18n";

export type ReferralMatch = {
  serviceKey: string;
  name: string;
  category: string;
  area: string;
  score: number;
  reason: string;
};

const CATEGORY_SIGNALS: Record<string, {
  keywords: string[];
  categoryIds: string[];
  serviceKeywords?: string[];
  requiredServiceCategoryIds?: string[];
}> = {
  movers: {
    keywords: ["move", "moving", "mover", "relocation", "relocate", "packing", "storage", "mudanza", "mudar", "embalaje", "almacenamiento"],
    categoryIds: ["moving-companies", "storage"],
  },
  realtors: {
    keywords: ["home", "house", "real estate", "realtor", "buy", "sell", "rent", "apartment", "mortgage", "casa", "vivienda", "inmobiliaria", "comprar", "vender", "alquiler", "apartamento", "hipoteca"],
    categoryIds: [],
  },
  plumbers: {
    keywords: ["plumb", "pipe", "water", "drain", "leak", "plomeria", "tuberia", "agua", "drenaje", "fuga"],
    categoryIds: ["plumbers"],
  },
  electricians: {
    keywords: ["electric", "wiring", "outlet", "power", "electricista", "cableado", "enchufe", "energia"],
    categoryIds: ["electricians"],
  },
  dentists: {
    keywords: ["teeth", "tooth", "odontologia", "dentista", "diente", "dientes", "dental", "dentistry"],
    categoryIds: [],
    serviceKeywords: ["dental", "dentist", "dentistry", "teeth", "tooth", "oral care", "orthodont"],
    requiredServiceCategoryIds: ["healthcare"],
  },
  childcare: {
    keywords: ["child", "daycare", "day care", "preschool", "kid", "cuidado infantil", "guarderia", "preescolar", "nino"],
    categoryIds: ["childcare"],
  },
};

const SPANISH_CATEGORY_LABELS: Record<string, string> = {
  "moving-companies": "Empresas de mudanza",
  storage: "Almacenamiento y contenedores de mudanza",
  plumbers: "Plomeros",
  electricians: "Electricistas",
  healthcare: "Salud y atención urgente",
  childcare: "Cuidado infantil y escuelas",
};

const VETERINARY_KEYWORDS = [
  "veterinary", "veterinarian", "vet", "dog", "cat", "pet",
  "veterinario", "veterinaria", "perro", "gato", "mascota",
];

const normalize = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9 ]/g, " ");

function matchesKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalize(text).replace(/\s+/g, " ").trim();
  const normalizedKeyword = normalize(keyword).replace(/\s+/g, " ").trim();
  if (!normalizedKeyword) return false;
  if (normalizedKeyword.includes(" ")) {
    return ` ${normalizedText} `.includes(` ${normalizedKeyword} `);
  }
  return normalizedText.split(" ").some(token => token.startsWith(normalizedKeyword));
}
const toServiceKey = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function recommendBusinessMatches(
  need: string,
  category?: string,
  excludeServiceKey?: string,
  limit = 5,
  locale: Locale = "en"
): Promise<ReferralMatch[]> {
  const { SERVICES, SERVICE_CATEGORIES } = await import("@shared/services");
  const query = normalize(`${category ?? ""} ${need}`);
  const veterinaryIntent = VETERINARY_KEYWORDS.some(keyword => matchesKeyword(query, keyword));
  const signalMatches = Object.entries(CATEGORY_SIGNALS)
    .filter(([key, signal]) =>
      !(key === "dentists" && veterinaryIntent) &&
      signal.keywords.some(keyword => matchesKeyword(query, keyword))
    )
    .map(([key]) => key);

  const scored = SERVICES
    .filter(service => toServiceKey(service.name) !== excludeServiceKey)
    .map((service: Service) => {
      const serviceText = normalize(`${service.name} ${service.category} ${service.description}`);
      let score = 0;
      if (category && normalize(service.category) === normalize(category)) score += 8;
      if (signalMatches.some(key => {
        const signal = CATEGORY_SIGNALS[key];
        if (signal.requiredServiceCategoryIds &&
          !signal.requiredServiceCategoryIds.includes(service.category)) return false;
        const serviceKeywordMatch = (signal.serviceKeywords ?? signal.keywords)
          .some(keyword => matchesKeyword(serviceText, keyword));
        return signal.categoryIds.includes(service.category) || serviceKeywordMatch;
      })) score += 5;
      if (service.featured && score > 0) score += 1;
      return {
        serviceKey: toServiceKey(service.name),
        name: service.name,
        category: locale === "es"
          ? SPANISH_CATEGORY_LABELS[service.category] ?? SERVICE_CATEGORIES.find(item => item.id === service.category)?.name ?? service.category
          : service.category,
        area: service.area,
        score,
        reason: locale === "es"
          ? `Coincide con tu necesidad: ${SPANISH_CATEGORY_LABELS[service.category] ?? service.category}`
          : category && normalize(service.category) === normalize(category)
            ? `Matches requested category: ${service.category}`
            : `Matches need: ${service.category}`,
      };
    })
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return scored.slice(0, limit);
}
