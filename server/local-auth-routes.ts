import type { Express, Request, Response } from "express";
import { COOKIE_NAME, SESSION_TTL_MS } from "@shared/const";
import * as db from "./db";
import { assertEmailAuthConfiguration, assertGoogleAuthConfiguration, ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { createOAuthState, normalizeOAuthReturnPath, verifyOAuthState } from "./_core/oauth-state";
import { createOneTimeToken, hashPassword, hashToken, normalizeReturnPath, validateEmail, verifyPassword } from "./local-auth";
import rateLimit from "express-rate-limit";

const GOOGLE_NONCE_COOKIE = "settle_google_nonce";
const STATE_TTL_MS = 10 * 60 * 1000;
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_LIMIT_MAX = 30;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

function body(req: Request): Record<string, unknown> {
  return req.body && typeof req.body === "object" ? req.body : {};
}

function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie || "";
  const match = raw.split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

function jsonString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function callbackUrl(): string {
  if (!ENV.publicAppOrigin) throw new Error("PUBLIC_APP_ORIGIN is required");
  return new URL("/api/auth/google/callback", ENV.publicAppOrigin).toString();
}

function publicAuthError(res: Response, status: number, message: string) {
  res.status(status).json({ error: message });
}

async function sendAuthEmail(to: string, subject: string, html: string): Promise<void> {
  assertEmailAuthConfiguration();
  if (!ENV.resendApiKey || !ENV.authFromEmail) {
    throw new Error("Email delivery is not configured");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${ENV.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: ENV.authFromEmail, to: [to], subject, html }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}

async function createAndSendToken(userId: number, email: string, purpose: "verify_email" | "reset_password") {
  const token = createOneTimeToken();
  await db.createAuthToken({
    userId,
    tokenHash: token.hash,
    purpose,
    expiresAt: new Date(Date.now() + (purpose === "verify_email" ? VERIFY_TTL_MS : RESET_TTL_MS)),
  });
  const link = purpose === "verify_email"
    ? `${ENV.publicAppOrigin}/api/auth/verify-email?token=${encodeURIComponent(token.raw)}`
    : `${ENV.publicAppOrigin}/auth?resetToken=${encodeURIComponent(token.raw)}`;
  const subject = purpose === "verify_email" ? "Verify your Settle CLT email" : "Reset your Settle CLT password";
  const intro = purpose === "verify_email" ? "Verify your email address" : "Reset your password";
  await sendAuthEmail(email, subject, `<p>${intro}</p><p><a href="${link}">${link}</a></p><p>This link expires soon and can only be used once.</p>`);
}

async function issueSession(req: Request, res: Response, user: { openId: string; name: string | null; authVersion: number | null }) {
  const { sdk } = await import("./_core/sdk");
  const token = await sdk.createSessionToken(user.openId, { name: user.name || "User", authVersion: user.authVersion ?? 1, expiresInMs: SESSION_TTL_MS });
  res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: SESSION_TTL_MS });
}

