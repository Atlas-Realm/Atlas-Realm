import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/api/query-keys";
import { useAuthStore } from "../../auth/store/auth-store";
import { socialApi } from "../api/social-api";

export function useFriendsQuery() {
  const hasToken = useAuthStore((state) => state.hasToken);

  return useQuery({
    queryKey: queryKeys.social.friends,
    queryFn: socialApi.listFriends,
    enabled: hasToken,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function usePendingFriendRequestsQuery() {
  const hasToken = useAuthStore((state) => state.hasToken);

  return useQuery({
    queryKey: queryKeys.social.pendingRequests,
    queryFn: socialApi.listPendingRequests,
    enabled: hasToken,
    staleTime: 20_000,
    placeholderData: (previous) => previous,
  });
}
