import { createContext, useContext, useEffect, useState } from "react";
import {
  type Locale,
  LOCALE_COOKIE,
  locales,
  resolveInitialLocale,
  setLocaleCookie,
} from "@shared/i18n";
import { en, type TranslationKey } from "./locales/en";
import { es } from "./locales/es";

const dictionaries: Record<Locale, Record<string, string>> = { en, es };

interface I18nContextType {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => undefined,
  t: key => key,
});

function detectInitialLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`)
  );
  const browserLanguages =
    navigator.languages?.length > 0
      ? navigator.languages
      : [navigator.language];
  return resolveInitialLocale(
    match ? decodeURIComponent(match[1]) : null,
    browserLanguages
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    setLocaleCookie(next);
  };

  const t = (
    key: TranslationKey,
    vars?: Record<string, string | number>
  ) => {
    let value: string =
      dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
    if (vars) {
      for (const [name, substitution] of Object.entries(vars)) {
        value = value.split(`{${name}}`).join(String(substitution));
      }
    }
    return value;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { locales };
