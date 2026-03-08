import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/api/query-keys";
import { useAuthStore } from "../../auth/store/auth-store";
import { activitiesApi } from "../api/activities-api";

export function useActivityFeedQuery(limit = 20, offset = 0) {
  const hasToken = useAuthStore((state) => state.hasToken);

  return useQuery({
    queryKey: queryKeys.activities.feed(limit, offset),
    queryFn: () => activitiesApi.feed(limit, offset),
    enabled: hasToken,
    staleTime: 20_000,
    placeholderData: (previous) => previous,
  });
}

export function useMyActivityQuery(limit = 20, offset = 0) {
  const hasToken = useAuthStore((state) => state.hasToken);

  return useQuery({
    queryKey: queryKeys.activities.me(limit, offset),
    queryFn: () => activitiesApi.me(limit, offset),
    enabled: hasToken,
    staleTime: 20_000,
    placeholderData: (previous) => previous,
  });
}
