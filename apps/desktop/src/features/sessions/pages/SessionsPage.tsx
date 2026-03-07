import { useEffect, useMemo, useState } from "react";
import { useLibraryQuery } from "../../library/queries/use-library-queries";
import {
  useSessionsActiveQuery,
  useSessionsHistoryQuery,
  useSessionsStatsQuery,
} from "../queries/use-sessions-queries";
import { useSessionStore } from "../store/session-store";

function durationLabel(seconds: number | null): string {
  if (!seconds || seconds <= 0) {
    return "0m";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function SessionsPage() {
  const localSessions = useSessionStore((state) => state.localSessions);
  const libraryQuery = useLibraryQuery();
  const activeQuery = useSessionsActiveQuery();
  const historyQuery = useSessionsHistoryQuery();

  const [selectedGameId, setSelectedGameId] = useState("");

  const library = libraryQuery.data ?? [];
  const activeLocal = useMemo(() => localSessions.find((session) => session.is_active), [localSessions]);

  useEffect(() => {
    if (!selectedGameId && library.length > 0) {
      setSelectedGameId(library[0].game.id);
    }
  }, [selectedGameId, library]);

  const statsQuery = useSessionsStatsQuery(selectedGameId);

  return (
    <div className="grid gap-6">
      <section className="card bg-base-200 border border-base-300 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">Active Session</h2>
          {activeQuery.isPending ? (
            <div className="w-full grid place-items-center py-6">
              <span className="loading loading-spinner loading-md text-primary" aria-hidden="true" />
            </div>
          ) : activeQuery.data ? (
            <article className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body py-4">
                <p className="text-sm opacity-70">Server Session</p>
                <h3 className="font-bold">{activeQuery.data.gameId}</h3>
                <p>Status: {activeQuery.data.status}</p>
                <p>Duration: {durationLabel(activeQuery.data.durationSeconds)}</p>
              </div>
            </article>
          ) : activeLocal ? (
            <article className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body py-4">
                <p className="text-sm opacity-70">Local Session</p>
                <h3 className="font-bold">{activeLocal.game_name}</h3>
                <p>Status: active</p>
                <p>Duration: {durationLabel(activeLocal.duration_seconds)}</p>
              </div>
            </article>
          ) : (
            <div className="alert alert-info">
              <span>No active session.</span>
            </div>
          )}
        </div>
      </section>

      <section className="card bg-base-200 border border-base-300 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">Recent History</h2>
          {historyQuery.isPending ? (
            <div className="w-full grid place-items-center py-6">
              <span className="loading loading-spinner loading-md text-primary" aria-hidden="true" />
            </div>
          ) : (historyQuery.data?.length ?? 0) === 0 ? (
            <div className="alert alert-info">
              <span>No history yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Started</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(historyQuery.data ?? []).map((session) => (
                    <tr key={session.id}>
                      <td>{session.gameId}</td>
                      <td>{new Date(session.startedAt).toLocaleString()}</td>
                      <td>{durationLabel(session.durationSeconds)}</td>
                      <td>
                        <span className="badge badge-outline">{session.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="card bg-base-200 border border-base-300 shadow-xl">
        <div className="card-body gap-4">
          <h2 className="card-title text-2xl">Game Stats</h2>

          <select
            className="select select-bordered w-full max-w-lg"
            value={selectedGameId}
            onChange={(event) => setSelectedGameId(event.target.value)}
          >
            {library.map((item) => (
              <option key={item.game.id} value={item.game.id}>
                {item.game.name}
              </option>
            ))}
          </select>

          {statsQuery.data ? (
            <div className="stats stats-vertical lg:stats-horizontal shadow border border-base-300 bg-base-100">
              <div className="stat">
                <div className="stat-title">Total Sessions</div>
                <div className="stat-value text-primary">{statsQuery.data.totalSessions}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Total Time</div>
                <div className="stat-value text-secondary">{durationLabel(statsQuery.data.totalDurationSeconds)}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Average</div>
                <div className="stat-value text-accent">{durationLabel(statsQuery.data.averageDurationSeconds)}</div>
              </div>
            </div>
          ) : statsQuery.isPending ? (
            <div className="w-full grid place-items-center py-4">
              <span className="loading loading-spinner loading-md text-primary" aria-hidden="true" />
            </div>
          ) : (
            <div className="alert alert-info">
              <span>Stats unavailable.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
