import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Light/dark toggle for the site navbar. Hidden entirely when the theme
 * system is not switchable (theme is locked to light).
 */
export default function ThemeToggle() {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="w-[18px] h-[18px]" />
      ) : (
        <Moon className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}
