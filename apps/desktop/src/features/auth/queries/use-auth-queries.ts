import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/api/query-keys";
import { authApi } from "../api/auth-api";
import { useAuthStore } from "../store/auth-store";

export function useAuthMeQuery() {
  const hasToken = useAuthStore((state) => state.hasToken);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.me,
    enabled: hasToken,
    staleTime: 60_000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setAuthenticatedTokens = useAuthStore((state) => state.setAuthenticatedTokens);
  const setAuthError = useAuthStore((state) => state.setAuthError);

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: async (response) => {
      await setAuthenticatedTokens(response.tokens);
      queryClient.setQueryData(queryKeys.auth.me, response.user);
      setAuthError(null);
    },
    onError: (error) => {
      setAuthError(error instanceof Error ? error.message : "Login failed");
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const setAuthenticatedTokens = useAuthStore((state) => state.setAuthenticatedTokens);
  const setAuthError = useAuthStore((state) => state.setAuthError);

  return useMutation({
    mutationFn: ({ email, username, password }: { email: string; username: string; password: string }) =>
      authApi.register(email, username, password),
    onSuccess: async (response) => {
      await setAuthenticatedTokens(response.tokens);
      queryClient.setQueryData(queryKeys.auth.me, response.user);
      setAuthError(null);
    },
    onError: (error) => {
      setAuthError(error instanceof Error ? error.message : "Register failed");
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const clearAuthSession = useAuthStore((state) => state.clearAuthSession);

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      await clearAuthSession();
      queryClient.clear();
    },
  });
}
