export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Local self-hosted auth page. It owns the return path and offers Google or email/password.
export const getLoginUrl = (returnTo?: string) => {
  const currentPath =
    typeof window === "undefined"
      ? "/"
      : `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams({ returnTo: returnTo ?? currentPath });
  return `/auth?${params.toString()}`;
};
