/**
 * Theme preference resolution shared between the pre-paint inline script in
 * client/index.html, the React ThemeContext, and server-side tests.
 *
 * Rules:
 * - An explicit stored choice ("light" | "dark") always wins.
 * - With no stored choice, fall back to the OS/browser preference.
 * - Anything else falls back to light.
 */
export type Theme = "light" | "dark";

export function isStoredTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveInitialTheme(
  stored: string | null,
  systemPrefersDark: boolean
): Theme {
  if (isStoredTheme(stored)) return stored;
  return systemPrefersDark ? "dark" : "light";
}
