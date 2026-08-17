export type Locale = "en" | "es";

export const locales: Locale[] = ["en", "es"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "site_locale";

/**
 * Accepts any stored/header value and reduces it to a supported locale,
 * falling back to English for anything unrecognized. "es-MX" style tags
 * resolve to "es".
 */
export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const primary = value.trim().toLowerCase().split(/[-_]/)[0];
  return (locales as string[]).includes(primary)
    ? (primary as Locale)
    : DEFAULT_LOCALE;
}

/**
 * Cookie so the server can read the locale on later requests (SEO, future
 * server-rendered strings). 400-day cap per RFC 6265 bis.
 */
export function setLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${400 * 24 * 60 * 60}; samesite=lax`;
}

export function localeDisplayName(locale: Locale): string {
  switch (locale) {
    case "es":
      return "Español";
    default:
      return "English";
  }
}
