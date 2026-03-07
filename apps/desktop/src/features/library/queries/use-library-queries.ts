import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryKeys } from "../../../shared/api/query-keys";
import { scanGames, setLibraryIndex } from "../../../shared/tauri/client";
import { buildLibraryIndex, mapDetectedGamesToSyncItems } from "../../../shared/utils/library-sync";
import type { GameSearchResult } from "../../../shared/types";
import { useAuthStore } from "../../auth/store/auth-store";
import { libraryApi } from "../api/library-api";

export function useLibraryQuery() {
  const hasToken = useAuthStore((state) => state.hasToken);

  const query = useQuery({
    queryKey: queryKeys.library.list,
    queryFn: libraryApi.listLibrary,
    enabled: hasToken,
    staleTime: 45_000,
    gcTime: 10 * 60_000,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    void setLibraryIndex(buildLibraryIndex(query.data));
  }, [query.data]);

  useEffect(() => {
    if (!hasToken) {
      void setLibraryIndex([]);
    }
  }, [hasToken]);

  return query;
}

export function useLibrarySearchQuery(query: string, source: "rawg" | "steam", enabled: boolean) {
  const hasToken = useAuthStore((state) => state.hasToken);

  return useQuery<GameSearchResult[]>({
    queryKey: queryKeys.library.search(query, source),
    queryFn: () => libraryApi.searchGames(query, source),
    enabled: hasToken && enabled && query.trim().length > 0,
    staleTime: 30_000,
  });
}

function invalidateLibrary(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.library.list });
}

export function useSyncLibraryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const detected = await scanGames();
      const items = mapDetectedGamesToSyncItems(detected);
      if (items.length > 0) {
        await libraryApi.syncLibrary(items);
      }
      return items.length;
    },
    onSuccess: async () => {
      await invalidateLibrary(queryClient);
    },
  });
}

export function useAddLibraryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: libraryApi.addLibraryItem,
    onSuccess: async () => {
      await invalidateLibrary(queryClient);
    },
  });
}

export function useToggleInstalledMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, isInstalled }: { gameId: string; isInstalled: boolean }) =>
      libraryApi.updateLibraryItem(gameId, { isInstalled: !isInstalled }),
    onSuccess: async () => {
      await invalidateLibrary(queryClient);
    },
  });
}

export function useDeleteLibraryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gameId: string) => libraryApi.deleteLibraryItem(gameId),
    onSuccess: async () => {
      await invalidateLibrary(queryClient);
    },
  });
}
