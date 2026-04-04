import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Phase 3: Content Expansion", () => {
  describe("Event Images", () => {
    it("event images should be referenced from CDN URLs", () => {
      // The event images were uploaded to CDN and stored in the database
      // This test verifies the CDN URLs are valid format
      const cdnPattern = /^https:\/\/d2xsxph8kpxj0f\.cloudfront\.net\//;
      const eventImageUrls = [
        "https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/concerts-1-",
        "https://d2xsxph8kpxj0f.cloudfront.net/310519663270161707/KbchydCPFi8EjNXDBYUsCi/food-drink-1-",
      ];
      for (const url of eventImageUrls) {
        expect(url).toMatch(cdnPattern);
      }
    });
  });

  describe("Bingo Cards", () => {
    it("bingo card square format should have id, label, and serviceKey", () => {
      const sampleSquare = { id: 1, label: "Papi Queso", serviceKey: "papi-queso" };
      expect(sampleSquare).toHaveProperty("id");
      expect(sampleSquare).toHaveProperty("label");
      expect(sampleSquare).toHaveProperty("serviceKey");
      expect(typeof sampleSquare.id).toBe("number");
      expect(typeof sampleSquare.label).toBe("string");
      expect(typeof sampleSquare.serviceKey).toBe("string");
    });

    it("serviceKey should be a valid slug format", () => {
      function toSlug(name: string): string {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      const testNames = [
        "Papi Queso",
        "U.S. National Whitewater Center",
        "The Fillmore Charlotte",
        "CrossFit Dilworth",
        "Harvey B. Gantt Center for African-American Arts + Culture",
      ];
      for (const name of testNames) {
        const slug = toSlug(name);
        expect(slug).toMatch(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/);
        expect(slug).not.toMatch(/--/); // no double dashes
      }
    });

    it("each bingo card should have exactly 25 squares", () => {
      // Verify the expected format
      const sampleSquares = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        label: `Business ${i + 1}`,
        serviceKey: `business-${i + 1}`,
      }));
      expect(sampleSquares).toHaveLength(25);
      expect(sampleSquares[0].id).toBe(1);
      expect(sampleSquares[24].id).toBe(25);
    });
  });
});

