import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getConfiguredOAuthPortalUrl,
  getConfiguredOAuthServerUrl,
} from "./oauth-flow";

describe("getConfiguredOAuthPortalUrl", () => {
  it("normalizes the configured provider origin", () => {
    expect(getConfiguredOAuthPortalUrl("https://auth.example.com/")).toBe(
      "https://auth.example.com",
    );
  });

  it("rejects an empty or malformed provider URL", () => {
    expect(() => getConfiguredOAuthPortalUrl("")).toThrow(
      "OAUTH_PORTAL_URL is required",
    );
    expect(() => getConfiguredOAuthPortalUrl("not-a-url")).toThrow(
      "OAUTH_PORTAL_URL must be a valid URL",
    );
  });

  it("rejects credentials, paths, queries, and fragments", () => {
    for (const value of [
      "https://user:pass@auth.example.com",
      "https://auth.example.com/app-auth",
      "https://auth.example.com?next=/evil",
      "https://auth.example.com#fragment",
    ]) {
      expect(() => getConfiguredOAuthPortalUrl(value)).toThrow(
        "OAUTH_PORTAL_URL must be an origin only",
      );
    }
  });
});

describe("getConfiguredOAuthServerUrl", () => {
  it("requires an HTTP(S) origin-only token-exchange server", () => {
    expect(getConfiguredOAuthServerUrl("https://oauth-api.example.com/")).toBe(
      "https://oauth-api.example.com",
    );
    expect(() => getConfiguredOAuthServerUrl("")).toThrow(
      "OAUTH_SERVER_URL is required",
    );
    expect(() =>
      getConfiguredOAuthServerUrl("https://oauth-api.example.com/path"),
    ).toThrow("OAUTH_SERVER_URL must be an origin only");
  });

  it("does not bypass validation when the SDK creates its OAuth client", () => {
    const sdkSource = readFileSync(new URL("./sdk.ts", import.meta.url), "utf8");
    const clientFactory = sdkSource.slice(
      sdkSource.indexOf("const createOAuthHttpClient"),
      sdkSource.indexOf("class SDKServer"),
    );
    expect(clientFactory).toContain(
      "baseURL: getConfiguredOAuthServerUrl(ENV.oAuthServerUrl)",
    );
    expect(clientFactory).not.toContain("ENV.oAuthServerUrl\n      ?");
  });
});