export function registerLocalAuthRoutes(app: Express) {
  const authLimiter = rateLimit({
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    max: AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many authentication requests. Try again later." },
  });
  app.use("/api/auth", authLimiter);

  app.post("/api/auth/register", async (req, res) => {
    try {
      assertEmailAuthConfiguration();
      const input = body(req);
      const email = validateEmail(jsonString(input.email));
      const name = jsonString(input.name).trim().slice(0, 120);
      const password = jsonString(input.password);
      if (name.length < 2) return publicAuthError(res, 400, "Name is required");
      const existing = await db.getUserByEmail(email);
      if (existing) return publicAuthError(res, 409, "An account with that email already exists");
      const user = await db.createLocalUser({ email, name, passwordHash: await hashPassword(password) });
      if (!user) return publicAuthError(res, 500, "Unable to create account");
      await createAndSendToken(user.id, email, "verify_email");
      res.status(201).json({ ok: true, message: "Check your email to verify your account" });
    } catch (error) {
      console.error("[LocalAuth] Registration failed", error instanceof Error ? error.message : "unknown");
      publicAuthError(res, 400, "Unable to create account");
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const email = validateEmail(jsonString(body(req).email));
      const password = jsonString(body(req).password);
      const user = await db.getUserByEmail(email);
      if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
        return publicAuthError(res, 401, "Invalid email or password");
      }
      if (!user.emailVerifiedAt) return publicAuthError(res, 403, "Please verify your email before signing in");
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      await issueSession(req, res, user);
      res.json({ ok: true, returnTo: normalizeReturnPath(body(req).returnTo) });
    } catch {
      publicAuthError(res, 401, "Invalid email or password");
    }
  });

  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const raw = jsonString(req.query.token);
      if (!(await db.verifyEmailWithToken(hashToken(raw)))) return publicAuthError(res, 400, "Verification link is invalid or expired");
      res.redirect(302, "/auth?verified=1");
    } catch {
      publicAuthError(res, 400, "Verification link is invalid or expired");
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const generic = { ok: true, message: "If an account exists, a reset email has been sent" };
    try {
      assertEmailAuthConfiguration();
      const email = validateEmail(jsonString(body(req).email));
      const user = await db.getUserByEmail(email);
      if (user) {
        try { await createAndSendToken(user.id, email, "reset_password"); } catch (error) {
          console.error("[LocalAuth] Reset email failed", error instanceof Error ? error.message : "unknown");
        }
      }
    } catch { /* always return the same response */ }
    res.json(generic);
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const input = body(req);
      if (!(await db.resetPasswordWithToken(hashToken(jsonString(input.token)), await hashPassword(jsonString(input.password))))) return publicAuthError(res, 400, "Reset link is invalid or expired");
      res.json({ ok: true });
    } catch {
      publicAuthError(res, 400, "Reset link is invalid or expired");
    }
  });

  app.get("/api/auth/google/start", async (req, res) => {
    try {
      assertGoogleAuthConfiguration();
      const returnTo = normalizeOAuthReturnPath(typeof req.query.returnTo === "string" ? req.query.returnTo : "/");
      const nonce = createOneTimeToken().raw;
      await db.createAuthToken({ userId: null, tokenHash: hashToken(nonce), purpose: "google_oauth", expiresAt: new Date(Date.now() + STATE_TTL_MS) });
      const state = await createOAuthState({ returnTo, nonce }, { secret: ENV.cookieSecret });
      res.cookie(GOOGLE_NONCE_COOKIE, nonce, { ...getSessionCookieOptions(req), maxAge: STATE_TTL_MS });
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("client_id", ENV.googleClientId);
      url.searchParams.set("redirect_uri", callbackUrl());
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("state", state);
      url.searchParams.set("access_type", "online");
      res.redirect(302, url.toString());
    } catch (error) {
      console.error("[GoogleAuth] Start failed", error instanceof Error ? error.message : "unknown");
      publicAuthError(res, 503, "Google sign-in is temporarily unavailable");
    }
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      assertGoogleAuthConfiguration();
      const code = jsonString(req.query.code);
      const state = jsonString(req.query.state);
      const nonce = readCookie(req, GOOGLE_NONCE_COOKIE);
      if (!code || !state || !nonce) return publicAuthError(res, 400, "Google sign-in request is invalid");
      const oauthState = await verifyOAuthState(state, { secret: ENV.cookieSecret, expectedNonce: nonce });
      if (!(await db.consumeAuthToken(hashToken(oauthState.nonce), "google_oauth"))) return publicAuthError(res, 400, "Google sign-in request has already been used");
      res.clearCookie(GOOGLE_NONCE_COOKIE, getSessionCookieOptions(req));
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: ENV.googleClientId, client_secret: ENV.googleClientSecret, redirect_uri: callbackUrl(), grant_type: "authorization_code" }) });
      if (!tokenResponse.ok) return publicAuthError(res, 401, "Google sign-in failed");
      const tokens = await tokenResponse.json() as { access_token?: string };
      const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token || ""}` } });
      if (!profileResponse.ok) return publicAuthError(res, 401, "Google sign-in failed");
      const profile = await profileResponse.json() as { sub?: string; email?: string; email_verified?: boolean; name?: string };
      if (!profile.sub || !profile.email || profile.email_verified !== true) return publicAuthError(res, 401, "Google account email is not verified");
      const email = validateEmail(profile.email);
      let user = await db.getUserByGoogleSubject(profile.sub) || await db.getUserByEmail(email);
      if (user) {
        user = await db.updateUserAuth(user.id, { googleSubject: profile.sub, emailVerifiedAt: new Date(), name: profile.name || user.name, loginMethod: "google" });
      } else {
        user = await db.createLocalUser({ email, name: profile.name || email.split("@")[0], passwordHash: await hashPassword(`${createOneTimeToken().raw}Aa!`) });
        if (user) await db.updateUserAuth(user.id, { googleSubject: profile.sub, emailVerifiedAt: new Date(), loginMethod: "google" });
      }
      if (!user) return publicAuthError(res, 500, "Unable to create account");
      await issueSession(req, res, user);
      res.redirect(302, oauthState.returnTo);
    } catch (error) {
      console.error("[GoogleAuth] Callback failed", error instanceof Error ? error.message : "unknown");
      publicAuthError(res, 401, "Google sign-in failed");
    }
  });
}
