import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Phase 1: Launch Blockers", () => {
  describe("Sitemap URL fixes", () => {
    const serverIndex = readFileSync(resolve(__dirname, "_core/index.ts"), "utf-8");

    it("should use /privacy instead of /privacy-policy in sitemap", () => {
      expect(serverIndex).toContain('loc: "/privacy"');
      expect(serverIndex).not.toContain('loc: "/privacy-policy"');
    });

    it("should use /terms instead of /terms-of-service in sitemap", () => {
      expect(serverIndex).toContain('loc: "/terms"');
      expect(serverIndex).not.toContain('loc: "/terms-of-service"');
    });

    it("should include /contact in sitemap", () => {
      expect(serverIndex).toContain('loc: "/contact"');
    });
  });

  describe("Meta tags and OG image", () => {
    const indexHtml = readFileSync(resolve(__dirname, "../client/index.html"), "utf-8");

    it("should have meta description with 700+ businesses", () => {
      expect(indexHtml).toContain("700+ local businesses");
      expect(indexHtml).not.toContain("400+ local businesses");
    });

    it("should have og:image meta tag", () => {
      expect(indexHtml).toContain('property="og:image"');
    });

    it("should have og:image:width and og:image:height", () => {
      expect(indexHtml).toContain('property="og:image:width"');
      expect(indexHtml).toContain('property="og:image:height"');
    });

    it("should have twitter:image meta tag", () => {
      expect(indexHtml).toContain('name="twitter:image"');
    });

    it("should have favicon link tags", () => {
      expect(indexHtml).toContain('rel="icon"');
      expect(indexHtml).toContain('rel="apple-touch-icon"');
    });

    it("should have og:description with 700+ businesses", () => {
      expect(indexHtml).toContain("700+ local businesses");
    });
  });

  describe("Broken admin link fix", () => {
    const adminClaims = readFileSync(resolve(__dirname, "../client/src/pages/AdminClaims.tsx"), "utf-8");

    it("should link to /admin/enrich instead of /admin", () => {
      expect(adminClaims).toContain('href="/admin/enrich"');
      expect(adminClaims).not.toContain('href="/admin"');
    });
  });
});

describe("Phase 2: Compliance & Trust", () => {
  describe("Cookie consent banner", () => {
    const cookieConsent = readFileSync(resolve(__dirname, "../client/src/components/CookieConsent.tsx"), "utf-8");
    const appTsx = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf-8");

    it("should have a CookieConsent component", () => {
      expect(cookieConsent).toContain("settle-clt-cookie-consent");
    });

    it("should have Accept All and Decline buttons", () => {
      expect(cookieConsent).toContain("Accept All");
      expect(cookieConsent).toContain("Decline");
    });

    it("should link to privacy policy", () => {
      expect(cookieConsent).toContain('href="/privacy"');
    });

    it("should use localStorage for consent state", () => {
      expect(cookieConsent).toContain("localStorage.getItem");
      expect(cookieConsent).toContain("localStorage.setItem");
    });

    it("should disable analytics when declined", () => {
      expect(cookieConsent).toContain("umami.disabled");
    });

    it("should be included in App.tsx", () => {
      expect(appTsx).toContain("CookieConsent");
    });
  });

  describe("Account deletion", () => {
    const profile = readFileSync(resolve(__dirname, "../client/src/pages/Profile.tsx"), "utf-8");
    const routers = readFileSync(resolve(__dirname, "routers.ts"), "utf-8");
    const dbFile = readFileSync(resolve(__dirname, "db.ts"), "utf-8");

    it("should have deleteAccount procedure in auth router", () => {
      expect(routers).toContain("deleteAccount:");
      expect(routers).toContain('z.literal("DELETE MY ACCOUNT")');
    });

    it("should have deleteUserAccount function in db.ts", () => {
      expect(dbFile).toContain("deleteUserAccount");
    });

    it("should delete data from all user-related tables", () => {
      // Check that all user data tables are cleaned up
      expect(dbFile).toContain("delete(commentVotes)");
      expect(dbFile).toContain("delete(comments)");
      expect(dbFile).toContain("delete(passportEntries)");
      expect(dbFile).toContain("delete(bingoProgress)");
      expect(dbFile).toContain("delete(wishlists)");
      expect(dbFile).toContain("delete(reviews)");
      expect(dbFile).toContain("delete(userTagPreferences)");
      expect(dbFile).toContain("delete(searchQueries)");
      expect(dbFile).toContain("delete(users)");
    });

    it("should anonymize events and claims instead of deleting", () => {
      expect(dbFile).toContain("update(events)");
      expect(dbFile).toContain("update(businessClaims)");
    });

    it("should have DeleteAccountSection in Profile page", () => {
      expect(profile).toContain("DeleteAccountSection");
      expect(profile).toContain("DELETE MY ACCOUNT");
    });

    it("should require confirmation text to delete", () => {
      expect(profile).toContain('confirmText !== "DELETE MY ACCOUNT"');
    });

    it("should show warning about permanent deletion", () => {
      expect(profile).toContain("permanently delete");
      expect(profile).toContain("cannot be undone");
    });
  });

  describe("Contact page", () => {
    const contact = readFileSync(resolve(__dirname, "../client/src/pages/Contact.tsx"), "utf-8");
    const appTsx = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf-8");

    it("should have a Contact page component", () => {
      expect(contact).toContain("Contact");
      expect(contact).toContain("Get in Touch");
    });

    it("should have name, email, subject, and message fields", () => {
      expect(contact).toContain("setName");
      expect(contact).toContain("setEmail");
      expect(contact).toContain("setSubject");
      expect(contact).toContain("setMessage");
    });

    it("should use notifyOwner to send contact form submissions", () => {
      expect(contact).toContain("system.notifyOwner");
    });

    it("should show success state after submission", () => {
      expect(contact).toContain("Message Sent!");
    });

    it("should include contact email", () => {
      expect(contact).toContain("hello@settleclt.com");
    });

    it("should have route registered in App.tsx", () => {
      expect(appTsx).toContain('path="/contact"');
    });
  });

  describe("Footer links", () => {
    const footer = readFileSync(resolve(__dirname, "../client/src/components/Footer.tsx"), "utf-8");

    it("should have Find Your Home link", () => {
      expect(footer).toContain('href="/find-your-home"');
    });

    it("should have Contact Us link", () => {
      expect(footer).toContain('href="/contact"');
    });

    it("should have Privacy Policy link", () => {
      expect(footer).toContain('href="/privacy"');
    });

    it("should have Terms of Service link", () => {
      expect(footer).toContain('href="/terms"');
    });
  });
});
