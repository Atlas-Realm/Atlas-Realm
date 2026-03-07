import { request } from "../../../shared/api/http-client";
import type { GameSearchResult, LibraryItem } from "../../../shared/types";

export const libraryApi = {
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

  searchGames(query: string, source: "rawg" | "steam") {
    const params = new URLSearchParams({ q: query, source });
    return request<GameSearchResult[]>(`/api/games/search?${params.toString()}`);
  },
};
