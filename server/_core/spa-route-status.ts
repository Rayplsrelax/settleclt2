import { allNeighborhoods } from "../../shared/neighborhoods";
import { SERVICES, SERVICE_CATEGORIES } from "../../shared/services";
import { EVENT_CATEGORIES, SEED_EVENTS } from "../../shared/events";

export interface RouteLookups {
  blogExists: (slug: string) => Promise<boolean>;
  tagExists: (slug: string) => Promise<boolean>;
}

const STATIC_ROUTES = new Set([
  "/",
  "/neighborhoods",
  "/directory",
  "/blog",
  "/list-your-business",
  "/business-pricing",
  "/compare",
  "/quiz",
  "/profile",
  "/passport",
  "/wishlist",
  "/bingo",
  "/events",
  "/things-to-do",
  "/leaderboard",
  "/admin/enrich",
  "/admin/blog",
  "/admin/events",
  "/submit-event",
  "/admin/analytics",
  "/admin/revenue",
  "/admin/digest",
  "/admin/referrals",
  "/admin/claims",
  "/admin/submissions",
  "/my-business",
  "/find-your-home",
  "/find-a-realtor",
  "/privacy",
  "/terms",
  "/notifications",
  "/contact",
  "/404",
]);

const REDIRECT_ROUTES = new Set(["/find-a-realtor"]);

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function resolveSpaStatus(
  pathname: string,
  lookups?: RouteLookups
): Promise<number> {
  // Strip query/hash and trailing slash (except root)
  let path = pathname.split("?")[0].split("#")[0];
  if (path !== "/" && path.endsWith("/")) {
    path = path.replace(/\/+$/, "");
  }

  // Static assets — let Express static middleware handle them
  if (/\.\w+$/.test(path)) return 200;

  // API routes — not SPA routes
  if (path.startsWith("/api/")) return 200;

  if (STATIC_ROUTES.has(path)) {
    return REDIRECT_ROUTES.has(path) ? 301 : 200;
  }

  // /neighborhood/:id
  const neighborhoodMatch = path.match(/^\/neighborhood\/([^/]+)$/);
  if (neighborhoodMatch) {
    const id = decodeURIComponent(neighborhoodMatch[1]);
    return allNeighborhoods.some(n => n.id === id) ? 200 : 404;
  }

  // /directory/category/:slug
  const dirCatMatch = path.match(/^\/directory\/category\/([^/]+)$/);
  if (dirCatMatch) {
    const slug = decodeURIComponent(dirCatMatch[1]);
    return SERVICE_CATEGORIES.some(c => c.id === slug) ? 200 : 404;
  }

  // /events/category/:categoryId
  const evtCatMatch = path.match(/^\/events\/category\/([^/]+)$/);
  if (evtCatMatch) {
    const catId = decodeURIComponent(evtCatMatch[1]);
    return EVENT_CATEGORIES.some(c => c.id === catId) ? 200 : 404;
  }

  // /directory/:slug — business detail
  const bizMatch = path.match(/^\/directory\/([^/]+)$/);
  if (bizMatch) {
    const slug = decodeURIComponent(bizMatch[1]);
    return SERVICES.some(s => toSlug(s.name) === slug) ? 200 : 404;
  }

  // /blog/:slug — database-backed
  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const slug = decodeURIComponent(blogMatch[1]);
    if (!lookups) return 200; // optimistic when no DB
    return (await lookups.blogExists(slug)) ? 200 : 404;
  }

  // /tag/:slug — database-backed
  const tagMatch = path.match(/^\/tag\/([^/]+)$/);
  if (tagMatch) {
    const slug = decodeURIComponent(tagMatch[1]);
    if (!lookups) return 200; // optimistic when no DB
    return (await lookups.tagExists(slug)) ? 200 : 404;
  }

  // Unknown route
  return 404;
}

export async function getProductionLookups(): Promise<RouteLookups> {
  const { getBlogPostBySlug, getTagBySlug } = await import("../db");
  return {
    blogExists: async (slug: string) => {
      const post = await getBlogPostBySlug(slug);
      return Boolean(post);
    },
    tagExists: async (slug: string) => {
      try {
        const tag = await getTagBySlug(slug);
        return Boolean(tag);
      } catch {
        return false;
      }
    },
  };
}
