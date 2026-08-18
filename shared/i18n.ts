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

/** Decode a persisted locale without allowing a malformed cookie to abort UI startup. */
export function decodeLocaleCookieValue(
  encodedValue: string | null | undefined
): string | null {
  if (!encodedValue) return null;
  try {
    const decoded = decodeURIComponent(encodedValue).trim();
    return decoded || null;
  } catch {
    return null;
  }
}

/**
 * Resolve the initial locale without overriding an explicit user selection.
 * Browser preferences are considered in order only when no cookie is present.
 */
export function resolveInitialLocale(
  explicitLocale: string | null | undefined,
  browserLanguages: readonly string[] = []
): Locale {
  if (explicitLocale) return normalizeLocale(explicitLocale);

  for (const candidate of browserLanguages) {
    const primary = candidate.trim().toLowerCase().split(/[-_]/)[0];
    if ((locales as readonly string[]).includes(primary)) {
      return primary as Locale;
    }
  }

  return DEFAULT_LOCALE;
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
