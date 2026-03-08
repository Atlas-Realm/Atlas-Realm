import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { queryClient } from "../../shared/api/query-client";
import { setUnauthorizedHandler } from "../../shared/api/http-client";
import { saveLocale, saveTheme } from "../../shared/config/ui-preferences";
import { I18nProvider } from "../../shared/i18n/i18n-provider";
import { useAuthStore } from "../../features/auth/store/auth-store";
import { useActivityStore } from "../../features/activity/store/activity-store";
import { useSessionStore } from "../../features/sessions/store/session-store";
import { useUiStore } from "../../features/ui/store/ui-store";

function AppLifecycle() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const markUnauthorized = useAuthStore((state) => state.markUnauthorized);
  const ensureListener = useSessionStore((state) => state.ensureListener);
  const resetActivity = useActivityStore((state) => state.reset);
  const theme = useUiStore((state) => state.theme);
  const locale = useUiStore((state) => state.locale);
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const glassEffects = useUiStore((state) => state.glassEffects);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    void ensureListener();
  }, [ensureListener]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      markUnauthorized();
      resetActivity();
      queryClient.clear();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [markUnauthorized, resetActivity]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
    document.body.dataset.motion = reducedMotion ? "reduced" : "full";
    document.body.dataset.effects = glassEffects ? "glass" : "flat";
    saveLocale(locale);
    saveTheme(theme);
  }, [glassEffects, locale, reducedMotion, theme]);

  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppLifecycle />
        {children}
      </I18nProvider>
    </QueryClientProvider>
  );
}
