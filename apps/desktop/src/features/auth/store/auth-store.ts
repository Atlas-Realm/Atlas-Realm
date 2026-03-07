import { create } from "zustand";
import { API_BASE_URL } from "../../../shared/config/env";
import { clearAuthTokens, getAccessToken, setApiBaseUrl, setAuthTokens } from "../../../shared/tauri/client";
import type { AuthTokens } from "../../../shared/types";

type BootstrapStatus = "idle" | "loading" | "ready";

type AuthMode = "login" | "register";

type AuthStoreState = {
  bootstrapStatus: BootstrapStatus;
  hasToken: boolean;
  mode: AuthMode;
  authError: string | null;
  setMode: (mode: AuthMode) => void;
  setAuthError: (message: string | null) => void;
  bootstrap: () => Promise<void>;
  setAuthenticatedTokens: (tokens: AuthTokens) => Promise<void>;
  clearAuthSession: () => Promise<void>;
  markUnauthorized: () => void;
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  bootstrapStatus: "idle",
  hasToken: false,
  mode: "login",
  authError: null,
  setMode: (mode) => set({ mode }),
  setAuthError: (authError) => set({ authError }),
  bootstrap: async () => {
    set({ bootstrapStatus: "loading" });
    try {
      await withTimeout(setApiBaseUrl(API_BASE_URL), 3_000, undefined);
      const accessToken = await withTimeout(getAccessToken(), 3_000, null);
      set({ hasToken: Boolean(accessToken), authError: null });
    } catch {
      set({ hasToken: false });
    } finally {
      set({ bootstrapStatus: "ready" });
    }
  },
  setAuthenticatedTokens: async (tokens) => {
    await setAuthTokens(tokens);
    set({ hasToken: true, authError: null });
  },
  clearAuthSession: async () => {
    await clearAuthTokens();
    set({ hasToken: false, authError: null });
  },
  markUnauthorized: () => {
    set({ hasToken: false, authError: null });
  },
}));
