import { useEffect } from "react";

const STRUCTURED_DATA_ID = "settle-clt-jsonld";

/**
 * Injects JSON-LD structured data into the page <head>.
 * Removes previous injection on unmount or when data changes.
 */
export function useStructuredData(data: Record<string, unknown> | Record<string, unknown>[] | null) {
  useEffect(() => {
    if (!data) return;

    // Remove any existing structured data injected by this hook
    const existing = document.getElementById(STRUCTURED_DATA_ID);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = STRUCTURED_DATA_ID;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(
      Array.isArray(data) ? data : { "@context": "https://schema.org", ...data }
    );
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(STRUCTURED_DATA_ID);
      if (el) el.remove();
    };
  }, [JSON.stringify(data)]);
}

/** Helper to build Organization schema for Settle CLT */
export function buildOrganizationSchema() {
  return {
    "@type": "Organization",
    name: "Settle CLT",
    url: "https://settleclt.com",
    logo: "https://settleclt.com/favicon.ico",
    description:
      "Your complete guide to living in Charlotte, NC. Explore neighborhoods, discover local businesses, find events, and get honest advice.",
    areaServed: {
      "@type": "City",
      name: "Charlotte",
      addressRegion: "NC",
      addressCountry: "US",
    },
    sameAs: [],
  };
}

/** Helper to build LocalBusiness schema */
export function buildLocalBusinessSchema(biz: {
  name: string;
  description: string;
  phone: string;
  website: string;
  area: string;
  category: string;
}) {
  return {
    "@type": "LocalBusiness",
    name: biz.name,
    description: biz.description,
    telephone: biz.phone,
    url: biz.website,
    address: {
      "@type": "PostalAddress",
      addressLocality: biz.area || "Charlotte",
      addressRegion: "NC",
      addressCountry: "US",
    },
    areaServed: {
      "@type": "City",
      name: "Charlotte",
      addressRegion: "NC",
    },
  };
}

/** Helper to build Event schema */
export function buildEventSchema(event: {
  title: string;
  description?: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  venueName?: string | null;
  venueAddress?: string | null;
  externalUrl?: string | null;
  imageUrl?: string | null;
}) {
  const schema: Record<string, unknown> = {
    "@type": "Event",
    name: event.title,
    startDate: new Date(event.startDate).toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
  };
  if (event.description) schema.description = event.description;
  if (event.endDate) schema.endDate = new Date(event.endDate).toISOString();
  if (event.imageUrl) schema.image = event.imageUrl;
  if (event.externalUrl) schema.url = event.externalUrl;
  if (event.venueName) {
    schema.location = {
      "@type": "Place",
      name: event.venueName,
      ...(event.venueAddress
        ? {
            address: {
              "@type": "PostalAddress",
              streetAddress: event.venueAddress,
              addressLocality: "Charlotte",
              addressRegion: "NC",
              addressCountry: "US",
            },
          }
        : {}),
    };
  }
  return schema;
}

/** Helper to build Article/BlogPosting schema */
export function buildArticleSchema(article: {
  title: string;
  description: string;
  slug: string;
  publishedAt?: string | Date;
  imageUrl?: string;
  authorName?: string;
}) {
  return {
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: `https://settleclt.com/blog/${article.slug}`,
    ...(article.publishedAt
      ? { datePublished: new Date(article.publishedAt).toISOString() }
      : {}),
    ...(article.imageUrl ? { image: article.imageUrl } : {}),
    author: {
      "@type": "Organization",
      name: article.authorName || "Settle CLT",
    },
    publisher: {
      "@type": "Organization",
      name: "Settle CLT",
      url: "https://settleclt.com",
    },
  };
}

/** Helper to build BreadcrumbList schema */
export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
