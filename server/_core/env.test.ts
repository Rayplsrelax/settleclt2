import { describe, expect, it } from "vitest";
import { assertOAuthRuntimeConfiguration } from "./env";

describe("assertOAuthRuntimeConfiguration", () => {
  it("rejects missing production OAuth settings", () => {
    expect(() =>
      assertOAuthRuntimeConfiguration({
        cookieSecret: "",
        appId: "",
        oAuthServerUrl: "",
        oAuthPortalUrl: "",
        publicAppOrigin: "",
        isProduction: true,
      } as never),
    ).toThrow(
      "JWT_SECRET, OAUTH_APP_ID, OAUTH_SERVER_URL, OAUTH_PORTAL_URL, PUBLIC_APP_ORIGIN",
    );
  });

  it("accepts complete OAuth settings", () => {
    expect(() =>
      assertOAuthRuntimeConfiguration({
        cookieSecret: "secret",
        appId: "app",
        oAuthServerUrl: "https://oauth-api.example.com",
        oAuthPortalUrl: "https://auth.example.com",
        publicAppOrigin: "https://settleclt.com",
        isProduction: true,
      } as never),
    ).not.toThrow();
  });

  it("rejects malformed OAuth and public origins", () => {
    expect(() =>
      assertOAuthRuntimeConfiguration({
        cookieSecret: "secret",
        appId: "app",
        oAuthServerUrl: "https://oauth-api.example.com/path",
        oAuthPortalUrl: "https://auth.example.com/path",
        publicAppOrigin: "https://settleclt.com/path",
        isProduction: true,
      } as never),
    ).toThrow();
  });
});
