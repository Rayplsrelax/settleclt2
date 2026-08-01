import { describe, expect, it } from "vitest";
import { buildOAuthCallbackUrl, buildOAuthLoginUrl } from "./oauth-flow";

describe("OAuth flow URLs", () => {
  it("uses the configured public origin for the exact callback URL", () => {
    expect(buildOAuthCallbackUrl("https://settleclt.com")).toBe(
      "https://settleclt.com/api/oauth/callback"
    );
  });

  it("builds the provider URL from server-owned values", () => {
    expect(
      buildOAuthLoginUrl({
        portalUrl: "https://auth.example.com",
        appId: "app-123",
        callbackUrl: "https://settleclt.com/api/oauth/callback",
        state: "signed-state",
      })
    ).toBe(
      "https://auth.example.com/app-auth?appId=app-123&redirectUri=https%3A%2F%2Fsettleclt.com%2Fapi%2Foauth%2Fcallback&state=signed-state&type=signIn"
    );
  });
});
