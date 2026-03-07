import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { GameMetadata, LibraryIndexEntry, LocalSession } from "../types";

export async function scanGames(): Promise<GameMetadata[]> {
  return invoke<GameMetadata[]>("scan_games");
}

export async function setAuthTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  await invoke("set_auth_tokens", {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
}

export async function getAccessToken(): Promise<string | null> {
  return invoke<string | null>("get_access_token");
}

export async function clearAuthTokens(): Promise<void> {
  await invoke("clear_auth_tokens");
}

export async function refreshAuthTokens(apiBaseUrl: string): Promise<string | null> {
  return invoke<string | null>("refresh_auth_tokens", {
    apiBaseUrl,
  });
}

export async function logoutAuth(apiBaseUrl: string): Promise<void> {
  await invoke("logout_auth", {
    apiBaseUrl,
  });
}

export async function setApiBaseUrl(apiBaseUrl: string): Promise<void> {
  await invoke("set_api_base_url", {
    apiBaseUrl,
  });
}

export async function setLibraryIndex(entries: LibraryIndexEntry[]): Promise<void> {
  await invoke("set_library_index", { entries });
}

export async function onSessionUpdate(
  handler: (sessions: LocalSession[]) => void,
): Promise<() => void> {
  return listen<LocalSession[]>("session-update", (event) => {
    handler(event.payload);
  });
}
