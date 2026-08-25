import { allNeighborhoods } from "../../shared/neighborhoods";
import { SERVICES, SERVICE_CATEGORIES } from "../../shared/services";
import { EVENT_CATEGORIES } from "../../shared/events";
import type { EventCategoryId } from "../../shared/events";
import { EVENT_CATEGORY_LABELS } from "../../shared/event-category-i18n";
import type { Locale } from "../../shared/i18n";
import { HOUSING_COPY } from "../../shared/housing-copy";
import { safeDecodeURIComponent } from "./safe-decode";
import { SERVICE_CATEGORY_LABELS } from "../../client/src/i18n/serviceLabels";

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
  "Explore 20 Charlotte neighborhoods, discover 700+ local businesses, find events, and read local guides.";

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
      "Compare 20+ Charlotte neighborhoods — housing costs, vibe, walkability, and who each area may suit.",
  },
  "/directory": {
    title: "Charlotte Local Business Directory",
    description:
      "Browse 700+ local businesses across Charlotte — movers, restaurants, gyms, salons, and more.",
  },
  "/events": {
    title: "Charlotte Events Calendar",
    description:
      "Upcoming events across Charlotte — markets, festivals, live music, and neighborhood happenings.",
  },
  "/things-to-do": {
    title: "Things to Do in Charlotte",
    description:
      "Explore things to do in Charlotte — attractions, parks, food halls, and weekend plans.",
  },
  "/blog": {
    title: "Charlotte Living Blog",
    description:
      "Guides and local information for living in Charlotte — moving, neighborhoods, and city life.",
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
    description:
      "Request recommendations for Charlotte-area businesses.",
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
    description: HOUSING_COPY.en.request,
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
  "/profile": {
    title: "Your Profile",
    description: "Manage your Settle CLT profile and preferences.",
  },
  "/wishlist": {
    title: "My Wishlist",
    description: "View your saved Charlotte places and businesses.",
  },
  "/submit-event": {
    title: "Submit an Event",
    description: "Share a Charlotte event with the Settle CLT community.",
  },
  "/notifications": {
    title: "Notification Settings",
    description: "Manage your Settle CLT notifications and preferences.",
  },
  "/auth": {
    title: "Sign In or Create an Account",
    description: "Sign in to Settle CLT or create an account.",
  },
  "/my-business": {
    title: "Business Owner Portal",
    description: "Manage your claimed Settle CLT business listing.",
  },
};

