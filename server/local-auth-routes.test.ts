import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks --------------------------------------------------------------

const mockDb = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  getUserByGoogleSubject: vi.fn(),
  createLocalUser: vi.fn(),
  createAuthToken: vi.fn(),
  consumeAuthToken: vi.fn(),
  verifyEmailWithToken: vi.fn(),
  resetPasswordWithToken: vi.fn(),
  updateUserAuth: vi.fn(),
  upsertUser: vi.fn(),
}));

const mockRequestNewsletterSubscription = vi.hoisted(() => vi.fn());

vi.mock("./db", () => mockDb);
vi.mock("./newsletter-service", () => ({
  requestNewsletterSubscription: mockRequestNewsletterSubscription,
}));

import { registerLocalAuthRoutes } from "./local-auth-routes";
import { sdk as mockSdk } from "./_core/sdk";

vi.mock("./_core/sdk", () => ({
  sdk: { createSessionToken: vi.fn().mockResolvedValue("mock-jwt-token") },
}));

const testEnv = vi.hoisted(() => ({
  appId: "test-app",
  cookieSecret: "test-jwt-secret",
  databaseUrl: "",
  oAuthServerUrl: "",
  oAuthPortalUrl: "",
  publicAppOrigin: "https://settleclt.com",
  ownerOpenId: "",
  isProduction: false,
  forgeApiUrl: "",
  forgeApiKey: "",
  hermesApiSecret: "",
  googleClientId: "test-google-id",
  googleClientSecret: "test-google-secret",
  resendApiKey: "test-resend-key",
  authFromEmail: "Settle CLT <noreply@settleclt.com>",
  assertEmailAuthConfiguration: () => {},
  assertGoogleAuthConfiguration: () => {},
  assertSelfHostedPublicOrigin: () => {},
  assertEmailAuthConfigurationReal: undefined as (() => void) | undefined,
  assertGoogleAuthConfigurationReal: undefined as (() => void) | undefined,
}));

vi.mock("./_core/env", () => ({
  ENV: testEnv,
  assertEmailAuthConfiguration: () => {
    if (!testEnv.resendApiKey || !testEnv.authFromEmail) throw new Error("Missing email config");
    if (!testEnv.publicAppOrigin) throw new Error("Missing PUBLIC_APP_ORIGIN");
  },
  assertGoogleAuthConfiguration: () => {
    if (!testEnv.googleClientId || !testEnv.googleClientSecret) throw new Error("Missing Google config");
    if (!testEnv.publicAppOrigin) throw new Error("Missing PUBLIC_APP_ORIGIN");
  },
}));

vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: () => ({ httpOnly: true, secure: false, sameSite: "lax" }),
}));

vi.mock("./_core/oauth-state", () => ({
  createOAuthState: vi.fn().mockResolvedValue("mock-state-token"),
  normalizeOAuthReturnPath: (v: string) => v?.startsWith("/") && !v.startsWith("//") ? v : "/",
  verifyOAuthState: vi.fn().mockResolvedValue({ nonce: "test-nonce", returnTo: "/dashboard" }),
}));

// --- Helpers -------------------------------------------------------------

function makeApp() {
  const app = express();
  app.use(express.json());
  // The origin guard is not part of these route tests; we set Origin headers
  // explicitly per-test via supertest.
  registerLocalAuthRoutes(app);
  return app;
}

const ORIGIN = "https://settleclt.com";

function resetTestEnv() {
  testEnv.googleClientId = "test-google-id";
  testEnv.googleClientSecret = "test-google-secret";
  testEnv.resendApiKey = "test-resend-key";
  testEnv.authFromEmail = "Settle CLT <noreply@settleclt.com>";
  testEnv.publicAppOrigin = "https://settleclt.com";
}

