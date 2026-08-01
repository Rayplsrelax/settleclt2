import { SignJWT, jwtVerify } from "jose";

const OAUTH_STATE_ISSUER = "settleclt-oauth-state";
const OAUTH_STATE_AUDIENCE = "settleclt-oauth-callback";
const OAUTH_STATE_TTL_SECONDS = 10 * 60;

type OAuthStatePayload = {
  returnTo: string;
  nonce: string;
};

type OAuthStateOptions = {
  secret: string;
  now?: Date;
};

type VerifyOAuthStateOptions = OAuthStateOptions & {
  expectedNonce: string;
};

const RETURN_PATH_BASE = "https://settleclt.com";

export function normalizeOAuthReturnPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return "/";
  }

  try {
    const url = new URL(value, RETURN_PATH_BASE);
    if (url.origin !== RETURN_PATH_BASE || url.hash) return "/";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}

function secretKey(secret: string) {
  if (!secret) throw new Error("OAuth state secret is not configured");
  return new TextEncoder().encode(secret);
}

export async function createOAuthState(
  payload: OAuthStatePayload,
  options: OAuthStateOptions
): Promise<string> {
  const issuedAt = Math.floor((options.now ?? new Date()).getTime() / 1000);

  return new SignJWT({
    returnTo: normalizeOAuthReturnPath(payload.returnTo),
    nonce: payload.nonce,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(issuedAt)
    .setIssuer(OAUTH_STATE_ISSUER)
    .setAudience(OAUTH_STATE_AUDIENCE)
    .setExpirationTime(issuedAt + OAUTH_STATE_TTL_SECONDS)
    .sign(secretKey(options.secret));
}

export async function verifyOAuthState(
  state: string,
  options: VerifyOAuthStateOptions
): Promise<OAuthStatePayload> {
  const { payload } = await jwtVerify(state, secretKey(options.secret), {
    algorithms: ["HS256"],
    issuer: OAUTH_STATE_ISSUER,
    audience: OAUTH_STATE_AUDIENCE,
    currentDate: options.now,
  });

  if (
    typeof payload.returnTo !== "string" ||
    typeof payload.nonce !== "string" ||
    payload.nonce !== options.expectedNonce
  ) {
    throw new Error("Invalid OAuth state");
  }

  return { returnTo: payload.returnTo, nonce: payload.nonce };
}
