"use client";

export type Theme = "light" | "dark";
export type Comfort = "on" | "off";

const THEME_KEY = "portfolio-theme";
const COMFORT_KEY = "portfolio-comfort";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(THEME_KEY) as Theme) ?? getSystemTheme();
}

export function getStoredComfort(): Comfort {
  if (typeof window === "undefined") return "off";
  return (localStorage.getItem(COMFORT_KEY) as Comfort) ?? "off";
}

export function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
}

export function setComfort(comfort: Comfort) {
  localStorage.setItem(COMFORT_KEY, comfort);
  document.documentElement.setAttribute("data-comfort", comfort);
}

export function toggleTheme(): Theme {
  const current = getStoredTheme();
  const next: Theme = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function toggleComfort(): Comfort {
  const current = getStoredComfort();
  const next: Comfort = current === "on" ? "off" : "on";
  setComfort(next);
  return next;
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function initTheme() {
  const theme = getStoredTheme();
  const comfort = getStoredComfort();
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-comfort", comfort);
}