beforeEach(() => {
  vi.clearAllMocks();
  // Restore default mock implementations after clearing
  mockDb.getUserByEmail.mockResolvedValue(null);
  mockDb.getUserByGoogleSubject.mockResolvedValue(null);
  mockDb.createLocalUser.mockResolvedValue({ id: 1, openId: "local-1", name: "User", authVersion: 1 });
  mockDb.createAuthToken.mockResolvedValue({});
  mockDb.consumeAuthToken.mockResolvedValue(undefined);
  mockDb.verifyEmailWithToken.mockResolvedValue(true);
  mockDb.resetPasswordWithToken.mockResolvedValue(true);
  mockDb.updateUserAuth.mockResolvedValue({});
  mockDb.upsertUser.mockResolvedValue({});
  mockRequestNewsletterSubscription.mockResolvedValue(undefined);
  mockSdk.createSessionToken.mockResolvedValue("mock-jwt-token");
  resetTestEnv();
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true }) as any;
});

// --- Tests ---------------------------------------------------------------

describe("POST /api/auth/register", () => {
  it("returns 201 when registration succeeds", async () => {
    mockDb.getUserByEmail.mockResolvedValue(null);
    mockDb.createLocalUser.mockResolvedValue({ id: 1, openId: "local-1" });
    // Mock global fetch for Resend
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as any;

    const res = await request(makeApp())
      .post("/api/auth/register")
      .set("Origin", ORIGIN)
      .send({ email: "new@test.com", name: "Test User", password: "secure-pass-123" });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(mockDb.createLocalUser).toHaveBeenCalled();
  });

  it("requires explicit newsletter consent during registration", async () => {
    await request(makeApp())
      .post("/api/auth/register")
      .set("Origin", ORIGIN)
      .send({ email: "new@test.com", name: "Test User", password: "secure-pass-123" });
    expect(mockRequestNewsletterSubscription).not.toHaveBeenCalled();

    await request(makeApp())
      .post("/api/auth/register")
      .set("Origin", ORIGIN)
      .send({
        email: "optin@test.com",
        name: "Test User",
        password: "secure-pass-123",
        newsletterOptIn: true,
      });
    expect(mockRequestNewsletterSubscription).toHaveBeenCalledWith({
      email: "optin@test.com",
      source: "registration",
    });
  });

  it("returns 409 when email already exists", async () => {
    mockDb.getUserByEmail.mockResolvedValue({ id: 5 });

    const res = await request(makeApp())
      .post("/api/auth/register")
      .set("Origin", ORIGIN)
      .send({ email: "existing@test.com", name: "Test", password: "secure-pass-123" });

    expect(res.status).toBe(409);
    expect(mockDb.createLocalUser).not.toHaveBeenCalled();
  });

  it("returns 400 when password is too short", async () => {
    mockDb.getUserByEmail.mockResolvedValue(null);

    const res = await request(makeApp())
      .post("/api/auth/register")
      .set("Origin", ORIGIN)
      .send({ email: "weak@test.com", name: "Test", password: "short" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(makeApp())
      .post("/api/auth/register")
      .set("Origin", ORIGIN)
      .send({ email: "noname@test.com", name: "", password: "secure-pass-123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns 401 for wrong password", async () => {
    const { hashPassword } = await import("./local-auth");
    const hash = await hashPassword("correct-password-123");
    mockDb.getUserByEmail.mockResolvedValue({
      id: 1, openId: "u1", email: "user@test.com", passwordHash: hash, emailVerifiedAt: new Date(), authVersion: 1,
    });

    const res = await request(makeApp())
      .post("/api/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "user@test.com", password: "wrong-password!!!1" });

    expect(res.status).toBe(401);
  });

  it("returns 403 when email is not verified", async () => {
    const { hashPassword } = await import("./local-auth");
    const hash = await hashPassword("correct-password-123");
    mockDb.getUserByEmail.mockResolvedValue({
      id: 1, openId: "u1", email: "user@test.com", passwordHash: hash, emailVerifiedAt: null, authVersion: 1,
    });

    const res = await request(makeApp())
      .post("/api/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "user@test.com", password: "correct-password-123" });

    expect(res.status).toBe(403);
  });

  it("returns 200 and sets cookie on successful login", async () => {
    const { hashPassword } = await import("./local-auth");
    const hash = await hashPassword("correct-password-123");
    mockDb.getUserByEmail.mockResolvedValue({
      id: 1, openId: "u1", name: "User", email: "user@test.com", passwordHash: hash, emailVerifiedAt: new Date(), authVersion: 1,
    });
    mockDb.upsertUser.mockResolvedValue({});

    const res = await request(makeApp())
      .post("/api/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "user@test.com", password: "correct-password-123" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("sanitizes unsafe returnTo paths", async () => {
    const { hashPassword } = await import("./local-auth");
    const hash = await hashPassword("correct-password-123");
    mockDb.getUserByEmail.mockResolvedValue({
      id: 1, openId: "u1", name: "User", email: "user@test.com", passwordHash: hash, emailVerifiedAt: new Date(), authVersion: 1,
    });
    mockDb.upsertUser.mockResolvedValue({});

    const res = await request(makeApp())
      .post("/api/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "user@test.com", password: "correct-password-123", returnTo: "https://evil.example/steal" });

    expect(res.status).toBe(200);
    expect(res.body.returnTo).toBe("/");
  });
});

describe("GET /api/auth/verify-email", () => {
  it("redirects to /auth?verified=1 on success", async () => {
    mockDb.verifyEmailWithToken.mockResolvedValue(true);

    const res = await request(makeApp())
      .get("/api/auth/verify-email?token=valid-token");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/auth?verified=1");
  });

  it("returns 400 for invalid or expired token", async () => {
    mockDb.verifyEmailWithToken.mockResolvedValue(false);

    const res = await request(makeApp())
      .get("/api/auth/verify-email?token=bad-token");

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("always returns the same generic response regardless of account existence", async () => {
    mockDb.getUserByEmail.mockResolvedValue(null);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as any;

    const res1 = await request(makeApp())
      .post("/api/auth/forgot-password")
      .set("Origin", ORIGIN)
      .send({ email: "nonexistent@test.com" });

    mockDb.getUserByEmail.mockResolvedValue({ id: 2, email: "exists@test.com" });

    const res2 = await request(makeApp())
      .post("/api/auth/forgot-password")
      .set("Origin", ORIGIN)
      .send({ email: "exists@test.com" });

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.message).toBe(res2.body.message);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("returns 400 for invalid reset token", async () => {
    mockDb.resetPasswordWithToken.mockResolvedValue(false);

    const res = await request(makeApp())
      .post("/api/auth/reset-password")
      .set("Origin", ORIGIN)
      .send({ token: "bad-token", password: "new-secure-pass-123" });

    expect(res.status).toBe(400);
  });

  it("returns 200 on success", async () => {
    mockDb.resetPasswordWithToken.mockResolvedValue(true);

    const res = await request(makeApp())
      .post("/api/auth/reset-password")
      .set("Origin", ORIGIN)
      .send({ token: "valid-token", password: "new-secure-pass-123" });

    expect(res.status).toBe(200);
    expect(mockDb.resetPasswordWithToken).toHaveBeenCalled();
  });
});

describe("GET /api/auth/google/start", () => {
  it("returns 503 when Google is not configured", async () => {
    testEnv.googleClientId = "";

    const res = await request(makeApp()).get("/api/auth/google/start");

    expect(res.status).toBe(503);
  });

  it("redirects to Google when configured", async () => {
    mockDb.createAuthToken.mockResolvedValue({});
    const res = await request(makeApp()).get("/api/auth/google/start?returnTo=/dashboard");

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("accounts.google.com");
    expect(res.headers.location).toContain("client_id=test-google-id");
  });
});

describe("configuration fail-closed", () => {
  it("registration returns 400 when Resend is not configured", async () => {
    testEnv.resendApiKey = "";
    mockDb.getUserByEmail.mockResolvedValue(null);
    mockDb.createLocalUser.mockResolvedValue({ id: 1, openId: "local-1" });

    const res = await request(makeApp())
      .post("/api/auth/register")
      .set("Origin", ORIGIN)
      .send({ email: "new@test.com", name: "Test User", password: "secure-pass-123" });

    expect(res.status).toBe(400);
  });
});
