import { COOKIE_NAME, SESSION_TTL_MS } from "@shared/const";
import { randomBytes } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getConfiguredPublicOrigin } from "../public-origin";
import { getSessionCookieOptions } from "./cookies";
import { assertOAuthRuntimeConfiguration, ENV } from "./env";
import { buildOAuthCallbackUrl, buildOAuthLoginUrl } from "./oauth-flow";
import {
  createOAuthState,
  normalizeOAuthReturnPath,
  verifyOAuthState,
} from "./oauth-state";
import { registerOAuthNonce, consumeOAuthNonce } from "./oauth-nonce-store";
import { sdk } from "./sdk";

const OAUTH_NONCE_COOKIE = "settle_oauth_nonce";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/start", async (req: Request, res: Response) => {
    try {
      assertOAuthRuntimeConfiguration();
      const returnTo = normalizeOAuthReturnPath(getQueryParam(req, "returnTo"));
      const nonce = randomBytes(32).toString("base64url");
      const state = await createOAuthState(
        { returnTo, nonce },
        { secret: ENV.cookieSecret }
      );
      // Register the nonce server-side so it can be atomically consumed
      // on callback, preventing replay attacks even if both the callback
      // URL and the nonce cookie are captured.
      registerOAuthNonce(nonce, OAUTH_STATE_TTL_MS);
      const callbackUrl = buildOAuthCallbackUrl(
        getConfiguredPublicOrigin(
          ENV.publicAppOrigin || undefined,
          ENV.isProduction
        )
      );
      const loginUrl = buildOAuthLoginUrl({
        portalUrl: ENV.oAuthPortalUrl,
        appId: ENV.appId,
        callbackUrl,
        state,
      });

      res.cookie(OAUTH_NONCE_COOKIE, nonce, {
        ...getSessionCookieOptions(req),
        maxAge: OAUTH_STATE_TTL_MS,
      });
      res.redirect(302, loginUrl);
    } catch (error) {
      console.error(
        "[OAuth] Unable to construct a safe sign-in request",
        error
      );
      res.status(503).json({ error: "Sign-in is temporarily unavailable" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    const cookieOptions = getSessionCookieOptions(req);
    const nonce = parseCookieHeader(req.headers.cookie ?? "")[
      OAUTH_NONCE_COOKIE
    ];
    if (!nonce) {
      res.status(400).json({ error: "OAuth state cookie is missing" });
      return;
    }

    let oauthState: Awaited<ReturnType<typeof verifyOAuthState>>;
    try {
      oauthState = await verifyOAuthState(state, {
        secret: ENV.cookieSecret,
        expectedNonce: nonce,
      });
    } catch {
      res.clearCookie(OAUTH_NONCE_COOKIE, cookieOptions);
      res.status(400).json({ error: "OAuth state is invalid or expired" });
      return;
    }
    res.clearCookie(OAUTH_NONCE_COOKIE, cookieOptions);

    // Atomically consume the nonce — if already consumed, this is a replay
    // attack and must be rejected before any token exchange.
    if (!consumeOAuthNonce(oauthState.nonce)) {
      res.status(400).json({ error: "OAuth state has already been used" });
      return;
    }

    try {
      const callbackUrl = buildOAuthCallbackUrl(
        getConfiguredPublicOrigin(
          ENV.publicAppOrigin || undefined,
          ENV.isProduction
        )
      );
      const tokenResponse = await sdk.exchangeCodeForToken(code, callbackUrl);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Check if this is a new user (for welcome notification)
      const existingUser = await db.getUserByOpenId(userInfo.openId);
      const isNewUser = !existingUser;

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Send welcome notification to new users
      if (isNewUser) {
        try {
          const newUser = await db.getUserByOpenId(userInfo.openId);
          if (newUser) {
            const { notifyWelcome } = await import("../notification-service");
            await notifyWelcome(newUser.id, userInfo.name || "");
          }
        } catch (e) {
          console.error("[OAuth] Welcome notification error:", e);
        }
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: SESSION_TTL_MS,
      });

      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: SESSION_TTL_MS,
      });

      res.redirect(302, oauthState.returnTo);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
