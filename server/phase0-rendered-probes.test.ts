import { describe, expect, it } from "vitest";
import { en, type TranslationKey } from "../client/src/i18n/locales/en";
import { es } from "../client/src/i18n/locales/es";
import { formatActivityDescription } from "../client/src/i18n/activityLabels";
import { ASPECTS, getAspectLabel } from "../client/src/i18n/reviewLabels";
import {
  getServiceCategoryLabel,
  getServiceSuperGroupLabel,
} from "../client/src/i18n/serviceLabels";
import { SERVICE_CATEGORIES, SERVICE_SUPER_GROUPS } from "../shared/services";
import type { Locale } from "../shared/i18n";

function translator(locale: Locale) {
  const dictionary: Record<string, string> = locale === "es" ? es : en;
  return (key: TranslationKey, vars?: Record<string, string | number>) => {
    let value = dictionary[key] ?? key;
    for (const [name, replacement] of Object.entries(vars ?? {})) {
      value = value.split(`{${name}}`).join(String(replacement));
    }
    return value;
  };
}

describe("targeted EN/ES rendered probes", () => {
  it("renders localized neighborhood hydration metadata while preserving the authored name", () => {
    const vars = { name: "Dilworth", vibe: "Tree-lined and historic", bestFor: "Walkable living" };
    const english = translator("en")("neighborhoodDetail.seoDescription", vars);
    const spanish = translator("es")("neighborhoodDetail.seoDescription", vars);
    expect(english).toContain("Dilworth Charlotte NC");
    expect(spanish).toContain("Dilworth, Charlotte NC");
    expect(spanish).toContain("Consulta costos");
    expect(spanish).not.toBe(english);
  });

  it("renders known activity verbs in each locale and preserves authored entity names", () => {
    const activity = {
      type: "stamp",
      action: "attended",
      entityName: "Festival in the Park",
      description: "attended Festival in the Park",
    };
    expect(formatActivityDescription(activity, translator("en"))).toBe("attended Festival in the Park");
    expect(formatActivityDescription(activity, translator("es"))).toBe("asistió a Festival in the Park");
  });

  it("maps every canonical review aspect through localized labels", () => {
    for (const aspect of ASPECTS) {
      expect(getAspectLabel(aspect.value, translator("en"))).not.toBe("");
      expect(getAspectLabel(aspect.value, translator("es"))).not.toBe("");
    }
    expect(getAspectLabel("food", translator("es"))).toBe("Comida y restaurantes");
  });

  it("covers every canonical service ID with EN/ES display overlays", () => {
    for (const group of SERVICE_SUPER_GROUPS) {
      expect(getServiceSuperGroupLabel(group.id, "en")).not.toBe("");
      expect(getServiceSuperGroupLabel(group.id, "es")).not.toBe("");
    }
    for (const category of SERVICE_CATEGORIES) {
      expect(getServiceCategoryLabel(category.id, "en")).toBe(category.name);
      expect(getServiceCategoryLabel(category.id, "es")).not.toBe("");
    }
    expect(getServiceCategoryLabel("moving-companies", "es")).toBe("Empresas de mudanzas");
  });
});
