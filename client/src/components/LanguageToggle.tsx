import { Languages } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

/**
 * Language toggle for the site navbar. Shows the other available language
 * (EN <-> ES) — clicking switches the whole UI chrome immediately.
 */
export default function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "es" : "en")}
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label={
        locale === "en" ? t("language.toggle") : t("language.toggleEn")
      }
      title={locale === "en" ? "Switch to Spanish" : "Cambiar a inglés"}
    >
      <Languages className="w-4 h-4" />
      <span className="hidden sm:inline">
        {locale === "en" ? t("language.toggle") : t("language.toggleEn")}
      </span>
    </button>
  );
}
