import { getConfiguredPublicOrigin } from "../public-origin";
import {
  getConfiguredOAuthPortalUrl,
  getConfiguredOAuthServerUrl,
} from "./oauth-flow";

const isProduction = process.env.NODE_ENV === "production";

export const ENV = {
  appId: process.env.OAUTH_APP_ID ?? process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  oAuthPortalUrl:
    process.env.OAUTH_PORTAL_URL ?? process.env.VITE_OAUTH_PORTAL_URL ?? "",
  publicAppOrigin: process.env.PUBLIC_APP_ORIGIN ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  hermesApiSecret: process.env.HERMES_API_SECRET ?? "",
};

export function assertOAuthRuntimeConfiguration(env = ENV): void {
  const missing = [
    ["JWT_SECRET", env.cookieSecret],
    ["OAUTH_APP_ID", env.appId],
    ["OAUTH_SERVER_URL", env.oAuthServerUrl],
    ["OAUTH_PORTAL_URL", env.oAuthPortalUrl],
    ...(env.isProduction
      ? [["PUBLIC_APP_ORIGIN", env.publicAppOrigin] as const]
      : []),
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Missing required OAuth runtime configuration: ${missing.join(", ")}`
    );
  }

  getConfiguredOAuthServerUrl(env.oAuthServerUrl);
  getConfiguredOAuthPortalUrl(env.oAuthPortalUrl);
  getConfiguredPublicOrigin(env.publicAppOrigin || undefined, env.isProduction);
}
