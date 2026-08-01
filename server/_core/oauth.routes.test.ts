import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createOAuthState, verifyOAuthState } from "./oauth-state";

const mocks = vi.hoisted(() => ({
  exchangeCodeForToken: vi.fn(),
  getUserInfo: vi.fn(),
  createSessionToken: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

vi.mock("./env", () => ({
  ENV: {
    appId: "app-123",
    cookieSecret: "test-secret-that-is-long-enough",
    oAuthServerUrl: "https://oauth-api.example.com",
    oAuthPortalUrl: "https://auth.example.com",
    publicAppOrigin: "https://settleclt.com",
    isProduction: false,
  },
  assertOAuthRuntimeConfiguration: () => undefined,
}));

vi.mock("./sdk", () => ({
  sdk: {
    exchangeCodeForToken: mocks.exchangeCodeForToken,
    getUserInfo: mocks.getUserInfo,
    createSessionToken: mocks.createSessionToken,
  },
}));

vi.mock("../db", () => ({
  getUserByOpenId: mocks.getUserByOpenId,
  upsertUser: mocks.upsertUser,
}));

describe("OAuth start route", () => {
  it("issues signed state and redirects to the provider", async () => {
    const { registerOAuthRoutes } = await import("./oauth");
    const app = express();
    registerOAuthRoutes(app);

    const response = await request(app)
      .get("/api/oauth/start")
      .query({ returnTo: "/my-business" });

    expect(response.status).toBe(302);
    const location = new URL(response.headers.location);
    expect(location.origin).toBe("https://auth.example.com");
    expect(location.pathname).toBe("/app-auth");
    expect(location.searchParams.get("redirectUri")).toBe(
      "https://settleclt.com/api/oauth/callback"
    );

    const nonceCookie = response.headers["set-cookie"]?.[0];
    expect(nonceCookie).toContain("settle_oauth_nonce=");
    expect(nonceCookie).toContain("HttpOnly");
    expect(nonceCookie).toContain("SameSite=Lax");

    const nonce = nonceCookie?.split(";", 1)[0]?.split("=", 2)[1];
    const state = location.searchParams.get("state");
    expect(state).toBeTruthy();
    expect(nonce).toBeTruthy();
    await expect(
      verifyOAuthState(state!, {
        secret: "test-secret-that-is-long-enough",
        expectedNonce: nonce!,
      })
    ).resolves.toMatchObject({ returnTo: "/my-business", nonce });
  });

  it("validates the nonce and returns to the signed local path", async () => {
    const nonce = "nonce-123";
    const state = await createOAuthState(
      { returnTo: "/my-business", nonce },
      { secret: "test-secret-that-is-long-enough" }
    );
    mocks.exchangeCodeForToken.mockResolvedValue({
      accessToken: "access-token",
    });
    mocks.getUserInfo.mockResolvedValue({
      openId: "owner-open-id",
      name: "Business Owner",
      email: "owner@example.com",
      loginMethod: "email",
    });
    mocks.getUserByOpenId.mockResolvedValue({ id: 7, openId: "owner-open-id" });
    mocks.createSessionToken.mockResolvedValue("session-token");

    const { registerOAuthRoutes } = await import("./oauth");
    const app = express();
    registerOAuthRoutes(app);

    const response = await request(app)
      .get("/api/oauth/callback")
      .query({ code: "authorization-code", state })
      .set("Cookie", `settle_oauth_nonce=${nonce}`);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/my-business");
    expect(mocks.exchangeCodeForToken).toHaveBeenCalledWith(
      "authorization-code",
      "https://settleclt.com/api/oauth/callback"
    );
  });

  it("rejects a callback without the nonce cookie", async () => {
    const { registerOAuthRoutes } = await import("./oauth");
    const app = express();
    registerOAuthRoutes(app);

    const response = await request(app)
      .get("/api/oauth/callback")
      .query({ code: "authorization-code", state: "tampered" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("OAuth state cookie is missing");
  });

});
