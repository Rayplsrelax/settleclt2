import type { Locale } from "@shared/i18n";

const LANGUAGE_TAGS: Record<Locale, string> = {
  en: "en-US",
  es: "es-US",
};

export function localeToLanguageTag(locale: Locale): string {
  return LANGUAGE_TAGS[locale];
}

export function formatLocalizedDate(
  value: Date | string | number,
  locale: Locale,
  options: Intl.DateTimeFormatOptions
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(localeToLanguageTag(locale), options).format(
    date
  );
}

export function formatLocalizedCurrency(
  value: number,
  locale: Locale
): string {
  return new Intl.NumberFormat(localeToLanguageTag(locale), {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatLocalizedWholeCurrency(
  value: number,
  locale: Locale
): string {
  return new Intl.NumberFormat(localeToLanguageTag(locale), {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function parseLocalDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
