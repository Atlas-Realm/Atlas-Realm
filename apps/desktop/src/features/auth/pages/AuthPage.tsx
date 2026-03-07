import { useState } from "react";
import { useLoginMutation, useRegisterMutation } from "../queries/use-auth-queries";
import { useAuthStore } from "../store/auth-store";

export default function AuthPage() {
  const mode = useAuthStore((state) => state.mode);
  const authError = useAuthStore((state) => state.authError);
  const setMode = useAuthStore((state) => state.setMode);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const busy = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    try {
      if (mode === "login") {
        await loginMutation.mutateAsync({ email, password });
      } else {
        await registerMutation.mutateAsync({ email, username, password });
      }
    } catch {
      // Error state handled in mutation callbacks.
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-6">
      <article className="card w-full max-w-lg bg-base-200 border border-base-300 shadow-2xl">
        <div className="card-body gap-4">
          <div>
            <h1 className="card-title text-3xl">Atlas Realm Desktop</h1>
            <p className="text-sm opacity-70">High-performance launcher for your synced game library.</p>
          </div>

          <div className="tabs tabs-box bg-base-300">
            <button
              type="button"
              className={`tab flex-1 ${mode === "login" ? "tab-active" : ""}`}
              onClick={() => {
                setMode("login");
                setAuthError(null);
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`tab flex-1 ${mode === "register" ? "tab-active" : ""}`}
              onClick={() => {
                setMode("register");
                setAuthError(null);
              }}
            >
              Register
            </button>
          </div>

          <form className="grid gap-3" onSubmit={handleSubmit}>
            <label className="form-control gap-1">
              <span className="label-text">Email</span>
              <input
                className="input input-bordered"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                autoComplete="email"
              />
            </label>

            {mode === "register" ? (
              <label className="form-control gap-1">
                <span className="label-text">Username</span>
                <input
                  className="input input-bordered"
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

            <label className="form-control gap-1">
              <span className="label-text">Password</span>
              <input
                className="input input-bordered"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                minLength={8}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>

            {authError ? (
              <div role="alert" className="alert alert-error py-2 text-sm">
                <span>{authError}</span>
              </div>
            ) : null}

            <button type="submit" className="btn btn-primary mt-1" disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-sm" aria-hidden="true" /> : null}
              {mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        </div>
      </article>
    </div>
  );
}
