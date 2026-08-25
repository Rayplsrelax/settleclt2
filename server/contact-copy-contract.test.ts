import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { en } from "../client/src/i18n/locales/en";
import { es } from "../client/src/i18n/locales/es";
import type { Locale } from "../shared/i18n";

const probe = vi.hoisted(() => ({ locale: "en" as Locale }));
vi.mock("@/i18n/I18nContext", () => ({
  useI18n: () => ({
    locale: probe.locale,
    setLocale: vi.fn(),
    t: (key: keyof typeof en) => (probe.locale === "es" ? es[key] : en[key]) ?? en[key] ?? key,
  }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: { contact: { submit: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } } },
}));
vi.mock("@/hooks/useSEO", () => ({ useSEO: vi.fn() }));
vi.mock("@/components/Navbar", () => ({ default: () => React.createElement("nav") }));
vi.mock("@/components/Footer", () => ({ default: () => React.createElement("footer") }));

import Contact from "../client/src/pages/Contact";

const source = readFileSync(new URL("../client/src/pages/Contact.tsx", import.meta.url), "utf8");
const forbiddenPromise = /24\s*[-–]\s*48|\bsoon\b|\bpronto\b|\bdeliver(?:ed|y)?\b|\bentreg(?:a|ado|ada|ados|adas)\b|response time|tiempo de respuesta/i;

describe("neutral contact receipt and delivery copy", () => {
  it("keeps every EN/ES success and delivery acknowledgement free of response-time promises", () => {
    const copy = [
      en["contact.responseTimeValue"],
      en["contact.sentTitle"],
      en["contact.sentDescription"],
      en["contact.toastSuccess"],
      es["contact.responseTimeValue"],
      es["contact.sentTitle"],
      es["contact.sentDescription"],
      es["contact.toastSuccess"],
    ];

    for (const value of copy) {
      expect(value).not.toMatch(forbiddenPromise);
      expect(value).toMatch(/receiv|accept|recibid|acept/i);
    }
  });

  it("renders the neutral delivery acknowledgement in EN and ES and sources success from localized keys", () => {
    expect(source).toContain('t("contact.sentDescription")');
    expect(source).toContain('toast.success(t("contact.toastSuccess"))');
    expect(source).not.toMatch(forbiddenPromise);

    for (const locale of ["en", "es"] as const) {
      probe.locale = locale;
      const markup = renderToStaticMarkup(React.createElement(Contact));
      expect(markup).toContain(locale === "en" ? "Request receipt" : "Recepción de la solicitud");
      expect(markup).toContain(locale === "en"
        ? "Successful submissions are accepted for review."
        : "Las solicitudes enviadas correctamente se aceptan para revisión.");
      expect(markup).not.toMatch(forbiddenPromise);
    }
  });
});