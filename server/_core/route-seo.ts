import { allNeighborhoods } from "../../shared/neighborhoods";
import { SERVICES, SERVICE_CATEGORIES } from "../../shared/services";
import { EVENT_CATEGORIES } from "../../shared/events";
import type { Locale } from "../../shared/i18n";

/**
 * Per-route SEO metadata injected server-side into the SPA shell.
 * Googlebot's first (un-hydrated) fetch must see the right canonical
 * and title for every URL, not a homepage-canonical for all routes.
 */

export interface RouteSeo {
  title: string;
  description: string;
}

const HOME_TITLE = "Your Complete Guide to Living in Charlotte, NC";
const HOME_DESCRIPTION =
  "Explore 20 Charlotte neighborhoods, discover 700+ local businesses, find events, and get honest advice from locals.";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const STATIC_SEO: Record<string, RouteSeo> = {
  "/": { title: HOME_TITLE, description: HOME_DESCRIPTION },
  "/neighborhoods": {
    title: "Charlotte Neighborhood Guides",
    description:
      "Compare 20+ Charlotte neighborhoods — housing costs, vibe, walkability, and who each area fits best.",
  },
  "/directory": {
    title: "Charlotte Local Business Directory",
    description:
      "Browse 700+ vetted local businesses across Charlotte — movers, restaurants, gyms, salons, and more.",
  },
  "/events": {
    title: "Charlotte Events Calendar",
    description:
      "Upcoming events across Charlotte — markets, festivals, live music, and neighborhood happenings.",
  },
  "/things-to-do": {
    title: "Things to Do in Charlotte",
    description:
      "Curated things to do in Charlotte — attractions, parks, food halls, and weekend plans.",
  },
  "/blog": {
    title: "Charlotte Living Blog",
    description:
      "Honest guides and local advice for living in Charlotte — moving, neighborhoods, and city life.",
  },
  "/passport": {
    title: "Settle CLT Passport",
    description:
      "Check in at Charlotte businesses and events, earn stamps, and level up your Settle CLT Passport.",
  },
  "/bingo": {
    title: "Charlotte Bingo",
    description:
      "Play Settle CLT bingo — explore the city, complete challenges, and win local rewards.",
  },
  "/leaderboard": {
    title: "Community Leaderboard",
    description:
      "Top Settle CLT community members by stamps, check-ins, and neighborhood exploration.",
  },
  "/quiz": {
    title: "Which Charlotte Neighborhood Is Right for You?",
    description:
      "Answer a few questions and get a personal Charlotte neighborhood match.",
  },
  "/list-your-business": {
    title: "List Your Business on Settle CLT",
    description:
      "Get your local business in front of Charlotte newcomers and locals. Free and paid listings.",
  },
  "/business-pricing": {
    title: "Business Listing Pricing",
    description:
      "Pricing for Settle CLT business listings — free, featured, and premium options.",
  },
  "/referrals": {
    title: "Charlotte Local Business Referrals",
    description: "Request recommendations for trusted Charlotte-area businesses.",
  },
  "/compare": {
    title: "Compare Charlotte Neighborhoods",
    description:
      "Compare Charlotte neighborhoods side by side — cost, commute, vibe, and amenities.",
  },
  "/contact": {
    title: "Contact Settle CLT",
    description:
      "Questions, feedback, or corrections for Settle CLT — get in touch.",
  },
  "/newcomer-plan": {
    title: "Charlotte Newcomer Plan",
    description: "A step-by-step plan for your first 90 days in Charlotte.",
  },
  "/find-your-home": {
    title: "Find Your Home in Charlotte",
    description: "Search and compare homes across Charlotte neighborhoods.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description: "How Settle CLT handles your data and privacy.",
  },
  "/terms": {
    title: "Terms of Service",
    description: "The terms for using Settle CLT.",
  },
  "/404": {
    title: "Page Not Found",
    description: "This page could not be found.",
  },
};

const SPANISH_SEO: Partial<Record<string, RouteSeo>> = {
  "/business-pricing": {
    title: "Precios para negocios de Settle CLT",
    description: "Reclama el perfil de tu negocio en Charlotte y compara planes de visibilidad.",
  },
  "/referrals": {
    title: "Referencias de negocios locales en Charlotte",
    description: "Solicita recomendaciones de negocios confiables del área de Charlotte.",
  },
  "/404": {
    title: "Página no encontrada",
    description: "No se pudo encontrar esta página.",
  },
};

export function normalizePath(pathname: string): string {
  let path = pathname.split("?")[0].split("#")[0];
  if (path !== "/" && path.endsWith("/")) {
    path = path.replace(/\/+$/, "");
  }
  return path;
}

export function resolveRouteSeo(
  pathname: string,
  blogTitles?: Map<string, string>,
  locale: Locale = "en"
): RouteSeo {
  const path = normalizePath(pathname);

  const fixed = locale === "es"
    ? SPANISH_SEO[path] ?? STATIC_SEO[path]
    : STATIC_SEO[path];
  if (fixed) return fixed;

  // /neighborhood/:id
  const neighborhoodMatch = path.match(/^\/neighborhood\/([^/]+)$/);
  if (neighborhoodMatch) {
    const id = decodeURIComponent(neighborhoodMatch[1]);
    const neighborhood = allNeighborhoods.find(n => n.id === id);
    if (neighborhood) {
      return {
        title: `${neighborhood.name}: Guide to Living There`,
        description: `Living in ${neighborhood.name}, Charlotte — housing, vibe, walkability, and who it fits.`,
      };
    }
  }

  // /directory/category/:slug
  const dirCatMatch = path.match(/^\/directory\/category\/([^/]+)$/);
  if (dirCatMatch) {
    const slug = decodeURIComponent(dirCatMatch[1]);
    const category = SERVICE_CATEGORIES.find(c => c.id === slug);
    if (category) {
      return {
        title: `Best ${category.name} in Charlotte`,
        description: `Top-rated ${category.name.toLowerCase()} in Charlotte, handpicked by locals.`,
      };
    }
  }

  // /events/category/:categoryId
  const evtCatMatch = path.match(/^\/events\/category\/([^/]+)$/);
  if (evtCatMatch) {
    const catId = decodeURIComponent(evtCatMatch[1]);
    const category = EVENT_CATEGORIES.find(c => c.id === catId);
    if (category) {
      return {
        title: `${category.name} in Charlotte`,
        description: `${category.name} events across Charlotte — dates, venues, and details.`,
      };
    }
  }

  // /directory/:slug — business detail
  const bizMatch = path.match(/^\/directory\/([^/]+)$/);
  if (bizMatch) {
    const slug = decodeURIComponent(bizMatch[1]);
    const business = SERVICES.find(s => toSlug(s.name) === slug);
    if (business) {
      return {
        title: `${business.name} — Charlotte`,
        description: locale === "es"
          ? `${business.name} en Charlotte — reseñas, detalles e información local en Settle CLT.`
          : `${business.name} in Charlotte — reviews, details, and neighborhood info on Settle CLT.`,
      };
    }
  }

  // /blog/:slug — database-backed; middleware resolves the title and
  // passes it via blogTitles before calling the sync resolver.
  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch && blogTitles) {
    const slug = decodeURIComponent(blogMatch[1]);
    const postTitle = blogTitles.get(slug);
    if (postTitle) {
      return {
        title: postTitle,
        description: "Read this Settle CLT guide to living in Charlotte.",
      };
    }
  }

  return { title: HOME_TITLE, description: HOME_DESCRIPTION };
}
