"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  getStoredTheme,
  getStoredComfort,
  toggleTheme,
  toggleComfort,
  type Theme,
  type Comfort,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const t = useTranslations("theme");
  const [theme, setThemeState] = useState<Theme>("dark");
  const [comfort, setComfortState] = useState<Comfort>("off");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getStoredTheme());
    setComfortState(getStoredComfort());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1">
        <div className="h-8 w-8 rounded-md bg-bg-secondary" />
        <div className="h-8 w-8 rounded-md bg-bg-secondary" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setThemeState(toggleTheme())}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary",
          "transition-colors duration-150",
          "hover:bg-bg-secondary hover:text-text-primary",
        )}
        aria-label={theme === "dark" ? t("light") : t("dark")}
        title={theme === "dark" ? t("light") : t("dark")}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <button
        onClick={() => setComfortState(toggleComfort())}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md",
          "transition-colors duration-150",
          comfort === "on"
            ? "bg-accent-muted text-accent"
            : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
        )}
        aria-label={t("comfort")}
        title={t("comfort")}
      >
        {comfort === "on" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  );
}