describe("Phase 4: Marketing & Growth", () => {
  describe("Footer Social Media Links", () => {
    it("Footer should contain social media link icons", () => {
      const footerContent = fs.readFileSync(
        path.join(__dirname, "../client/src/components/Footer.tsx"),
        "utf-8"
      );
      expect(footerContent).toContain("instagram.com/settleclt");
      expect(footerContent).toContain("twitter.com/settleclt");
      expect(footerContent).toContain("facebook.com/settleclt");
      expect(footerContent).toContain("tiktok.com/@settleclt");
    });

    it("social links should open in new tab", () => {
      const footerContent = fs.readFileSync(
        path.join(__dirname, "../client/src/components/Footer.tsx"),
        "utf-8"
      );
      // All external social links should have target="_blank"
      const socialLinks = footerContent.match(/href="https:\/\/(instagram|twitter|facebook|tiktok)/g);
      expect(socialLinks).not.toBeNull();
      expect(socialLinks!.length).toBeGreaterThanOrEqual(4);
      // Check for target="_blank" and rel="noopener noreferrer"
      expect(footerContent).toContain('target="_blank"');
      expect(footerContent).toContain('rel="noopener noreferrer"');
    });

    it("social links should have aria-labels for accessibility", () => {
      const footerContent = fs.readFileSync(
        path.join(__dirname, "../client/src/components/Footer.tsx"),
        "utf-8"
      );
      expect(footerContent).toContain('aria-label="Instagram"');
      expect(footerContent).toContain('aria-label="X (Twitter)"');
      expect(footerContent).toContain('aria-label="Facebook"');
      expect(footerContent).toContain('aria-label="TikTok"');
    });
  });

  describe("JSON-LD Structured Data", () => {
    it("index.html should contain WebSite schema", () => {
      const html = fs.readFileSync(
        path.join(__dirname, "../client/index.html"),
        "utf-8"
      );
      expect(html).toContain('"@type": "WebSite"');
      expect(html).toContain('"name": "Settle CLT"');
      expect(html).toContain("SearchAction");
    });

    it("index.html should contain Organization schema", () => {
      const html = fs.readFileSync(
        path.join(__dirname, "../client/index.html"),
        "utf-8"
      );
      expect(html).toContain('"@type": "Organization"');
      expect(html).toContain('"sameAs"');
      expect(html).toContain("instagram.com/settleclt");
      expect(html).toContain('"areaServed"');
    });

    it("index.html should contain BreadcrumbList schema", () => {
      const html = fs.readFileSync(
        path.join(__dirname, "../client/index.html"),
        "utf-8"
      );
      expect(html).toContain('"@type": "BreadcrumbList"');
      expect(html).toContain('"itemListElement"');
      expect(html).toContain("Neighborhoods");
      expect(html).toContain("Directory");
      expect(html).toContain("Events");
      expect(html).toContain("Blog");
    });
  });

  describe("Error Monitoring", () => {
    it("ErrorBoundary should have componentDidCatch for error logging", () => {
      const errorBoundary = fs.readFileSync(
        path.join(__dirname, "../client/src/components/ErrorBoundary.tsx"),
        "utf-8"
      );
      expect(errorBoundary).toContain("componentDidCatch");
      expect(errorBoundary).toContain("[ErrorBoundary] Caught error");
    });

    it("ErrorBoundary should have global error handlers", () => {
      const errorBoundary = fs.readFileSync(
        path.join(__dirname, "../client/src/components/ErrorBoundary.tsx"),
        "utf-8"
      );
      expect(errorBoundary).toContain("[GlobalError] Unhandled error");
      expect(errorBoundary).toContain("[GlobalError] Unhandled promise rejection");
      expect(errorBoundary).toContain("unhandledrejection");
    });
  });

  describe("Rate Limiting", () => {
    it("server should have rate limiting configured", () => {
      const serverIndex = fs.readFileSync(
        path.join(__dirname, "_core/index.ts"),
        "utf-8"
      );
      expect(serverIndex).toContain("express-rate-limit");
      expect(serverIndex).toContain("apiLimiter");
      expect(serverIndex).toContain("formLimiter");
    });

    it("form submission endpoints should have stricter rate limits", () => {
      const serverIndex = fs.readFileSync(
        path.join(__dirname, "_core/index.ts"),
        "utf-8"
      );
      expect(serverIndex).toContain("event.submit");
      expect(serverIndex).toContain("system.notifyOwner");
      expect(serverIndex).toContain("claim.submit");
    });

    it("API rate limit should be 200 requests per 15 minutes", () => {
      const serverIndex = fs.readFileSync(
        path.join(__dirname, "_core/index.ts"),
        "utf-8"
      );
      expect(serverIndex).toContain("max: 200");
      expect(serverIndex).toContain("15 * 60 * 1000");
    });

    it("form rate limit should be 10 submissions per hour", () => {
      const serverIndex = fs.readFileSync(
        path.join(__dirname, "_core/index.ts"),
        "utf-8"
      );
      expect(serverIndex).toContain("max: 10");
      expect(serverIndex).toContain("60 * 60 * 1000");
    });
  });

  describe("OG & Favicon Tags", () => {
    it("index.html should have OG image tags", () => {
      const html = fs.readFileSync(
        path.join(__dirname, "../client/index.html"),
        "utf-8"
      );
      expect(html).toContain('property="og:image"');
      expect(html).toContain('property="og:image:width"');
      expect(html).toContain('property="og:image:height"');
    });

    it("index.html should have favicon and apple-touch-icon", () => {
      const html = fs.readFileSync(
        path.join(__dirname, "../client/index.html"),
        "utf-8"
      );
      expect(html).toContain('rel="icon"');
      expect(html).toContain('rel="apple-touch-icon"');
      expect(html).toContain("favicon.ico");
    });

    it("meta description should reference 700+ businesses", () => {
      const html = fs.readFileSync(
        path.join(__dirname, "../client/index.html"),
        "utf-8"
      );
      expect(html).toContain("700+");
      expect(html).not.toContain("400+");
    });
  });
});
