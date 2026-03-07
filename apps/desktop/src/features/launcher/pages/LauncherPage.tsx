import { Play, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { useLibraryQuery, useSyncLibraryMutation } from "../../library/queries/use-library-queries";
import { useSessionStore } from "../../sessions/store/session-store";

function toHours(totalSeconds: number): string {
  const totalHours = totalSeconds / 3600;
  return `${totalHours.toFixed(1)} h`;
}

export default function LauncherPage() {
  const localSessions = useSessionStore((state) => state.localSessions);
  const libraryQuery = useLibraryQuery();
  const syncMutation = useSyncLibraryMutation();

  const activeSession = localSessions.find((session) => session.is_active);
  const library = libraryQuery.data ?? [];

  const featured = useMemo(() => {
    if (activeSession) {
      return {
        title: activeSession.game_name,
        subtitle: "NOW PLAYING",
      };
    }

    const first = library[0];
    if (!first) {
      return {
        title: "Scan and sync your games",
        subtitle: "READY TO DISCOVER",
      };
    }

    return {
      title: first.game.name,
      subtitle: "QUICK PLAY",
    };
  }, [activeSession, library]);

  return (
    <div className="grid gap-6">
      <section className="hero rounded-3xl border border-base-300 bg-gradient-to-br from-base-200 via-base-200 to-primary/20 shadow-2xl">
        <div className="hero-content py-12 px-8 text-left justify-start">
          <div className="max-w-2xl">
            <p className="badge badge-primary badge-outline mb-4">{featured.subtitle}</p>
            <h1 className="text-4xl md:text-6xl font-black leading-tight">{featured.title}</h1>
            <p className="py-4 opacity-75">Low-latency launcher optimized for fast library actions and instant sync.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" disabled>
                <Play size={16} />
                Play Now
              </button>
              <button type="button" className="btn btn-outline" disabled>
                Details
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void syncMutation.mutateAsync()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw size={16} className={syncMutation.isPending ? "animate-spin" : ""} />
                {syncMutation.isPending ? "Syncing" : "Rescan + Sync"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="card bg-base-200 border border-base-300 shadow-xl">
        <div className="card-body gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="card-title text-2xl">Library Snapshot</h2>
            <span className="badge badge-primary badge-outline">{library.length} games</span>
          </div>

          {libraryQuery.isPending ? (
            <div className="w-full grid place-items-center py-8">
              <span className="loading loading-spinner loading-md text-primary" aria-hidden="true" />
            </div>
          ) : library.length === 0 ? (
            <div className="alert alert-info">
              <span>Your server library is empty. Run sync to import local games.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {library.slice(0, 8).map((item) => (
                <article key={item.library.id} className="card bg-base-100 border border-base-300 shadow-md">
                  <div className="card-body p-4">
                    <h3 className="card-title text-base truncate">{item.game.name}</h3>
                    <p className="text-xs opacity-70">{item.library.platform}</p>
                    <div className="badge badge-outline">{toHours(item.library.totalPlaytimeSeconds)}</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
