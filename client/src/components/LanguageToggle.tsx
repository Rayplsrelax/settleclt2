import { Languages } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Accessible language setting for the site navbar. The trigger shows the
 * active language and the menu exposes every supported locale explicitly.
 */
export default function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const activeLabel =
    locale === "es" ? t("language.spanish") : t("language.english");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("language.choose")}
          title={t("language.current", { language: activeLabel })}
          className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Languages className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{activeLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("language.choose")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={value => {
            if (value === "en" || value === "es") setLocale(value);
          }}
        >
          <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="es">Español</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
