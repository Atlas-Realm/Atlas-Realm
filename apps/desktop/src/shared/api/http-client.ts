import axios, { AxiosError, type Method } from "axios";
import type { ApiErrorShape, ApiSuccessShape } from "../types";
import { API_BASE_URL } from "../config/env";
import { clearAuthTokens, getAccessToken, refreshAuthTokens } from "../tauri/client";

export class ApiRequestError extends Error {
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

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function notifyUnauthorized() {
  if (unauthorizedHandler) {
    unauthorizedHandler();
  }
}

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

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
    const isAuthMeRequest = path.startsWith("/api/auth/me");
    if (!isAuthMeRequest) {
      const refreshed = await withTimeout(refreshAuthTokens(API_BASE_URL), 3_000, null);
      if (refreshed) {
        return request<T>(path, { ...options, retry: false, auth: true });
      }
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

    throw new ApiRequestError(`Request failed (${response.status})`, response.status);
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
