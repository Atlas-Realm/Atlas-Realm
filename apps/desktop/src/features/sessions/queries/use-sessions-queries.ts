import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/api/query-keys";
import { useAuthStore } from "../../auth/store/auth-store";
import { sessionsApi } from "../api/sessions-api";

export function useSessionsActiveQuery() {
  const hasToken = useAuthStore((state) => state.hasToken);

  return useQuery({
    queryKey: queryKeys.sessions.active,
    queryFn: sessionsApi.active,
    enabled: hasToken,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useSessionsHistoryQuery() {
  const hasToken = useAuthStore((state) => state.hasToken);

  return useQuery({
    queryKey: queryKeys.sessions.history,
    queryFn: () => sessionsApi.history(30, 0),
    enabled: hasToken,
    staleTime: 60_000,
  });
}

export function useSessionsStatsQuery(gameId: string) {
  const hasToken = useAuthStore((state) => state.hasToken);

  return useQuery({
    queryKey: queryKeys.sessions.stats(gameId),
    queryFn: () => sessionsApi.stats(gameId),
    enabled: hasToken && gameId.length > 0,
    staleTime: 45_000,
  });
}
