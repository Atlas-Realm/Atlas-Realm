import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import ShellLayout from "./components/ShellLayout";
import { AppDataProvider } from "./context/AppDataContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import ProfilePage from "./pages/ProfilePage";
import SessionsPage from "./pages/SessionsPage";

function ProtectedShell() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <ShellLayout />;
}

function AuthRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <AuthPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthRoute />} />
      <Route path="/" element={<ProtectedShell />}>
        <Route index element={<HomePage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="sessions" element={<SessionsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <AppRoutes />
      </AppDataProvider>
    </AuthProvider>
  );
}

export default App;
