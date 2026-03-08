import { useEffect, useMemo, useState } from "react";
import { useAuthMeQuery, useLogoutMutation } from "../../auth/queries/use-auth-queries";
import { useI18n } from "../../../shared/i18n/i18n-provider";
import { displayName, formatDate } from "../../../shared/utils/ui-format";
import { useLibraryQuery } from "../../library/queries/use-library-queries";
import { useProfileQuery, useUpdateProfileMutation } from "../queries/use-profile-queries";

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { data: authUser } = useAuthMeQuery();
  const profileQuery = useProfileQuery();
  const libraryQuery = useLibraryQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const logoutMutation = useLogoutMutation();

  const [displayNameInput, setDisplayNameInput] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profileQuery.data) return;
    setDisplayNameInput(profileQuery.data.displayName || "");
    setBio(profileQuery.data.bio || "");
    setAvatarUrl(profileQuery.data.avatarUrl || "");
  }, [profileQuery.data]);

  const summary = useMemo(() => {
    const library = libraryQuery.data ?? [];
    return {
      totalGames: library.length,
      totalHours: Math.round(library.reduce((sum, item) => sum + item.library.totalPlaytimeSeconds, 0) / 3600),
      installed: library.filter((item) => item.library.isInstalled).length,
    };
  }, [libraryQuery.data]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    try {
      await updateProfileMutation.mutateAsync({
        displayName: displayNameInput || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
      });
      setMessage(t("profile.updated"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("profile.updateFailed"));
    }
  };

  // TODO(api-gap): profile analytics cards below use dummy values until dedicated profile metrics endpoints exist.
  const dummyVibe = summary.totalGames > 10 ? "Late-night RPG" : "Fresh collection";
  const dummyFocus = summary.installed > 0 ? "Backlog cleanup" : "Discovery mode";
  const dummyLevel = Math.max(4, summary.totalGames * 2 + 7);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,26rem)]">
      <section className="grid gap-6">
        <article className="atlas-glass-panel p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="avatar atlas-avatar-ring">
                <div className="w-24 rounded-[1.75rem] bg-base-300">
                  {(avatarUrl || profileQuery.data?.avatarUrl || authUser?.avatarUrl) ? (
                    <img src={avatarUrl || profileQuery.data?.avatarUrl || authUser?.avatarUrl || ""} alt={displayName(authUser ?? {})} />
                  ) : null}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("profile.title")}</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">
                  {displayName(profileQuery.data ?? authUser ?? { username: t("nav.profile") })}
                </h1>
                <p className="mt-2 text-sm text-white/55">{authUser?.email}</p>
              </div>
            </div>
            <button
              type="button"
              className="btn atlas-secondary-btn"
              onClick={() => void logoutMutation.mutateAsync()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? t("profile.loggingOut") : t("profile.logout")}
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              [t("home.totalGames"), String(summary.totalGames)],
              [t("home.totalHours"), `${summary.totalHours}h`],
              [t("profile.launcherLevel"), String(dummyLevel)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
                <p className="text-sm text-white/55">{label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="atlas-glass-panel p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("profile.edit")}</p>

          {profileQuery.isPending ? (
            <div className="atlas-empty-state mt-4">{t("common.loading")}...</div>
          ) : (
            <form className="mt-4 grid gap-4" onSubmit={handleSave}>
              <label className="grid gap-2 text-sm text-white/70">
                <span>{t("profile.displayName")}</span>
                <input className="atlas-input-shell" value={displayNameInput} onChange={(event) => setDisplayNameInput(event.target.value)} maxLength={64} />
              </label>
              <label className="grid gap-2 text-sm text-white/70">
                <span>{t("profile.bio")}</span>
                <textarea className="atlas-textarea-shell" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={280} rows={5} />
              </label>
              <label className="grid gap-2 text-sm text-white/70">
                <span>{t("profile.avatarUrl")}</span>
                <input className="atlas-input-shell" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} type="url" />
              </label>
              <button type="submit" className="btn atlas-primary-btn w-full sm:w-fit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? t("profile.saving") : t("profile.save")}
              </button>
            </form>
          )}

          {message ? <div className="alert alert-info mt-4 rounded-[1.25rem] border border-primary/20 bg-primary/10 text-sm text-white/80">{message}</div> : null}
          {profileQuery.error ? (
            <div role="alert" className="alert alert-error mt-4 rounded-[1.25rem] border border-error/25 bg-error/10 text-sm">
              <span>{profileQuery.error instanceof Error ? profileQuery.error.message : t("profile.updateFailed")}</span>
            </div>
          ) : null}
        </article>
      </section>

      <aside className="grid gap-6">
        <article className="atlas-glass-panel p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("profile.accountSummary")}</p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
              <p className="text-sm text-white/55">{t("profile.memberSince")}</p>
              <p className="mt-2 text-white">{formatDate(profileQuery.data?.createdAt, locale)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
              <p className="text-sm text-white/55">{t("profile.favoriteGenre")}</p>
              <p className="mt-2 text-white">{dummyVibe}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
              <p className="text-sm text-white/55">{t("profile.currentFocus")}</p>
              <p className="mt-2 text-white">{dummyFocus}</p>
            </div>
          </div>
          <div className="alert alert-info mt-4 rounded-[1.25rem] border border-primary/20 bg-primary/10 text-sm text-white/80">
            <span>{t("profile.todoStats")}</span>
          </div>
        </article>
      </aside>
    </div>
  );
}
