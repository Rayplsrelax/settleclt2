import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  FeatureDisabledError,
  assertFeatureEnabled,
  loadFeatureFlags,
  registerFeatureFlagRoutes,
} from "./feature-flags";

describe("server-enforced feature flags", () => {
  it("preserves existing behavior by default and parses explicit booleans", () => {
    expect(loadFeatureFlags({})).toEqual({
      businessCheckout: true,
      eventSubmissions: true,
      eventPromotions: true,
    });
    expect(
      loadFeatureFlags({
        FEATURE_BUSINESS_CHECKOUT: "false",
        FEATURE_EVENT_SUBMISSIONS: "true",
      })
    ).toEqual({
      businessCheckout: false,
      eventSubmissions: true,
      eventPromotions: true,
    });
  });

  it("fails closed on ambiguous flag values", () => {
    expect(() =>
      loadFeatureFlags({ FEATURE_BUSINESS_CHECKOUT: "yes" })
    ).toThrow("FEATURE_BUSINESS_CHECKOUT must be true/false or 1/0");
  });

  it("blocks disabled server behavior with a service-unavailable error", () => {
    expect(() =>
      assertFeatureEnabled(
        "businessCheckout",
        "eventPromotions",
        loadFeatureFlags({ FEATURE_BUSINESS_CHECKOUT: "false" })
      )
    ).toThrowError(FeatureDisabledError);
  });

  it("exposes only non-secret flag status without caching", async () => {
    const app = express();
    registerFeatureFlagRoutes(
      app,
      loadFeatureFlags({ FEATURE_EVENT_SUBMISSIONS: "false" })
    );

    const response = await request(app).get("/api/feature-flags").expect(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toEqual({
      businessCheckout: true,
      eventSubmissions: false,
      eventPromotions: true,
    });
  });
});
