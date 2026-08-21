import type { Locale } from "./i18n";
import type { EventCategoryId } from "./events";

export const EVENT_CATEGORY_LABELS = {
  community: { en: "Community & Markets", es: "Comunidad y mercados" },
  festivals: { en: "Festivals & Major Events", es: "Festivales y eventos principales" },
  neighborhood: { en: "Neighborhood Events", es: "Eventos vecinales" },
  professional: { en: "Professional & Networking", es: "Eventos profesionales y networking" },
  family: { en: "Family & Kids", es: "Familias y niños" },
  sports: { en: "Sports & Recreation", es: "Deportes y recreación" },
  "run-walk": { en: "Run Clubs & Walking Groups", es: "Clubes de carrera y caminatas" },
  "yoga-fitness": { en: "Yoga & Fitness", es: "Yoga y acondicionamiento físico" },
  "farmers-markets": { en: "Farmers Markets", es: "Mercados de agricultores" },
  "game-nights": { en: "Game Nights & Trivia", es: "Noches de juegos y trivia" },
  veteran: { en: "Veteran & Military Events", es: "Eventos para veteranos y militares" },
  "music-jam": { en: "Live Music & Open Mic", es: "Música en vivo y micrófono abierto" },
  "kids-storytime": { en: "Storytime & Kids Events", es: "Cuentacuentos y eventos infantiles" },
  meditation: { en: "Meditation & Mindfulness", es: "Meditación y atención plena" },
  "dog-meetups": { en: "Dog Meetups & Walks", es: "Encuentros y paseos de perros" },
  "makers-crafts": { en: "Makers Markets & Crafts", es: "Mercados de creadores y artesanías" },
} as const satisfies Record<EventCategoryId, Record<Locale, string>>;

export function eventCategoryLabel(categoryId: EventCategoryId, locale: Locale): string {
  return EVENT_CATEGORY_LABELS[categoryId][locale];
}
