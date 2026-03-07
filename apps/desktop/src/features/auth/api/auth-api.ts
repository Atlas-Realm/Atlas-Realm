import type { AuthTokens, AuthUser } from "../../../shared/types";
import { API_BASE_URL } from "../../../shared/config/env";
import { request } from "../../../shared/api/http-client";
import { logoutAuth } from "../../../shared/tauri/client";

export const authApi = {
  register(email: string, username: string, password: string) {
    return request<{ user: AuthUser; tokens: AuthTokens }>("/api/auth/register", {
      method: "POST",
      auth: false,
      data: { email, username, password },
    });
  },

  login(email: string, password: string) {
    return request<{ user: AuthUser; tokens: AuthTokens }>("/api/auth/login", {
      method: "POST",
      auth: false,
      data: { email, password },
    });
  },

  me() {
    return request<AuthUser>("/api/auth/me");
  },

  async logout() {
    await logoutAuth(API_BASE_URL);
  },
};
