import { Navigate, Outlet } from "react-router-dom";
import { useAuthMeQuery } from "../../features/auth/queries/use-auth-queries";
import { useAuthStore } from "../../features/auth/store/auth-store";
import { LoadingScreen } from "../../shared/ui/loading-screen";

function useAuthGateState() {
  const bootstrapStatus = useAuthStore((state) => state.bootstrapStatus);
  const hasToken = useAuthStore((state) => state.hasToken);
  const meQuery = useAuthMeQuery();

  const bootstrapping = bootstrapStatus !== "ready";
  const resolvingUser = hasToken && meQuery.isPending && !meQuery.data;
  const isAuthenticated = hasToken && Boolean(meQuery.data);

  return {
    bootstrapping,
    resolvingUser,
    isAuthenticated,
    hasToken,
  };
}

export function ProtectedRoute() {
  const { bootstrapping, resolvingUser, isAuthenticated } = useAuthGateState();

  if (bootstrapping || resolvingUser) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

export function AuthOnlyRoute() {
  const { bootstrapping, resolvingUser, isAuthenticated } = useAuthGateState();

  if (bootstrapping || resolvingUser) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
