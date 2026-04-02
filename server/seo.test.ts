import { describe, it, expect } from "vitest";

describe("SEO Structured Data Helpers", () => {
  it("should have useStructuredData hook file", async () => {
    const fs = await import("fs");
    const hookPath = "./client/src/hooks/useStructuredData.ts";
    expect(fs.existsSync(hookPath)).toBe(true);
  });

  it("should export all schema builder functions", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./client/src/hooks/useStructuredData.ts", "utf-8")
    );
    expect(content).toContain("export function buildOrganizationSchema");
    expect(content).toContain("export function buildLocalBusinessSchema");
    expect(content).toContain("export function buildEventSchema");
    expect(content).toContain("export function buildArticleSchema");
    expect(content).toContain("export function buildBreadcrumbSchema");
    expect(content).toContain("export function useStructuredData");
  });

  it("buildBreadcrumbSchema should generate correct ListItem structure", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./client/src/hooks/useStructuredData.ts", "utf-8")
    );
    // Verify it creates BreadcrumbList type
    expect(content).toContain('"@type": "BreadcrumbList"');
    expect(content).toContain('"@type": "ListItem"');
    expect(content).toContain("position: i + 1");
  });

  it("buildOrganizationSchema should include Charlotte area info", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./client/src/hooks/useStructuredData.ts", "utf-8")
    );
    expect(content).toContain('"@type": "Organization"');
    expect(content).toContain('"@type": "City"');
    expect(content).toContain("Charlotte");
    expect(content).toContain("NC");
  });

  it("buildEventSchema should include required Event properties", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./client/src/hooks/useStructuredData.ts", "utf-8")
    );
    expect(content).toContain('"@type": "Event"');
    expect(content).toContain("startDate");
    expect(content).toContain("eventAttendanceMode");
    expect(content).toContain("eventStatus");
  });

  it("buildArticleSchema should include publisher info", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./client/src/hooks/useStructuredData.ts", "utf-8")
    );
    expect(content).toContain('"@type": "Article"');
    expect(content).toContain("headline");
    expect(content).toContain("publisher");
    expect(content).toContain("datePublished");
  });

  it("buildLocalBusinessSchema should include address structure", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./client/src/hooks/useStructuredData.ts", "utf-8")
    );
    expect(content).toContain('"@type": "LocalBusiness"');
    expect(content).toContain('"@type": "PostalAddress"');
    expect(content).toContain("addressLocality");
    expect(content).toContain("addressRegion");
  });
});

describe("Sitemap Enhancement", () => {
  it("should include directory category pages in sitemap config", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./server/_core/index.ts", "utf-8")
    );
    expect(content).toContain("directoryCategories");
    expect(content).toContain("restaurants");
    expect(content).toContain("breweries");
    expect(content).toContain("coffee-shops");
    expect(content).toContain("food-trucks");
  });

  it("should include privacy and terms pages in sitemap", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./server/_core/index.ts", "utf-8")
    );
    expect(content).toContain("/privacy-policy");
    expect(content).toContain("/terms-of-service");
  });

  it("should have all 42 directory categories in sitemap", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./server/_core/index.ts", "utf-8")
    );
    // Extract the directoryCategories array
    const match = content.match(/const directoryCategories = \[([\s\S]*?)\]/);
    expect(match).toBeTruthy();
    const categories = match![1].match(/"([^"]+)"/g);
    expect(categories).toBeTruthy();
    expect(categories!.length).toBe(42);
  });

  it("should generate XML for directory category URLs", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./server/_core/index.ts", "utf-8")
    );
    expect(content).toContain("directory?category=${cat}");
  });
});

describe("Structured Data Integration in Pages", () => {
  it("Home page should include Organization and Breadcrumb structured data", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./client/src/pages/Home.tsx", "utf-8")
    );
    expect(content).toContain("useStructuredData");
    expect(content).toContain("buildOrganizationSchema");
    expect(content).toContain("buildBreadcrumbSchema");
  });

  it("Events page should include Event structured data", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./client/src/pages/Events.tsx", "utf-8")
    );
    expect(content).toContain("useStructuredData");
    expect(content).toContain("buildEventSchema");
    expect(content).toContain("buildBreadcrumbSchema");
  });

  it("Directory page should include Breadcrumb structured data", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./client/src/pages/Directory.tsx", "utf-8")
    );
    expect(content).toContain("useStructuredData");
    expect(content).toContain("buildBreadcrumbSchema");
  });

  it("BlogArticle page should include Article structured data", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./client/src/pages/BlogArticle.tsx", "utf-8")
    );
    expect(content).toContain("useStructuredData");
    expect(content).toContain("buildArticleSchema");
    expect(content).toContain("buildBreadcrumbSchema");
  });

  it("NeighborhoodDetail page should include Breadcrumb structured data", async () => {
    const content = await import("fs").then((fs) =>
      fs.readFileSync("./client/src/pages/NeighborhoodDetail.tsx", "utf-8")
    );
    expect(content).toContain("useStructuredData");
    expect(content).toContain("buildBreadcrumbSchema");
  });
});