const SPANISH_SEO: Partial<Record<string, RouteSeo>> = {
  "/": {
    title: "Tu guía completa para vivir en Charlotte, NC",
    description:
      "Explora vecindarios, negocios locales, eventos y consejos para vivir en Charlotte.",
  },
  "/neighborhoods": {
    title: "Guías de vecindarios de Charlotte",
    description:
      "Compara vecindarios de Charlotte por costos, ambiente y caminabilidad.",
  },
  "/directory": {
    title: "Directorio de negocios locales de Charlotte",
    description: "Explora más de 700 negocios locales en Charlotte.",
  },
  "/events": {
    title: "Calendario de eventos de Charlotte",
    description:
      "Descubre próximos mercados, festivales, conciertos y eventos en Charlotte.",
  },
  "/blog": {
    title: "Blog sobre vivir en Charlotte",
    description: "Guías y consejos locales para vivir y mudarte a Charlotte.",
  },
  "/passport": {
    title: "Pasaporte Settle CLT",
    description: "Visita negocios y eventos de Charlotte y colecciona sellos.",
  },
  "/leaderboard": {
    title: "Tabla de clasificación de la comunidad",
    description: "Descubre quién está explorando más Charlotte.",
  },
  "/quiz": {
    title: "¿Qué vecindario de Charlotte es ideal para ti?",
    description:
      "Responde unas preguntas y recibe una recomendación personalizada.",
  },
  "/list-your-business": {
    title: "Publica tu negocio en Settle CLT",
    description:
      "Presenta tu negocio a residentes y recién llegados de Charlotte.",
  },
  "/compare": {
    title: "Compara vecindarios de Charlotte",
    description:
      "Compara costos, trayectos, ambiente y servicios de los vecindarios.",
  },
  "/contact": {
    title: "Contacta a Settle CLT",
    description:
      "Envíanos preguntas, comentarios o correcciones sobre Settle CLT.",
  },
  "/find-your-home": {
    title: "Encuentra tu hogar en Charlotte",
    description: HOUSING_COPY.es.request,
  },
  "/profile": {
    title: "Tu perfil",
    description: "Administra tu perfil y preferencias de Settle CLT.",
  },
  "/wishlist": {
    title: "Mi lista de deseos",
    description: "Consulta los lugares y negocios de Charlotte que guardaste.",
  },
  "/submit-event": {
    title: "Enviar un evento",
    description:
      "Comparte un evento de Charlotte con la comunidad de Settle CLT.",
  },
  "/notifications": {
    title: "Configuración de notificaciones",
    description: "Administra tus notificaciones y preferencias de Settle CLT.",
  },
  "/auth": {
    title: "Inicia sesión o crea una cuenta",
    description: "Inicia sesión en Settle CLT o crea una cuenta.",
  },
  "/my-business": {
    title: "Portal para propietarios de negocios",
    description: "Administra el perfil reclamado de tu negocio en Settle CLT.",
  },
  "/newcomer-plan": {
    title: "Plan para recién llegados a Charlotte",
    description: "Un plan paso a paso para tus primeros 90 días en Charlotte.",
  },
  "/bingo": {
    title: "Bingo CLT — Tarjetas de desafíos de Charlotte",
    description:
      "Juega tarjetas temáticas y explora Charlotte una casilla a la vez.",
  },
  "/things-to-do": {
    title: "Cosas que hacer en Charlotte NC",
    description:
      "Descubre eventos, actividades gratuitas, diversión familiar y aventuras en Charlotte.",
  },
  "/business-pricing": {
    title: "Precios para negocios de Settle CLT",
    description:
      "Reclama el perfil de tu negocio en Charlotte y compara planes de visibilidad.",
  },
  "/referrals": {
    title: "Referencias de negocios locales en Charlotte",
    description:
      "Solicita recomendaciones de negocios del área de Charlotte.",
  },
  "/privacy": {
    title: "Política de Privacidad — Settle CLT",
    description:
      "Conozca cómo Settle CLT recopila, usa y protege su información personal. Lea nuestra política de privacidad completa.",
  },
  "/terms": {
    title: "Términos de Servicio — Settle CLT",
    description:
      "Lea los Términos de Servicio para usar la plataforma Settle CLT, incluidas las responsabilidades del usuario, las divulgaciones de referencias y las políticas de contenido.",
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

  const fixed =
    locale === "es"
      ? (SPANISH_SEO[path] ?? STATIC_SEO[path])
      : STATIC_SEO[path];
  if (fixed) return fixed;

  // /tag/:slug — tag names are represented by their human-readable slug on
  // the first response, before the client can resolve the database record.
  const tagMatch = path.match(/^\/tag\/([^/]+)$/);
  if (tagMatch) {
    const slug = safeDecodeURIComponent(tagMatch[1]) ?? tagMatch[1];
    const name = slug
      .split("-")
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    if (name) {
      return locale === "es"
        ? {
            title: `Etiqueta ${name} en Charlotte`,
            description: `Explora eventos, negocios, vecindarios y artículos de Charlotte con la etiqueta ${name}.`,
          }
        : {
            title: `${name} in Charlotte`,
            description: `Explore Charlotte events, businesses, neighborhoods, and articles tagged ${name}.`,
          };
    }
  }

  // /neighborhood/:id
  const neighborhoodMatch = path.match(/^\/neighborhood\/([^/]+)$/);
  if (neighborhoodMatch) {
    const id = safeDecodeURIComponent(neighborhoodMatch[1]);
    const neighborhood = id ? allNeighborhoods.find(n => n.id === id) : undefined;
    if (neighborhood) {
      return locale === "es"
        ? {
            title: `${neighborhood.name}: Guía para vivir allí`,
            description: `Vivir en ${neighborhood.name}, Charlotte — vivienda, ambiente, caminabilidad y para quién es ideal.`,
          }
        : {
            title: `${neighborhood.name}: Guide to Living There`,
            description: `Living in ${neighborhood.name}, Charlotte — housing, vibe, walkability, and who it fits.`,
          };
    }
    return locale === "es"
      ? SPANISH_SEO["/neighborhoods"]!
      : STATIC_SEO["/neighborhoods"];
  }

  // /directory/category/:slug
  const dirCatMatch = path.match(/^\/directory\/category\/([^/]+)$/);
  if (dirCatMatch) {
    const slug = safeDecodeURIComponent(dirCatMatch[1]);
    const category = SERVICE_CATEGORIES.find(c => c.id === slug);
    if (category) {
      const localizedName = SERVICE_CATEGORY_LABELS[category.id][locale];
      return {
        title: `${localizedName} in Charlotte`.replace(" in Charlotte", locale === "es" ? " en Charlotte" : " in Charlotte"),
        description:
          locale === "es"
            ? `Explora ${localizedName} en Charlotte y consulta perfiles, detalles e información local.`
            : `Explore ${localizedName} in Charlotte with profiles, details, and local information.`,
      };
    }
  }

  // /events/category/:categoryId
  const evtCatMatch = path.match(/^\/events\/category\/([^/]+)$/);
  if (evtCatMatch) {
    const catId = safeDecodeURIComponent(evtCatMatch[1]);
    const category = EVENT_CATEGORIES.find(c => c.id === catId);
    if (category) {
      const localizedName =
        locale === "es"
          ? EVENT_CATEGORY_LABELS[catId as EventCategoryId].es
          : category.name;
      return {
        title:
          locale === "es"
            ? `${localizedName} en Charlotte`
            : `${localizedName} in Charlotte`,
        description:
          locale === "es"
            ? `Eventos de ${localizedName.toLowerCase()} en Charlotte — fechas, lugares y detalles.`
            : `${localizedName} events across Charlotte — dates, venues, and details.`,
      };
    }
  }

  // /directory/:slug — business detail
  const bizMatch = path.match(/^\/directory\/([^/]+)$/);
  if (bizMatch) {
    const slug = safeDecodeURIComponent(bizMatch[1]);
    const business = SERVICES.find(s => toSlug(s.name) === slug);
    if (business) {
      return {
        title: `${business.name} — Charlotte`,
        description:
          locale === "es"
            ? `${business.name} en Charlotte — reseñas, detalles e información local en Settle CLT.`
            : `${business.name} in Charlotte — reviews, details, and neighborhood info on Settle CLT.`,
      };
    }
  }

  // /blog/:slug — database-backed; middleware resolves the title and
  // passes it via blogTitles before calling the sync resolver. A valid blog
  // route always receives blog-family fallback metadata when enrichment is
  // missing or the segment cannot be decoded.
  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const slug = safeDecodeURIComponent(blogMatch[1]);
    const postTitle = slug ? blogTitles?.get(slug) : undefined;
    if (postTitle) {
      return {
        title: postTitle,
        description:
          locale === "es"
            ? "Lee esta guía de Settle CLT sobre vivir en Charlotte."
            : "Read this Settle CLT guide to living in Charlotte.",
      };
    }
    return locale === "es" ? SPANISH_SEO["/blog"]! : STATIC_SEO["/blog"];
  }

  return { title: HOME_TITLE, description: HOME_DESCRIPTION };
}
