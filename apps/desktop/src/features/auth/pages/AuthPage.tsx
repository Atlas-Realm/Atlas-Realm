import { useState } from "react";
import { useI18n } from "../../../shared/i18n/i18n-provider";
import { useLoginMutation, useRegisterMutation } from "../queries/use-auth-queries";
import { useAuthStore } from "../store/auth-store";

export default function AuthPage() {
  const { t } = useI18n();
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
      // Error state is handled in mutation callbacks.
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 shadow-2xl backdrop-blur-xl lg:grid-cols-[minmax(0,1.1fr)_28rem]">
          <section className="atlas-auth-stage hidden min-h-[42rem] p-10 lg:flex lg:flex-col lg:justify-end">
            <span className="atlas-pill mb-6 inline-flex w-fit">Atlas Realm</span>
            <h1 className="max-w-lg text-5xl font-black uppercase leading-none text-white">{t("auth.title")}</h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-white/70">{t("auth.subtitle")}</p>
          </section>

          <article className="p-6 md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">Atlas Realm</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">{mode === "login" ? t("auth.login") : t("auth.register")}</h2>
            </div>

            <div className="mt-6 inline-flex rounded-full border border-white/10 bg-black/10 p-1">
              <button
                type="button"
                className={`atlas-icon-switch px-5 ${mode === "login" ? "is-active" : ""}`}
                onClick={() => {
                  setMode("login");
                  setAuthError(null);
                }}
              >
                {t("auth.login")}
              </button>
              <button
                type="button"
                className={`atlas-icon-switch px-5 ${mode === "register" ? "is-active" : ""}`}
                onClick={() => {
                  setMode("register");
                  setAuthError(null);
                }}
              >
                {t("auth.register")}
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm text-white/70">
                <span>{t("auth.email")}</span>
                <input className="atlas-input-shell" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" />
              </label>

              {mode === "register" ? (
                <label className="grid gap-2 text-sm text-white/70">
                  <span>{t("auth.username")}</span>
                  <input
                    className="atlas-input-shell"
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

              <label className="grid gap-2 text-sm text-white/70">
                <span>{t("auth.password")}</span>
                <input
                  className="atlas-input-shell"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  minLength={8}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </label>

              {authError ? (
                <div role="alert" className="alert alert-error rounded-[1.25rem] border border-error/25 bg-error/10 text-sm">
                  <span>{authError}</span>
                </div>
              ) : null}

              <button type="submit" className="btn atlas-primary-btn mt-2" disabled={busy}>
                {mode === "login" ? (busy ? t("auth.loggingIn") : t("auth.login")) : busy ? t("auth.creatingAccount") : t("auth.createAccount")}
              </button>
            </form>
          </article>
        </div>
      </div>
    </div>
  );
}
