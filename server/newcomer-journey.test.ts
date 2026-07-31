import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  NEWCOMER_PROGRESS_KEY,
  NEWCOMER_STEPS,
  buildNewcomerSteps,
  parseNewcomerProgress,
} from "../client/src/lib/newcomerJourney";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

describe("Phase 4 guided newcomer journey", () => {
  it("defines a focused five-step public journey with reusable deep links", () => {
    expect(NEWCOMER_PROGRESS_KEY).toBe("settle-clt-newcomer-progress-v1");
    expect(NEWCOMER_STEPS.map(step => step.href)).toEqual([
      "/quiz?source=newcomer-plan",
      "/compare?source=newcomer-plan",
      "/directory?group=moving-settling&source=newcomer-plan",
      "/events?source=newcomer-plan",
      "/passport?source=newcomer-plan",
    ]);
    expect(new Set(NEWCOMER_STEPS.map(step => step.id)).size).toBe(5);
  });

  it("preserves a quiz shortlist when deep-linking to compare", () => {
    expect(buildNewcomerSteps("south-end,noda,plaza-midwood")[1].href).toBe(
      "/compare?ids=south-end%2Cnoda%2Cplaza-midwood&source=newcomer-plan"
    );
    expect(buildNewcomerSteps("south-end,<script>,noda")[1].href).toBe(
      "/compare?ids=south-end%2Cnoda&source=newcomer-plan"
    );
  });

  it("parses only known locally stored progress IDs and survives invalid data", () => {
    expect(parseNewcomerProgress('["quiz","events","unknown"]')).toEqual([
      "quiz",
      "events",
    ]);
    expect(parseNewcomerProgress("not-json")).toEqual([]);
    expect(parseNewcomerProgress(null)).toEqual([]);
  });

  it("registers the public route, HTTP status, sitemap, SEO, analytics, and entry CTAs", () => {
    const app = read("client/src/App.tsx");
    const page = read("client/src/pages/NewcomerPlan.tsx");
    const home = read("client/src/pages/Home.tsx");
    const quiz = read("client/src/pages/Quiz.tsx");
    const mixpanel = read("client/src/lib/mixpanel.ts");
    const server = read("server/_core/index.ts");
    const spaRoutes = read("server/_core/spa-route-status.ts");

    expect(app).toContain('path="/newcomer-plan"');
    expect(spaRoutes).toContain('"/newcomer-plan"');
    expect(server).toContain('{ loc: "/newcomer-plan"');
    expect(page).toContain('path: "/newcomer-plan"');
    expect(page).toContain("buildBreadcrumbSchema");
    expect(page).toContain("localStorage.setItem(NEWCOMER_PROGRESS_KEY");
    expect(page).toContain("trackNewcomerJourneyAction");
    expect(home).toContain('href="/newcomer-plan?source=homepage"');
    expect(quiz).toContain("/newcomer-plan?source=quiz-results&ids=");
    expect(mixpanel).toContain('trackEvent("Newcomer Journey"');
  });
});
