import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("SEO Improvements", () => {
  const indexHtml = readFileSync(join(__dirname, "../client/index.html"), "utf-8");

  describe("Meta tags", () => {
    it("has description under 160 characters", () => {
      const match = indexHtml.match(/<meta\s+name="description"\s+content="([^"]+)"/);
      expect(match).toBeTruthy();
      expect(match![1].length).toBeLessThanOrEqual(160);
      expect(match![1].length).toBeGreaterThanOrEqual(50);
    });

    it("has focused keywords (3-8)", () => {
      const match = indexHtml.match(/<meta\s+name="keywords"\s+content="([^"]+)"/);
      expect(match).toBeTruthy();
      const keywords = match![1].split(",").map(k => k.trim());
      expect(keywords.length).toBeGreaterThanOrEqual(3);
      expect(keywords.length).toBeLessThanOrEqual(8);
    });

    it("mentions 700+ businesses in description", () => {
      const match = indexHtml.match(/<meta\s+name="description"\s+content="([^"]+)"/);
      expect(match![1]).toContain("700+");
    });
  });

  describe("Open Graph tags", () => {
    it("has og:image tag", () => {
      expect(indexHtml).toContain('property="og:image"');
    });

    it("has og:description matching meta description length constraint", () => {
      const match = indexHtml.match(/<meta\s+property="og:description"\s+content="([^"]+)"/);
      expect(match).toBeTruthy();
      expect(match![1].length).toBeLessThanOrEqual(160);
    });
  });

  describe("Google Search Console", () => {
    it("has google-site-verification meta tag placeholder", () => {
      expect(indexHtml).toContain('name="google-site-verification"');
    });
  });

  describe("Canonical URL", () => {
    it("has canonical link tag", () => {
      expect(indexHtml).toContain('rel="canonical"');
      expect(indexHtml).toContain("https://settleclt.com");
    });
  });

  describe("Structured Data", () => {
    it("has Organization schema", () => {
      expect(indexHtml).toContain('"@type": "Organization"');
    });

    it("has BreadcrumbList schema", () => {
      expect(indexHtml).toContain('"@type": "BreadcrumbList"');
    });

    it("has WebSite schema with SearchAction", () => {
      expect(indexHtml).toContain('"@type": "WebSite"');
      expect(indexHtml).toContain('"@type": "SearchAction"');
    });
  });

  describe("Favicon and icons", () => {
    it("has favicon.ico link", () => {
      expect(indexHtml).toContain('href="/favicon.ico"');
    });

    it("has apple-touch-icon", () => {
      expect(indexHtml).toContain('rel="apple-touch-icon"');
    });
  });
});

describe("Page-level SEO - useSEO coverage", () => {
  const pages = [
    "Home.tsx", "Directory.tsx", "Events.tsx", "Blog.tsx",
    "Neighborhoods.tsx", "NeighborhoodDetail.tsx", "Quiz.tsx",
    "Leaderboard.tsx", "Contact.tsx", "SubmitEvent.tsx",
    "PrivacyPolicy.tsx", "TermsOfService.tsx", "FindRealtor.tsx",
  ];

  for (const page of pages) {
    it(`${page} uses useSEO hook`, () => {
      const content = readFileSync(join(__dirname, `../client/src/pages/${page}`), "utf-8");
      expect(content).toContain("useSEO");
    });
  }
});

describe("Alt text on images", () => {
  const pagesWithImages = [
    { file: "Home.tsx", expected: ["Charlotte NC skyline", "neighborhood in Charlotte NC"] },
    { file: "Neighborhoods.tsx", expected: ["Charlotte NC neighborhood"] },
    { file: "NeighborhoodDetail.tsx", expected: ["neighborhood in Charlotte NC"] },
    { file: "BusinessDetail.tsx", expected: ["Charlotte NC"] },
    { file: "Compare.tsx", expected: ["Charlotte NC neighborhood"] },
    { file: "Quiz.tsx", expected: ["Charlotte NC neighborhood quiz result"] },
    { file: "Events.tsx", expected: ["Charlotte NC event"] },
    { file: "Blog.tsx", expected: ["Settle CLT blog"] },
  ];

  for (const { file, expected } of pagesWithImages) {
    it(`${file} has descriptive alt text with location context`, () => {
      const content = readFileSync(join(__dirname, `../client/src/pages/${file}`), "utf-8");
      for (const keyword of expected) {
        expect(content).toContain(keyword);
      }
    });
  }
});
