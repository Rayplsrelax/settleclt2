import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { en } from "../client/src/i18n/locales/en";
import { es } from "../client/src/i18n/locales/es";
import { formatDistanceToNow } from "../client/src/lib/timeUtils";

function source(name: string) {
  return readFileSync(
    new URL(`../client/src/pages/${name}.tsx`, import.meta.url),
    "utf8"
  );
}

function clientSource(path: string) {
  return readFileSync(new URL(`../client/src/${path}`, import.meta.url), "utf8");
}

const tagKeys = [
  "tag.seoTitle",
  "tag.seoDescription",
  "tag.fallbackTitle",
  "tag.fallbackDescription",
  "tag.notFound",
  "tag.notFoundDescription",
  "tag.browseEvents",
  "tag.back",
  "tag.items",
  "tag.itemSingular",
  "tag.empty",
  "tag.shareDescription",
  "tag.events",
  "tag.blogPosts",
  "tag.directoryListings",
  "tag.neighborhoods",
  "tag.categories.activity",
  "tag.categories.audience",
  "tag.categories.neighborhood",
] as const;

const routes = {
  TagPage: [
    "tag.notFound",
    "tag.browseEvents",
    "tag.back",
    "tag.items",
    "tag.empty",
  ],
  NewcomerPlan: [
    "newcomerPlan.title",
    "newcomerPlan.subtitle",
    "newcomerPlan.progressPlural",
    "newcomerPlan.completed",
    "newcomerPlan.markComplete",
  ],
  Notifications: [
    "notifications.title",
    "notifications.signIn",
    "notifications.inbox",
    "notifications.preferences",
    "notifications.markAllRead",
    "notifications.empty",
  ],
} as const;

const newcomerKeys = [
  "newcomerPlan.seoTitle",
  "newcomerPlan.seoDescription",
  "newcomerPlan.seoKeywords",
  "newcomerPlan.breadcrumbHome",
  "newcomerPlan.breadcrumbCurrent",
  "newcomerPlan.badge",
  "newcomerPlan.title",
  "newcomerPlan.subtitle",
  "newcomerPlan.progressSingular",
  "newcomerPlan.progressPlural",
  "newcomerPlan.progressHint",
  "newcomerPlan.progressAria",
  "newcomerPlan.step",
  "newcomerPlan.completed",
  "newcomerPlan.markComplete",
  "newcomerPlan.footerNote",
  "newcomerPlan.steps.quiz.stage",
  "newcomerPlan.steps.quiz.title",
  "newcomerPlan.steps.quiz.description",
  "newcomerPlan.steps.quiz.action",
  "newcomerPlan.steps.compare.stage",
  "newcomerPlan.steps.compare.title",
  "newcomerPlan.steps.compare.description",
  "newcomerPlan.steps.compare.action",
  "newcomerPlan.steps.services.stage",
  "newcomerPlan.steps.services.title",
  "newcomerPlan.steps.services.description",
  "newcomerPlan.steps.services.action",
  "newcomerPlan.steps.events.stage",
  "newcomerPlan.steps.events.title",
  "newcomerPlan.steps.events.description",
  "newcomerPlan.steps.events.action",
  "newcomerPlan.steps.passport.stage",
  "newcomerPlan.steps.passport.title",
  "newcomerPlan.steps.passport.description",
  "newcomerPlan.steps.passport.action",
] as const;

const notificationKeys = [
  "notifications.seoTitle",
  "notifications.seoDescription",
  "notifications.loading",
  "notifications.signInTitle",
  "notifications.signInDescription",
  "notifications.signIn",
  "notifications.backAria",
  "notifications.title",
  "notifications.unreadSingular",
  "notifications.unreadPlural",
  "notifications.allCaughtUp",
  "notifications.inbox",
  "notifications.preferences",
  "notifications.filterAll",
  "notifications.markAllRead",
  "notifications.listLoading",
  "notifications.empty",
  "notifications.emptyCategory",
  "notifications.deleteAria",
  "notifications.sourceLanguageFallback",
  "notifications.preferencesTitle",
  "notifications.preferencesDescription",
  "notifications.categoryHeader",
  "notifications.inAppHeader",
  "notifications.emailHeader",
  "notifications.pushHeader",
  "notifications.preferenceAria",
  "notifications.pushTitle",
  "notifications.pushUnsupported",
  "notifications.pushDenied",
  "notifications.pushEnabled",
  "notifications.pushDisabled",
  "notifications.pushLoading",
  "notifications.pushError",
  "notifications.disable",
  "notifications.enable",
  "notifications.retry",
  "notifications.pushPermissionNote",
  "notifications.categories.claim.label",
  "notifications.categories.claim.description",
  "notifications.categories.review.label",
  "notifications.categories.review.description",
  "notifications.categories.payment.label",
  "notifications.categories.payment.description",
  "notifications.categories.event.label",
  "notifications.categories.event.description",
  "notifications.categories.community.label",
  "notifications.categories.community.description",
  "notifications.categories.system.label",
  "notifications.categories.system.description",
] as const;

