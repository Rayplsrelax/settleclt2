const DEVELOPMENT_PUBLIC_ORIGIN = "http://localhost:3000";

export function getConfiguredPublicOrigin(
  configuredOrigin = process.env.PUBLIC_APP_ORIGIN,
  isProduction = process.env.NODE_ENV === "production"
): string {
  if (!configuredOrigin) {
    if (isProduction) {
      throw new Error("PUBLIC_APP_ORIGIN is required in production");
    }
    configuredOrigin = DEVELOPMENT_PUBLIC_ORIGIN;
  }

  const url = new URL(configuredOrigin);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("PUBLIC_APP_ORIGIN must use HTTP or HTTPS");
  }

  if (url.protocol === "http:" && isProduction) {
    throw new Error("PUBLIC_APP_ORIGIN must use HTTPS in production");
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("PUBLIC_APP_ORIGIN must be an origin only");
  }

  return url.origin;
}
