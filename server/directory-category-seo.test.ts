import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SERVICE_CATEGORIES, SERVICES } from "../shared/services";
import { resolveRouteSeo } from "./_core/route-seo";

describe("Directory category SEO pages", () => {
  it("has service data for priority SEO categories", () => {
    const priority = ["moving-companies", "plumbers", "electricians", "hvac", "roofing"];
    for (const slug of priority) {
      expect(SERVICE_CATEGORIES.some(category => category.id === slug)).toBe(true);
      expect(SERVICES.filter(service => service.category === slug).length).toBeGreaterThan(0);
    }
  });

  it("registers clean directory category route before business detail route", () => {
    const app = readFileSync("client/src/App.tsx", "utf8");
    const categoryRoute = app.indexOf('path="/directory/category/:slug"');
    const businessRoute = app.indexOf('path="/directory/:slug"');
    expect(categoryRoute).toBeGreaterThan(-1);
    expect(businessRoute).toBeGreaterThan(-1);
    expect(categoryRoute).toBeLessThan(businessRoute);
  });

  it("publishes clean category URLs in the sitemap", () => {
    const server = readFileSync("server/_core/index.ts", "utf8");
    expect(server).toContain("/directory/category/${cat}");
    expect(server).not.toContain("/directory?category=${cat}");
  });

  it("renders SEO copy and owner monetization CTA on category pages", () => {
    const page = readFileSync("client/src/pages/DirectoryCategory.tsx", "utf8");
    expect(page).toContain("CATEGORY_SEO_COPY");
    expect(page).toContain("moving-companies");
    expect(page).toContain("plumbers");
    expect(page).toContain('t("directoryCategory.pricing")');
    expect(page).toContain('t("directoryCategory.claimDescription")');
  });

  it("localizes application-owned Spanish category labels and template without changing the canonical category id", () => {
    const path = "/directory/category/moving-companies";
    const english = resolveRouteSeo(path, undefined, "en");
    const spanish = resolveRouteSeo(path, undefined, "es");

    expect(english.title).toBe("Moving Companies in Charlotte");
    expect(spanish.title).toBe("Empresas de mudanzas en Charlotte");
    expect(spanish.description).toContain("Empresas de mudanzas");
    expect(spanish.title).not.toContain("Moving Companies");
    expect(path).toContain("moving-companies");
  });
});
