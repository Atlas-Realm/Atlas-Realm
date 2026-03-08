import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/api/query-keys";
import { useAuthStore } from "../../auth/store/auth-store";
import { notificationsApi } from "../api/notifications-api";

export function useNotificationsQuery(limit = 20, offset = 0) {
  const hasToken = useAuthStore((state) => state.hasToken);

  return useQuery({
    queryKey: queryKeys.notifications.list(limit, offset),
    queryFn: () => notificationsApi.list(limit, offset),
    enabled: hasToken,
    staleTime: 20_000,
    placeholderData: (previous) => previous,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
