type OAuthLoginUrlOptions = {
  portalUrl: string;
  appId: string;
  callbackUrl: string;
  state: string;
};

function getConfiguredOAuthOrigin(
  configuredUrl: string,
  variableName: "OAUTH_PORTAL_URL" | "OAUTH_SERVER_URL",
): string {
  if (!configuredUrl) throw new Error(`${variableName} is required`);

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error(`${variableName} must be a valid URL`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${variableName} must use HTTP or HTTPS`);
  }
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${variableName} must be an origin only`);
  }

  return url.origin;
}

export function getConfiguredOAuthPortalUrl(configuredUrl: string): string {
  return getConfiguredOAuthOrigin(configuredUrl, "OAUTH_PORTAL_URL");
}

export function getConfiguredOAuthServerUrl(configuredUrl: string): string {
  return getConfiguredOAuthOrigin(configuredUrl, "OAUTH_SERVER_URL");
}

export function buildOAuthCallbackUrl(publicOrigin: string): string {
  return new URL("/api/oauth/callback", publicOrigin).toString();
}

export function buildOAuthLoginUrl(options: OAuthLoginUrlOptions): string {
  const url = new URL(
    "/app-auth",
    getConfiguredOAuthPortalUrl(options.portalUrl),
  );
  url.searchParams.set("appId", options.appId);
  url.searchParams.set("redirectUri", options.callbackUrl);
  url.searchParams.set("state", options.state);
  url.searchParams.set("type", "signIn");
  return url.toString();
}
