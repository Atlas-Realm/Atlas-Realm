import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, setUnauthorizedHandler } from "../lib/api";
import { API_BASE_URL } from "../lib/env";
import { clearAuthTokens, getAccessToken, setApiBaseUrl, setAuthTokens } from "../lib/tauri";
import type { AuthUser } from "../types";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await setApiBaseUrl(API_BASE_URL);
        const accessToken = await getAccessToken();
        if (!accessToken) {
          setUser(null);
          return;
        }
        await refreshUser();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [refreshUser]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setLoading(false);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    await setAuthTokens(response.tokens);
    setUser(response.user);
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    const response = await authApi.register(email, username, password);
    await setAuthTokens(response.tokens);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      await clearAuthTokens();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
