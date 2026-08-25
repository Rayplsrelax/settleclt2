import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { en } from "../client/src/i18n/locales/en";
import { es } from "../client/src/i18n/locales/es";

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const pages = {
  home: source("../client/src/pages/Home.tsx"),
  neighborhoods: source("../client/src/pages/Neighborhoods.tsx"),
  directory: source("../client/src/pages/Directory.tsx"),
  blog: source("../client/src/pages/Blog.tsx"),
  blogArticle: source("../client/src/pages/BlogArticle.tsx"),
  events: source("../client/src/pages/Events.tsx"),
  neighborhoodDetail: source("../client/src/pages/NeighborhoodDetail.tsx"),
};

const requiredKeys = [
  "home.seoTitle",
  "home.seoDescription",
  "home.seoKeywords",
  "home.quizBadge",
  "home.quizPrompt",
  "home.quizDescription",
  "home.businessCtaTitle",
  "home.businessCtaDescription",
  "home.businessCtaButton",
  "neighborhoods.seoTitle",
  "neighborhoods.seoDescription",
  "neighborhoods.seoKeywords",
  "directory.seoTitle",
  "directory.seoDescription",
  "directory.seoKeywords",
  "directory.countsSubtitle",
  "directory.newBadge",
  "directory.growing",
  "directory.list",
  "directory.map",
  "directory.sortRecommended",
  "directory.filters",
  "directory.showingList",
  "directory.showingMap",
  "directory.visit",
  "directory.claim",
  "directory.searchPlaceholder",
  "directory.loadingMore",
  "directory.showingAll",
  "blog.seoTitle",
  "blog.seoDescription",
  "blog.seoKeywords",
  "blog.category.gettingStarted",
  "blog.category.costOfLiving",
  "blog.category.lifestyle",
  "blog.category.schools",
  "blog.category.transportation",
  "blog.category.relocation",
  "blog.category.pets",
  "blog.articleFallbackTitle",
  "blog.articleFallbackDescription",
  "blog.articleFallbackKeywords",
  "events.seoTitle",
  "events.seoDescription",
  "events.seoKeywords",
  "events.seoHeading",
  "events.seoParagraph1",
  "events.seoParagraph2",
  "events.dateRange",
  "events.recurringEvents",
  "events.newcomerFriendly",
  "events.promoted",
  "events.promotedEvent",
  "events.noMatching",
  "events.noEventsYet",
  "events.moreInfo",
  "neighborhoodDetail.radarWalk",
  "neighborhoodDetail.radarNightlife",
  "neighborhoodDetail.radarFamily",
  "neighborhoodDetail.radarPet",
  "neighborhoodDetail.radarSchools",
  "neighborhoodDetail.radarSafety",
  "neighborhoodDetail.avgRent",
  "neighborhoodDetail.homePrice",
  "neighborhoodDetail.walkScore",
  "neighborhoodDetail.toUptown",
  "neighborhoodDetail.schools",
  "neighborhoodDetail.crime",
  "neighborhoodDetail.nightlife",
  "neighborhoodDetail.petScore",
  "neighborhoodDetail.family",
] as const;

describe("final Spanish i18n residue pass", () => {
  it("defines non-empty, distinct Spanish application chrome at runtime", () => {
    for (const key of requiredKeys) {
      expect(en[key], `missing English ${key}`).toBeTruthy();
      expect(es[key], `missing Spanish ${key}`).toBeTruthy();
      expect(es[key], `Spanish must differ for ${key}`).not.toBe(en[key]);
    }
    expect(es["directory.countsSubtitle"]
      .replace("{businesses}", "713")
      .replace("{categories}", "54"))
      .toBe("713 negocios de Charlotte en 54 categorías");
  });

  it("keeps hydrated SEO locale-aware on all five audited landing routes", () => {
    for (const [name, text, prefix] of [
      ["home", pages.home, "home"],
      ["neighborhoods", pages.neighborhoods, "neighborhoods"],
      ["directory", pages.directory, "directory"],
      ["blog", pages.blog, "blog"],
      ["events", pages.events, "events"],
    ] as const) {
      expect(text, name).toContain(`title: t("${prefix}.seoTitle")`);
      expect(text, name).toContain(`description: t("${prefix}.seoDescription")`);
      expect(text, name).toContain(`keywords: t("${prefix}.seoKeywords")`);
    }
  });

  it("preserves authored BlogArticle metadata but localizes every fallback", () => {
    expect(pages.blogArticle).toContain('post?.title || t("blog.articleFallbackTitle")');
    expect(pages.blogArticle).toContain('post?.excerpt || t("blog.articleFallbackDescription")');
    expect(pages.blogArticle).toContain(': t("blog.articleFallbackKeywords")');
    expect(pages.blogArticle).toContain("title: post?.title");
    expect(pages.blogArticle).toContain("description: post?.excerpt");
  });

  it("maps canonical blog and event category IDs to translated display labels", () => {
    expect(pages.blog).toContain("getBlogCategoryLabel");
    expect(pages.blog).toContain("a.category");
    expect(pages.events).toContain("getCategoryLabel(event.category, t)");
    expect(pages.events).toContain("selectedEvent.title");
    expect(pages.events).toContain("selectedEvent.description");
  });

  it("removes confirmed literal application chrome without touching records", () => {
    for (const literal of [
      "Own a Charlotte Business?",
      "List Your Business — Free",
      "2-Minute Quiz",
      "Not sure where to live?",
    ]) expect(pages.home).not.toContain(`>${literal}<`);

    for (const literal of [
      "> List<",
      "> Map<",
      "Sort: Recommended",
      "> Claim<",
      ">Visit <",
      "businesses and growing",
    ]) expect(pages.directory).not.toContain(literal);

    for (const literal of [
      "Things to Do in Charlotte, NC This Week & Weekend",
      "Date Range",
      "Recurring Events",
      "Newcomer Friendly",
      "No matching events",
      "Get Tickets / More Info",
    ]) expect(pages.events).not.toContain(`>${literal}<`);

    for (const literal of [
      'stat: "Walk"',
      'stat: "Nightlife"',
      'label="Avg Rent"',
      'label="Home Price"',
      'label="Walk Score"',
      'label="To Uptown"',
      'label="Pet Score"',
    ]) expect(pages.neighborhoodDetail).not.toContain(literal);
  });
});
