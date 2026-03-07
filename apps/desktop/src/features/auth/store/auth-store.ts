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
      await setApiBaseUrl(API_BASE_URL);
      const accessToken = await getAccessToken();
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
