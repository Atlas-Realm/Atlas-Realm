import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoadingScreen } from "../../shared/ui/loading-screen";
import { AppShell } from "../layout/AppShell";
import { AuthOnlyRoute, ProtectedRoute } from "./guards";

const AuthPage = lazy(() => import("../../features/auth/pages/AuthPage"));
const LauncherPage = lazy(() => import("../../features/launcher/pages/LauncherPage"));
const LibraryPage = lazy(() => import("../../features/library/pages/LibraryPage"));
const LibraryDetailPage = lazy(() => import("../../features/library/pages/LibraryDetailPage"));
const ActivityPage = lazy(() => import("../../features/activity/pages/ActivityPage"));
const ProfilePage = lazy(() => import("../../features/profile/pages/ProfilePage"));
const SettingsPage = lazy(() => import("../../features/settings/pages/SettingsPage"));

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
            <Route path="library/:gameId" element={<LibraryDetailPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
