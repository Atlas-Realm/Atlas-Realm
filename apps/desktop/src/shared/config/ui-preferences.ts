import type { UILocale, UITheme } from "../types";

const STORAGE_KEYS = {
  locale: "atlas.desktop.locale",
  theme: "atlas.desktop.theme",
} as const;

const THEMES: UITheme[] = ["atlas-glass", "atlas-ocean", "atlas-frost", "atlas-carbon"];
const LOCALES: UILocale[] = ["tr", "en"];

function hasWindow() {
  return typeof window !== "undefined";
}

export function getStoredLocale(): UILocale | null {
  if (!hasWindow()) return null;
  const value = window.localStorage.getItem(STORAGE_KEYS.locale);
  return LOCALES.includes(value as UILocale) ? (value as UILocale) : null;
}

export function detectPreferredLocale(): UILocale {
  const stored = getStoredLocale();
  if (stored) return stored;

  if (!hasWindow()) return "en";

  const language = window.navigator.language.toLowerCase();
  return language.startsWith("tr") ? "tr" : "en";
}

export function saveLocale(locale: UILocale) {
  if (!hasWindow()) return;
  window.localStorage.setItem(STORAGE_KEYS.locale, locale);
}

export function getStoredTheme(): UITheme | null {
  if (!hasWindow()) return null;
  const value = window.localStorage.getItem(STORAGE_KEYS.theme);
  return THEMES.includes(value as UITheme) ? (value as UITheme) : null;
}

export function detectPreferredTheme(): UITheme {
  return getStoredTheme() ?? "atlas-glass";
}

export function saveTheme(theme: UITheme) {
  if (!hasWindow()) return;
  window.localStorage.setItem(STORAGE_KEYS.theme, theme);
}
