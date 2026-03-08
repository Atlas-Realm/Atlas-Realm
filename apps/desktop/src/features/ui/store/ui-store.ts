import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  detectPreferredLocale,
  detectPreferredTheme,
  saveLocale,
  saveTheme,
} from "../../../shared/config/ui-preferences";
import type { UILocale, UITheme } from "../../../shared/types";

type UiStoreState = {
  mobileDrawerOpen: boolean;
  leftSidebarCollapsed: boolean;
  rightSidebarOpen: boolean;
  theme: UITheme;
  locale: UILocale;
  reducedMotion: boolean;
  glassEffects: boolean;
  defaultLibraryView: "grid" | "list";
  toggleMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setRightSidebarOpen: (value: boolean) => void;
  setTheme: (theme: UITheme) => void;
  setLocale: (locale: UILocale) => void;
  setReducedMotion: (value: boolean) => void;
  setGlassEffects: (value: boolean) => void;
  setDefaultLibraryView: (value: "grid" | "list") => void;
  resetPreferences: () => void;
};

const defaults = {
  theme: detectPreferredTheme(),
  locale: detectPreferredLocale(),
  reducedMotion: false,
  glassEffects: true,
  defaultLibraryView: "grid" as const,
};

export const useUiStore = create<UiStoreState>()(
  persist(
    (set) => ({
      mobileDrawerOpen: false,
      leftSidebarCollapsed: false,
      rightSidebarOpen: true,
      theme: defaults.theme,
      locale: defaults.locale,
      reducedMotion: defaults.reducedMotion,
      glassEffects: defaults.glassEffects,
      defaultLibraryView: defaults.defaultLibraryView,
      toggleMobileDrawer: () => set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),
      closeMobileDrawer: () => set({ mobileDrawerOpen: false }),
      toggleLeftSidebar: () => set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed })),
      toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      setRightSidebarOpen: (value) => set({ rightSidebarOpen: value }),
      setTheme: (theme) => {
        saveTheme(theme);
        set({ theme });
      },
      setLocale: (locale) => {
        saveLocale(locale);
        set({ locale });
      },
      setReducedMotion: (value) => set({ reducedMotion: value }),
      setGlassEffects: (value) => set({ glassEffects: value }),
      setDefaultLibraryView: (value) => set({ defaultLibraryView: value }),
      resetPreferences: () =>
        set({
          theme: (saveTheme(defaults.theme), defaults.theme),
          locale: (saveLocale(defaults.locale), defaults.locale),
          reducedMotion: defaults.reducedMotion,
          glassEffects: defaults.glassEffects,
          defaultLibraryView: defaults.defaultLibraryView,
          leftSidebarCollapsed: false,
          rightSidebarOpen: true,
        }),
    }),
    {
      name: "atlas.desktop.ui",
      partialize: (state) => ({
        leftSidebarCollapsed: state.leftSidebarCollapsed,
        rightSidebarOpen: state.rightSidebarOpen,
        theme: state.theme,
        locale: state.locale,
        reducedMotion: state.reducedMotion,
        glassEffects: state.glassEffects,
        defaultLibraryView: state.defaultLibraryView,
      }),
    },
  ),
);
