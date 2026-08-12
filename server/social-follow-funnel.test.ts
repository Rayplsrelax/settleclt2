import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

describe("social follow funnel", () => {
  it("keeps the five approved profile URLs consistent across discovery surfaces", () => {
    const registry = read("client/src/lib/socialLinks.ts");
    const footer = read("client/src/components/Footer.tsx");
    const html = read("client/index.html");
    const structuredData = read("client/src/hooks/useStructuredData.ts");

    expect(footer).toContain("SocialFollowLinks");
    expect(registry).toContain("instagram.com/settleclt");
    expect(registry).toContain("tiktok.com/@settleclt");
    expect(registry).toContain("facebook.com/settleclt");
    expect(registry).toContain("x.com/settleclt");
    expect(registry).toContain("threads.net/@settleclt");
    expect(html).toContain("https://x.com/settleclt");
    expect(html).toContain("https://www.threads.net/@settleclt");
    expect(html).not.toContain("https://twitter.com/settleclt");
    expect(structuredData).toContain("SOCIAL_LINKS.map(link => link.href)");
  });

  it("uses accessible, safe external links", () => {
    const component = read("client/src/components/SocialFollowLinks.tsx");

    expect(component).toContain('target="_blank"');
    expect(component).toContain('rel="noopener noreferrer"');
    expect(component).toContain("aria-label=");
    expect(component).toContain("opens in a new tab");
  });

  it("invites newsletter subscribers to follow with PII-free analytics", () => {
    const home = read("client/src/pages/Home.tsx");
    const registry = read("client/src/lib/socialLinks.ts");
    const mixpanel = read("client/src/lib/mixpanel.ts");

    expect(home).toContain('surface="newsletter-success"');
    expect(home).toContain("Follow Settle CLT around Charlotte");
    expect(read("client/src/components/SocialFollowLinks.tsx")).toContain(
      "trackSocialFollowClick"
    );
    expect(mixpanel).toContain('trackEvent("Social Follow Click"');
    expect(mixpanel).toContain("platform: SocialPlatform");
    expect(mixpanel).toContain("surface: SocialFollowSurface");
    expect(mixpanel).not.toMatch(
      /Social Follow Click[\s\S]{0,200}(email|subscriber_email)/i
    );
  });
});
