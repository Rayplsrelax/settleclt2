import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PREMIUM_TIERS } from "./stripe-products";

describe("Business claim monetization funnel", () => {
  it("keeps Stripe premium tier pricing aligned with the public offer", () => {
    expect(PREMIUM_TIERS.featured.monthlyPrice).toBe(2900);
    expect(PREMIUM_TIERS.premium.monthlyPrice).toBe(7900);
    expect(PREMIUM_TIERS.featured.features).toContain("Priority placement in category");
    expect(PREMIUM_TIERS.premium.features).toContain("Monthly performance report");
  });

  it("exposes a public business pricing route", () => {
    const app = readFileSync("client/src/App.tsx", "utf8");
    expect(app).toContain("BusinessPricing");
    expect(app).toContain('path="/business-pricing"');
  });

  it("adds the pricing page to sitemap discovery", () => {
    const server = readFileSync("server/_core/index.ts", "utf8");
    expect(server).toContain('loc: "/business-pricing"');
  });

  it("explains the free claim to paid upgrade path", () => {
    const page = readFileSync("client/src/pages/BusinessPricing.tsx", "utf8");
    expect(page).toContain("Free Claim");
    expect(page).toContain("Featured Listing");
    expect(page).toContain("Premium Listing");
    expect(page).toContain("$29");
    expect(page).toContain("$79");
    expect(page).toContain("Claim Your Business");
  });

  it("preserves the selected paid tier when entering the owner checkout flow", () => {
    const page = readFileSync("client/src/pages/BusinessPricing.tsx", "utf8");
    expect(page).toContain('href: "/my-business?upgrade=featured"');
    expect(page).toContain('href: "/my-business?upgrade=premium"');
    expect(page).toContain('href: "/my-business?upgrade=pro"');
  });

  it("provisions every public paid tier in the Stripe setup script", () => {
    const setup = readFileSync("scripts/setup-stripe.mjs", "utf8");
    expect(setup).toContain("pro: {");
    expect(setup).not.toContain('"customer.subscription.trial_will_end"');
  });

  it("updates an existing billing portal with the complete catalog", () => {
    const setup = readFileSync("scripts/setup-stripe.mjs", "utf8");
    expect(setup).toContain("billingPortal.configurations.update");
    expect(setup).not.toContain("Billing portal already configured");
  });

  it("resolves billing portal products with one reliable lookup per tier", () => {
    const setup = readFileSync("scripts/setup-stripe.mjs", "utf8");
    expect(setup).not.toContain(
      'metadata["settle_tier"]:"featured" OR metadata["settle_tier"]:"premium" OR metadata["settle_tier"]:"pro"'
    );
    expect(setup).toContain("for (const tier of Object.keys(TIERS))");
  });

  it("ignores archived products during catalog and portal reconciliation", () => {
    const setup = readFileSync("scripts/setup-stripe.mjs", "utf8");
    const activeTierSearches = setup.match(
      /query: `metadata\["settle_tier"\]:"\$\{tier\}" AND active:'true'`/g
    );
    expect(activeTierSearches).toHaveLength(2);
  });

  it("gives admins a claim-to-revenue workflow prompt", () => {
    const adminClaims = readFileSync("client/src/pages/AdminClaims.tsx", "utf8");
    expect(adminClaims).toContain("Claim-to-revenue workflow");
    expect(adminClaims).toContain("/business-pricing");
  });
});
