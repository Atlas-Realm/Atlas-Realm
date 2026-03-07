import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../layout/AppShell";
import { LoadingScreen } from "../../shared/ui/loading-screen";
import { AuthOnlyRoute, ProtectedRoute } from "./guards";

const AuthPage = lazy(() => import("../../features/auth/pages/AuthPage"));
const LauncherPage = lazy(() => import("../../features/launcher/pages/LauncherPage"));
const LibraryPage = lazy(() => import("../../features/library/pages/LibraryPage"));
const SessionsPage = lazy(() => import("../../features/sessions/pages/SessionsPage"));
const ProfilePage = lazy(() => import("../../features/profile/pages/ProfilePage"));

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<AuthOnlyRoute />}>
          <Route path="/auth" element={<AuthPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppShell />}>
            <Route index element={<LauncherPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
