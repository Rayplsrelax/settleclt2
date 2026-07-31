import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const consent = fs.readFileSync(
  path.join(root, "client/src/components/CookieConsent.tsx"),
  "utf8"
);
const main = fs.readFileSync(path.join(root, "client/src/main.tsx"), "utf8");
const mixpanel = fs.readFileSync(
  path.join(root, "client/src/lib/mixpanel.ts"),
  "utf8"
);
const index = fs.readFileSync(path.join(root, "client/index.html"), "utf8");

describe("analytics consent contracts", () => {
  it("does not initialize Mixpanel unconditionally at application boot", () => {
    expect(main).not.toContain("initMixpanel();");
    expect(consent).toContain("enableAnalytics");
  });

  it("gates Mixpanel operations on accepted consent", () => {
    expect(mixpanel).toContain("localStorage.getItem(ANALYTICS_CONSENT_KEY)");
    expect(mixpanel).toContain('!== "accepted"');
  });

  it("does not load Umami until consent is accepted", () => {
    expect(index).not.toContain("/umami");
    expect(consent).toContain("loadUmami");
  });
});
