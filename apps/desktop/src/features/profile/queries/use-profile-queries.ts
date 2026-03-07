import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/api/query-keys";
import { useAuthStore } from "../../auth/store/auth-store";
import { profileApi } from "../api/profile-api";

export function useProfileQuery() {
  const hasToken = useAuthStore((state) => state.hasToken);

  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: profileApi.me,
    enabled: hasToken,
    staleTime: 60_000,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.updateMe,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
      ]);
    },
  });
}
