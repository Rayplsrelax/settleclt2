/**
 * Format a date as compact, locale-aware relative time.
 */
export function formatDistanceToNow(
  date: Date,
  locale: Intl.LocalesArgument = "en"
): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const language = new Intl.Locale(
    Array.isArray(locale) ? (locale[0] ?? "en") : locale
  ).language;
  const relative = new Intl.RelativeTimeFormat(locale, {
    numeric: "always",
    style: "narrow",
  });

  if (diffSec < 60) return language === "es" ? "ahora" : "just now";
  if (diffMin < 60) return relative.format(-diffMin, "minute");
  if (diffHr < 24) return relative.format(-diffHr, "hour");
  if (diffDay < 7) return relative.format(-diffDay, "day");
  if (diffWeek < 5) return relative.format(-diffWeek, "week");
  if (diffMonth < 12) return relative.format(-diffMonth, "month");
  return date.toLocaleDateString(locale);
}
