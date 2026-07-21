/* ============================================
   SETTLE CLT — Events Data
   Categories and seed events for the events system.
   ============================================ */

export type EventType = "recurring" | "one_time";
export type EventCost = "free" | "paid" | "mixed";

export interface EventCategory {
  id: string;
  name: string;
  icon: string;
}

export interface SeedEvent {
  name: string;
  slug: string;
  type: EventType;
  category: string;
  organizer?: string;
  organizerWebsite?: string;
  venue?: string;
  venueArea?: string;
  startDate?: string;
  endDate?: string;
  recurringPattern?: string;
  sourceUrl: string;
  sourceVerified?: boolean;
  newcomerFriendly?: boolean;
  featured?: boolean;
  description?: string;
  neighborhood?: string;
  cost?: EventCost;
  rsvpUrl?: string;
}

export const EVENT_CATEGORIES: EventCategory[] = [
  { id: "community", name: "Community & Markets", icon: "🏘️" },
  { id: "festivals", name: "Festivals & Major Events", icon: "🎪" },
  { id: "neighborhood", name: "Neighborhood Events", icon: "📍" },
  { id: "professional", name: "Professional & Networking", icon: "🤝" },
  { id: "family", name: "Family & Kids", icon: "👨‍👩‍👧" },
  { id: "sports", name: "Sports & Recreation", icon: "🏃" },
];

