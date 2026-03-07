import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { queryClient } from "../../shared/api/query-client";
import { setUnauthorizedHandler } from "../../shared/api/http-client";
import { useAuthStore } from "../../features/auth/store/auth-store";
import { useSessionStore } from "../../features/sessions/store/session-store";

function AppLifecycle() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const markUnauthorized = useAuthStore((state) => state.markUnauthorized);
  const ensureListener = useSessionStore((state) => state.ensureListener);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    void ensureListener();
  }, [ensureListener]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      markUnauthorized();
      queryClient.clear();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [markUnauthorized]);

  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLifecycle />
      {children}
    </QueryClientProvider>
  );
}
