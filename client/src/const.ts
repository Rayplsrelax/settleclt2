export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the server-owned OAuth flow so state, callback origin, and return path
// are validated and signed before leaving Settle CLT.
export const getLoginUrl = (returnTo?: string) => {
  const currentPath =
    typeof window === "undefined"
      ? "/"
      : `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams({ returnTo: returnTo ?? currentPath });
  return `/api/oauth/start?${params.toString()}`;
};
