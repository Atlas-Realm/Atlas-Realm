import { ArrowRight, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useNotificationsQuery } from "../../notifications/queries/use-notifications-queries";
import { useI18n } from "../../../shared/i18n/i18n-provider";
import { formatHours, formatRelativeTime, notificationUnreadCount, resolveGameImage } from "../../../shared/utils/ui-format";
import { useLibraryQuery, useSyncLibraryMutation } from "../../library/queries/use-library-queries";
import { useSessionStore } from "../../sessions/store/session-store";

export default function LauncherPage() {
  const { t, locale } = useI18n();
  const localSessions = useSessionStore((state) => state.localSessions);
  const libraryQuery = useLibraryQuery();
  const syncMutation = useSyncLibraryMutation();
  const notificationsQuery = useNotificationsQuery(5, 0);

  const activeSession = localSessions.find((session) => session.is_active);
  const library = libraryQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];

  const featured = useMemo(() => {
    if (activeSession) {
      return {
        title: activeSession.game_name,
        badge: t("home.badge.nowPlaying"),
        description: t("home.description"),
        image: resolveGameImage(library.find((item) => item.game.name === activeSession.game_name)?.game ?? library[0]?.game),
      };
    }

    if (library.length === 0) {
      return {
        title: t("home.title.empty"),
        badge: t("home.badge.ready"),
        description: t("home.description"),
        image: null,
      };
    }

    return {
      title: library[0].game.name,
      badge: t("home.badge.quickPlay"),
      description: t("home.description"),
      image: resolveGameImage(library[0].game),
    };
  }, [activeSession, library, t]);

  const installedCount = library.filter((item) => item.library.isInstalled).length;
  const totalPlaytime = library.reduce((sum, item) => sum + item.library.totalPlaytimeSeconds, 0);
  const latestPlayed = [...library]
    .filter((item) => item.library.lastPlayedAt)
    .sort(
      (left, right) =>
        new Date(right.library.lastPlayedAt ?? 0).getTime() - new Date(left.library.lastPlayedAt ?? 0).getTime(),
    )[0];

  return (
    <div className="grid gap-6">
      <section className="atlas-hero-card overflow-hidden rounded-[2rem] border border-white/10 p-6 md:p-8">
        <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1.45fr)_22rem]">
          <div className="relative z-10 max-w-3xl">
            <span className="atlas-pill mb-5 inline-flex">{featured.badge}</span>
            <h1 className="max-w-3xl text-4xl font-black uppercase leading-none text-white sm:text-5xl lg:text-6xl">
              {featured.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">{featured.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn atlas-primary-btn"
                onClick={() => void syncMutation.mutateAsync()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw size={16} className={syncMutation.isPending ? "animate-spin" : ""} />
                {syncMutation.isPending ? t("home.primaryActionBusy") : t("home.primaryAction")}
              </button>
              <Link to="/library" className="btn atlas-secondary-btn">
                {t("home.secondaryAction")}
              </Link>
            </div>
          </div>

          <div className="atlas-glass-panel grid gap-3 p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("home.quickStats")}</p>
            {[
              [t("home.totalGames"), String(library.length)],
              [t("home.installed"), String(installedCount)],
              [t("home.totalHours"), formatHours(totalPlaytime)],
              [t("home.activeSession"), activeSession ? activeSession.game_name : t("common.never")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-white/38">{label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {featured.image ? <div className="atlas-hero-image" style={{ backgroundImage: `url(${featured.image})` }} /> : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,24rem)]">
        <article className="atlas-glass-panel p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">{t("home.continue")}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{t("home.snapshot")}</h2>
            </div>
            <Link to="/library" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              {t("home.viewAll")}
              <ArrowRight size={15} />
            </Link>
          </div>

          {libraryQuery.isPending ? (
            <div className="atlas-empty-state">{t("common.loading")}...</div>
          ) : library.length === 0 ? (
            <div className="atlas-empty-state">{t("home.noLibrary")}</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {library.slice(0, 6).map((item) => (
                <Link
                  key={item.library.id}
                  to={`/library/${item.game.id}`}
                  className="group rounded-[1.75rem] border border-white/10 bg-black/10 p-3 transition hover:border-primary/30 hover:bg-white/6"
                >
                  <div
                    className="aspect-[16/10] rounded-[1.4rem] bg-base-300 bg-cover bg-center"
                    style={resolveGameImage(item.game) ? { backgroundImage: `url(${resolveGameImage(item.game)})` } : undefined}
                  />
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-white">{item.game.name}</h3>
                      <p className="text-sm text-white/55">{item.library.platform}</p>
                    </div>
                    <span className="atlas-pill shrink-0">{formatHours(item.library.totalPlaytimeSeconds)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>

        <div className="grid gap-6">
          <article className="atlas-glass-panel p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">{t("home.overview")}</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
                <p className="text-sm text-white/55">{t("home.lastPlayed")}</p>
                <p className="mt-2 text-lg font-semibold text-white">{latestPlayed?.game.name ?? t("common.never")}</p>
                <p className="mt-1 text-sm text-white/45">
                  {latestPlayed?.library.lastPlayedAt
                    ? formatRelativeTime(latestPlayed.library.lastPlayedAt, locale)
                    : t("common.never")}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
                <p className="text-sm text-white/55">{t("home.notifications")}</p>
                <p className="mt-2 text-lg font-semibold text-white">{notificationUnreadCount(notifications)}</p>
                <p className="mt-1 text-sm text-white/45">{notifications[0]?.title ?? t("shell.noNotifications")}</p>
              </div>
            </div>
          </article>

          <article className="atlas-glass-panel p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">{t("home.notifications")}</p>
              <span className="atlas-pill">{notifications.length}</span>
            </div>
            <div className="grid gap-2">
              {notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="rounded-[1.35rem] border border-white/10 bg-black/10 px-4 py-3">
                  <p className="font-medium text-white">{notification.title}</p>
                  <p className="mt-1 text-sm text-white/55">{notification.message}</p>
                </div>
              ))}
              {notifications.length === 0 ? <div className="atlas-empty-state">{t("shell.noNotifications")}</div> : null}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
