import { useEffect } from "react";

const SITE_NAME = "Settle CLT";
const DEFAULT_OG_IMAGE =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663270161707/YJZXYMWOczYLllKW.jpg";
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

export function useSEO({
  title,
  description,
  keywords,
  path,
  ogImage,
  ogType = "website",
  noSuffix = false,
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
    // Always set canonical — use provided path or fall back to current pathname
    const canonicalPath = path ?? window.location.pathname;
    const canonicalUrl = `${SITE_URL}${canonicalPath}`;
    setMeta("property", "og:url", canonicalUrl);
    setLink("canonical", canonicalUrl);

    // Twitter Card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage || DEFAULT_OG_IMAGE);

    return () => {
      document.title = SITE_NAME;
    };
  }, [title, description, keywords, path, ogImage, ogType, noSuffix]);
}
