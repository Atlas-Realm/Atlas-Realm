import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { isAuthenticated, loading, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else if (typeof submitError === "string") {
        setError(submitError);
      } else {
        setError("Request failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <h1>Atlas Realm Desktop</h1>
        <p>Server-first client with secure token storage and local tracking.</p>

        <div className="auth-switch">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={mode === "login" ? "active" : ""}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={mode === "register" ? "active" : ""}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              autoComplete="email"
            />
          </label>

          {mode === "register" ? (
            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                type="text"
                minLength={3}
                maxLength={32}
                required
                autoComplete="username"
              />
            </label>
          ) : null}

          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              minLength={8}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          <button type="submit" disabled={busy}>
            {busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