describe("personalized route i18n batch 5", () => {
  for (const [page, keys] of Object.entries(routes)) {
    it(`${page} wires translated route chrome`, () => {
      const pageSource = source(page);
      expect(pageSource).toContain("useI18n");
      for (const key of keys) expect(pageSource).toContain(`t("${key}"`);
    });
  }

  it("NewcomerPlan owns translated SEO, breadcrumbs, controls, counts, and every step field", () => {
    const pageSource = source("NewcomerPlan");
    for (const key of newcomerKeys) expect(pageSource).toContain(key);
    expect(pageSource).toContain("step.id");
    expect(pageSource).toContain("step.href");
  });

  it("TagPage owns every Tag key, omits English keywords in Spanish, and translates category and result type labels", () => {
    const pageSource = source("TagPage");
    for (const key of tagKeys) expect(pageSource).toContain(key);
    expect(pageSource).toContain('const { locale, t } = useI18n()');
    expect(pageSource).toMatch(/keywords:\s*locale === "en"/);
    expect(pageSource).toContain("TAG_CATEGORY_KEYS");
    expect(pageSource).toContain('season: "tag.categories.season"');
    expect(pageSource).toContain('"content-type": "tag.categories.contentType"');
    expect(pageSource).toContain(": tag.category}");
    expect(pageSource).toContain("{label}");
    expect(pageSource).not.toContain('{type.replace("-", " ")}');
  });

  it("tracks each resolved tag ID rather than suppressing later route IDs", () => {
    const pageSource = source("TagPage");
    expect(pageSource).toContain("trackedTagIdRef");
    expect(pageSource).toMatch(/trackedTagIdRef\.current\s*!==\s*tag\.id/);
    expect(pageSource).toContain("trackedTagIdRef.current = tag.id");
    expect(pageSource).not.toContain("useRef(false)");
  });

  it("Notifications owns translated chrome, accessibility, preferences, push, and category copy", () => {
    const pageSource = source("Notifications");
    for (const key of notificationKeys) expect(pageSource).toContain(key);
    expect(pageSource).toMatch(
      /formatDistanceToNow\(\s*new Date\(notif\.createdAt\),\s*locale\s*\)/
    );
    expect(pageSource).toContain("aria-pressed={!filterCategory}");
    expect(pageSource).toContain("aria-pressed={filterCategory === cat}");
  });

  it("keeps server-authored notification title and body as explicit source-language fallback", () => {
    const pageSource = source("Notifications");
    expect(pageSource).toContain("sourceLanguageTitle = notif.title");
    expect(pageSource).toContain("sourceLanguageBody = notif.body");
    expect(pageSource).toContain("notifications.sourceLanguageFallback");
    expect(pageSource).not.toMatch(/<span className="sr-only">\s*\{t\("notifications\.sourceLanguageFallback"\)\}/);
  });

  it("makes notification rows keyboard-operable and reveals delete controls on keyboard focus", () => {
    const pageSource = source("Notifications");
    expect(pageSource).toContain('type="button"');
    expect(pageSource).toContain('className="absolute inset-0 z-0');
    expect(pageSource).toContain("pointer-events-auto");
    expect(pageSource).toContain("group-focus-within:opacity-100");
    expect(pageSource).toContain("focus-visible:opacity-100");

    const bellSource = clientSource("components/NotificationBell.tsx");
    expect(bellSource).toContain('role="button"');
    expect(bellSource).toContain("tabIndex={0}");
    expect(bellSource).toContain('event.key === "Enter"');
  });

  it("passes the active locale to shared relative-time formatting in both notification surfaces", () => {
    for (const path of ["pages/Notifications.tsx", "components/NotificationBell.tsx"]) {
      const pageSource = clientSource(path);
      expect(pageSource).toContain("useI18n");
      expect(pageSource).toMatch(/formatDistanceToNow\(\s*new Date\(notif\.createdAt\),\s*locale\s*\)/);
    }
  });

  it("keeps operational push failures retryable and distinct from denied permission", () => {
    const hookSource = clientSource("hooks/usePushNotifications.ts");
    const pageSource = source("Notifications");
    expect(hookSource).toContain('type PushState =');
    expect(hookSource).toContain('"error"');
    expect(hookSource).toMatch(/Notification\.permission === "denied"\s*\?\s*"denied"\s*:\s*"error"/);
    expect(pageSource).toContain('pushState === "error"');
    expect(pageSource).toContain('t("notifications.pushError")');
    expect(pageSource).toContain('t("notifications.retry")');
    expect(pageSource).not.toMatch(/pushState === "error"\s*\|\|/);
  });

  it("ships non-empty parallel EN and ES values for every new key", () => {
    for (const key of [...tagKeys, ...newcomerKeys, ...notificationKeys]) {
      expect(en[key]).toBeTruthy();
      expect(es[key]).toBeTruthy();
      expect(es[key]).not.toBe(en[key]);
    }
  });
});

describe("locale-aware relative notification time", () => {
  afterEach(() => vi.useRealTimers());

  it("formats elapsed minutes in English and Spanish at runtime", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-21T16:00:00Z"));
    const date = new Date("2026-08-21T15:55:00Z");
    expect(formatDistanceToNow(date, "en")).toBe("5m ago");
    expect(formatDistanceToNow(date, "es")).toBe("hace 5 min");
  });

  it("localizes the immediate state", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-21T16:00:00Z"));
    expect(formatDistanceToNow(new Date("2026-08-21T15:59:50Z"), "en")).toBe(
      "just now"
    );
    expect(formatDistanceToNow(new Date("2026-08-21T15:59:50Z"), "es")).toBe(
      "ahora"
    );
  });
});
