import { useEffect } from "react";

const SITE_NAME = "Settle CLT";
const DEFAULT_OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/settle-clt-og-image-2rmCExERPkQkkG8w9YarRQ.png";
const SITE_URL = "https://settleclt.com";

interface SEOOptions {
  /** Page title — will be appended with " | Settle CLT" unless noSuffix is true */
  title: string;
  /** Meta description (50-160 chars recommended) */
  description: string;
  /** Comma-separated keywords */
  keywords?: string;
  /** Canonical path, e.g. "/directory" — full URL is built automatically */
  path?: string;
  /** OG image URL — defaults to Charlotte skyline hero */
  ogImage?: string;
  /** OG type — defaults to "website" */
  ogType?: string;
  /** If true, don't append " | Settle CLT" to the title */
  noSuffix?: boolean;
  /** JSON-LD structured data object — will be injected as a script tag */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function setMeta(attr: string, key: string, content: string) {
  let el = document.querySelector(
    `meta[${attr}="${key}"]`
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(
    `link[rel="${rel}"]`
  ) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

const JSON_LD_ID = "settle-clt-jsonld";

function setJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  let el = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = JSON_LD_ID;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  const el = document.getElementById(JSON_LD_ID);
  if (el) el.remove();
}

export function useSEO({
  title,
  description,
  keywords,
  path,
  ogImage,
  ogType = "website",
  noSuffix = false,
  jsonLd,
}: SEOOptions) {
  useEffect(() => {
    const fullTitle = noSuffix ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    // Standard meta
    setMeta("name", "description", description);
    if (keywords) {
      setMeta("name", "keywords", keywords);
    }

    // Open Graph
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", ogImage || DEFAULT_OG_IMAGE);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:site_name", SITE_NAME);
    if (path) {
      const canonicalUrl = `${SITE_URL}${path}`;
      setMeta("property", "og:url", canonicalUrl);
      setLink("canonical", canonicalUrl);
    }

    // Twitter Card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage || DEFAULT_OG_IMAGE);

    // JSON-LD Structured Data
    if (jsonLd) {
      setJsonLd(jsonLd);
    }

    return () => {
      document.title = SITE_NAME;
      removeJsonLd();
    };
  }, [title, description, keywords, path, ogImage, ogType, noSuffix, jsonLd]);
}

/** Helper to build a BreadcrumbList JSON-LD object */
export function buildBreadcrumbs(
  items: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