export const SEED_EVENTS: SeedEvent[] = [
  {
    name: "Charlotte SHOUT!",
    slug: "charlotte-shout",
    type: "one_time",
    category: "festivals",
    organizer: "Charlotte Center City Partners",
    organizerWebsite: "https://www.charlotteshout.com",
    venue: "Uptown Charlotte",
    venueArea: "Uptown",
    startDate: "2026-04-10",
    endDate: "2026-04-26",
    sourceUrl: "https://www.charlotteshout.com",
    featured: true,
    newcomerFriendly: true,
    description:
      "Charlotte's signature spring arts and culture festival spanning Uptown with live music, food, art installations, and performances.",
    neighborhood: "Uptown",
    cost: "mixed",
  },
  {
    name: "Taco Intercambio",
    slug: "taco-intercambio",
    type: "recurring",
    category: "community",
    organizer: "Latin American Coalition",
    organizerWebsite: "https://www.latinamericancoalition.org",
    venue: "Midwood International & Cultural Center",
    venueArea: "Central Charlotte",
    recurringPattern: "Monthly, first Friday",
    sourceUrl: "https://www.latinamericancoalition.org/events",
    newcomerFriendly: true,
    description:
      "A free monthly community gathering celebrating Latin American culture through tacos, music, and dancing.",
    neighborhood: "Plaza Midwood",
    cost: "free",
  },
  {
    name: "South End Wine Walk",
    slug: "south-end-wine-walk",
    type: "recurring",
    category: "community",
    organizer: "South End District",
    organizerWebsite: "https://southendclt.com",
    venue: "South End Rail Trail",
    venueArea: "South End",
    recurringPattern: "Seasonal, spring and fall",
    sourceUrl: "https://southendclt.com/events/south-end-wine-walk",
    featured: true,
    newcomerFriendly: true,
    description:
      "A walkable wine tasting event through South End's best restaurants and wine bars along the Rail Trail.",
    neighborhood: "South End",
    cost: "paid",
  },
  {
    name: "Charlotte Farmers Market",
    slug: "charlotte-farmers-market",
    type: "recurring",
    category: "community",
    organizer: "NC Department of Agriculture",
    organizerWebsite: "https://www.ncagr.gov",
    venue: "Charlotte Regional Farmers Market",
    venueArea: "West Charlotte",
    recurringPattern: "Year-round, Tue–Sun",
    sourceUrl: "https://www.ncagr.gov/markets/facilities/markets/charlotte",
    newcomerFriendly: true,
    description:
      "Year-round regional farmers market with local produce, meats, baked goods, and crafts.",
    neighborhood: "West Charlotte",
    cost: "free",
  },
  {
    name: "Optimist Hall Night Market",
    slug: "optimist-hall-night-market",
    type: "recurring",
    category: "community",
    organizer: "Optimist Hall",
    organizerWebsite: "https://optimisthall.com",
    venue: "Optimist Hall",
    venueArea: "NoDa",
    recurringPattern: "Monthly, second Saturday",
    sourceUrl: "https://optimisthall.com/events",
    featured: false,
    newcomerFriendly: true,
    description:
      "Evening market at Optimist Hall with local makers, live music, and food hall vendors.",
    neighborhood: "NoDa",
    cost: "free",
  },
  {
    name: "Cedar Street Night Market",
    slug: "cedar-street-night-market",
    type: "recurring",
    category: "neighborhood",
    organizer: "Camp North End",
    organizerWebsite: "https://campnorthend.com",
    venue: "Camp North End",
    venueArea: "North End",
    recurringPattern: "Monthly, summer",
    sourceUrl: "https://campnorthend.com/events",
    description:
      "Neighborhood night market at Camp North End featuring local artists, food trucks, and live music.",
    neighborhood: "Camp North End",
    cost: "free",
  },
  {
    name: "Charlotte Black Film Festival",
    slug: "charlotte-black-film-festival",
    type: "one_time",
    category: "festivals",
    organizer: "Charlotte Black Film Festival",
    organizerWebsite: "https://www.charlotteblackfilmfestival.com",
    venue: "Gantt Center",
    venueArea: "Uptown",
    startDate: "2026-06-12",
    endDate: "2026-06-14",
    sourceUrl: "https://www.charlotteblackfilmfestival.com",
    featured: true,
    newcomerFriendly: false,
    description:
      "Annual festival showcasing Black filmmakers with screenings, panels, and networking events at the Gantt Center.",
    neighborhood: "Uptown",
    cost: "paid",
  },
  {
    name: "Charlotte Tech Breakfast",
    slug: "charlotte-tech-breakfast",
    type: "recurring",
    category: "professional",
    organizer: "Charlotte Tech Breakfast",
    organizerWebsite: "https://www.meetup.com/charlotte-tech-breakfast",
    venue: "Packard Place",
    venueArea: "Uptown",
    recurringPattern: "Monthly, second Tuesday",
    sourceUrl: "https://www.meetup.com/charlotte-tech-breakfast",
    newcomerFriendly: true,
    description:
      "Monthly morning meetup for Charlotte's tech community — founders, developers, and professionals networking over coffee.",
    neighborhood: "Uptown",
    cost: "free",
  },
  {
    name: "Queen City Bike Party",
    slug: "queen-city-bike-party",
    type: "recurring",
    category: "sports",
    organizer: "Queen City Bike Party",
    organizerWebsite: "https://www.queencitybikeparty.org",
    venue: "Various start locations",
    venueArea: "Charlotte Metro",
    recurringPattern: "Monthly, last Friday",
    sourceUrl: "https://www.queencitybikeparty.org",
    newcomerFriendly: true,
    description:
      "A free, community bike ride through Charlotte neighborhoods with a different route each month. All speeds welcome.",
    neighborhood: "Charlotte Metro",
    cost: "free",
  },
  {
    name: "Discovery Place Kids Summer Camps",
    slug: "discovery-place-kids-summer-camps",
    type: "recurring",
    category: "family",
    organizer: "Discovery Place",
    organizerWebsite: "https://www.discoveryplace.org",
    venue: "Discovery Place Science",
    venueArea: "Uptown",
    startDate: "2026-06-15",
    endDate: "2026-08-15",
    recurringPattern: "Weekly, summer",
    sourceUrl: "https://www.discoveryplace.org/camps",
    featured: false,
    newcomerFriendly: true,
    description:
      "Hands-on STEM summer camps for kids at Discovery Place Science — robotics, coding, and science exploration.",
    neighborhood: "Uptown",
    cost: "paid",
  },
  {
    name: "Alive After Five",
    slug: "alive-after-five",
    type: "recurring",
    category: "neighborhood",
    organizer: "Epicenter",
    organizerWebsite: "https://theepicentre.com",
    venue: "Epicenter",
    venueArea: "Uptown",
    recurringPattern: "Weekly, Thursdays, Apr–Oct",
    sourceUrl: "https://theepicentre.com/events",
    featured: true,
    newcomerFriendly: true,
    description:
      "Charlotte's longest-running weekly free outdoor concert series in the Epicenter, featuring live bands every Thursday.",
    neighborhood: "Uptown",
    cost: "free",
  },
  {
    name: "Charlotte Pride Festival & Parade",
    slug: "charlotte-pride-festival-parade",
    type: "one_time",
    category: "festivals",
    organizer: "Charlotte Pride",
    organizerWebsite: "https://www.charlottepride.org",
    venue: "Uptown Charlotte",
    venueArea: "Uptown",
    startDate: "2026-08-15",
    endDate: "2026-08-16",
    sourceUrl: "https://www.charlottepride.org/festival",
    featured: true,
    newcomerFriendly: true,
    description:
      "The largest LGBTQ+ pride celebration in the Carolinas with a parade, festival, live entertainment, and community resources.",
    neighborhood: "Uptown",
    cost: "free",
  },
];
