import axios, { AxiosError, type Method } from "axios";
import type {
  ApiErrorShape,
  ApiSuccessShape,
  AuthTokens,
  AuthUser,
  GameSearchResult,
  LibraryItem,
  SessionModel,
  SessionStats,
  UserProfile,
} from "../types";
import { API_BASE_URL } from "./env";
import {
  clearAuthTokens,
  getAccessToken,
  logoutAuth,
  refreshAuthTokens,
} from "./tauri";

class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: Method;
  auth?: boolean;
  retry?: boolean;
  data?: unknown;
};

let unauthorizedHandler: (() => void) | null = null;

function notifyUnauthorized() {
  if (unauthorizedHandler) {
    unauthorizedHandler();
  }
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: () => true,
});

function isSuccessEnvelope<T>(payload: unknown): payload is ApiSuccessShape<T> {
  return (
    !!payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as { success?: boolean }).success === true
  );
}

function isErrorEnvelope(payload: unknown): payload is ApiErrorShape {
  return (
    !!payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as { success?: boolean }).success === false
  );
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const auth = options.auth ?? true;
  const retry = options.retry ?? true;

  const headers: Record<string, string> = {};
  if (auth) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await http.request<unknown>({
      url: path,
      method,
      data: options.data,
      headers,
    });
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiRequestError(axiosError.message, 0, "NETWORK_ERROR");
  }

  if (response.status === 401 && auth && retry) {
    const refreshed = await refreshAuthTokens(API_BASE_URL);
    if (refreshed) {
      return request<T>(path, { ...options, retry: false, auth: true });
    }
    void clearAuthTokens();
    notifyUnauthorized();
    throw new ApiRequestError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const payload = response.data;
  if (response.status < 200 || response.status >= 300) {
    if (response.status === 401 && auth) {
      void clearAuthTokens();
      notifyUnauthorized();
      throw new ApiRequestError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (isErrorEnvelope(payload)) {
      throw new ApiRequestError(
        payload.error || `Request failed (${response.status})`,
        response.status,
        payload.code,
      );
    }

    throw new ApiRequestError(
      `Request failed (${response.status})`,
      response.status,
    );
  }

  if (isSuccessEnvelope<T>(payload)) {
    return payload.data;
  }

  if (isErrorEnvelope(payload)) {
    throw new ApiRequestError(
      payload.error || `Request failed (${response.status})`,
      response.status,
      payload.code,
    );
  }

  return payload as T;
}

export const authApi = {
  register(email: string, username: string, password: string) {
    return request<{ user: AuthUser; tokens: AuthTokens }>(
      "/api/auth/register",
      {
        method: "POST",
        auth: false,
        data: { email, username, password },
      },
    );
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

export const usersApi = {
  me() {
    return request<UserProfile>("/api/users/me");
  },

  updateMe(input: {
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  }) {
    return request<UserProfile>("/api/users/me", {
      method: "PATCH",
      data: input,
    });
  },
};

export const gamesApi = {
  listLibrary() {
    return request<LibraryItem[]>("/api/games/library");
  },

  syncLibrary(
    items: Array<{
      game: Record<string, unknown>;
      library?: Record<string, unknown>;
    }>,
  ) {
    return request<{ synced: number }>("/api/games/library/sync", {
      method: "POST",
      data: { items },
    });
  },

  addLibraryItem(payload: {
    game: Record<string, unknown>;
    library?: Record<string, unknown>;
  }) {
    return request<LibraryItem>("/api/games/library", {
      method: "POST",
      data: payload,
    });
  },

  updateLibraryItem(
    gameId: string,
    payload: {
      platform?: string;
      isInstalled?: boolean;
      installPath?: string | null;
      lastPlayedAt?: string | null;
      totalPlaytimeSeconds?: number;
    },
  ) {
    return request<LibraryItem>(`/api/games/library/${gameId}`, {
      method: "PATCH",
      data: payload,
    });
  },

  deleteLibraryItem(gameId: string) {
    return request<{ deleted: true }>(`/api/games/library/${gameId}`, {
      method: "DELETE",
    });
  },

  searchGames(query: string, source: "rawg" | "steam" = "rawg") {
    const params = new URLSearchParams({ q: query, source });
    return request<GameSearchResult[]>(
      `/api/games/search?${params.toString()}`,
    );
  },
};

export const sessionsApi = {
  active() {
    return request<SessionModel | null>("/api/sessions/active");
  },

  history(limit = 50, offset = 0) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return request<SessionModel[]>(
      `/api/sessions/history?${params.toString()}`,
    );
  },

  stats(gameId: string) {
    return request<SessionStats>(`/api/sessions/stats/${gameId}`);
  },
};

export { ApiRequestError };
