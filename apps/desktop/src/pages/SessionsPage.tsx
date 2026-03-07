import { useEffect, useMemo, useState } from "react";
import { sessionsApi } from "../lib/api";
import { useAppData } from "../context/AppDataContext";
import type { SessionModel, SessionStats } from "../types";

function durationLabel(seconds: number | null): string {
  if (!seconds || seconds <= 0) {
    return "0m";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function SessionsPage() {
  const { library, localSessions } = useAppData();
  const [active, setActive] = useState<SessionModel | null>(null);
  const [history, setHistory] = useState<SessionModel[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const activeLocal = useMemo(
    () => localSessions.find((session) => session.is_active),
    [localSessions],
  );

  useEffect(() => {
    if (library.length > 0 && !selectedGameId) {
      setSelectedGameId(library[0].game.id);
    }
  }, [library, selectedGameId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [activeSession, historySessions] = await Promise.all([
          sessionsApi.active(),
          sessionsApi.history(30, 0),
        ]);

        setActive(activeSession);
        setHistory(historySessions);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      if (!selectedGameId) {
        setStats(null);
        return;
      }
      try {
        const nextStats = await sessionsApi.stats(selectedGameId);
        setStats(nextStats);
      } catch {
        setStats(null);
      }
    };

    void loadStats();
  }, [selectedGameId]);

  return (
    <div className="sessions-page">
      <section className="panel">
        <h2>Active Session</h2>
        {loading ? (
          <div className="panel-empty">Loading session data...</div>
        ) : active ? (
          <div className="session-card">
            <strong>Server: {active.gameId}</strong>
            <p>Status: {active.status}</p>
            <p>Duration: {durationLabel(active.durationSeconds)}</p>
          </div>
        ) : activeLocal ? (
          <div className="session-card">
            <strong>Local: {activeLocal.game_name}</strong>
            <p>Status: active</p>
            <p>Duration: {durationLabel(activeLocal.duration_seconds)}</p>
          </div>
        ) : (
          <div className="panel-empty">No active session.</div>
        )}
      </section>

      <section className="panel">
        <h2>Recent History</h2>
        {history.length === 0 ? (
          <div className="panel-empty">No history yet.</div>
        ) : (
          <div className="table-list">
            {history.map((session) => (
              <article key={session.id} className="table-row">
                <div>
                  <strong>{session.gameId}</strong>
                  <p>{new Date(session.startedAt).toLocaleString()}</p>
                </div>
                <div className="row-stats">{durationLabel(session.durationSeconds)}</div>
                <div className="pill">{session.status}</div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Game Stats</h2>
        <select
          value={selectedGameId}
          onChange={(event) => setSelectedGameId(event.target.value)}
          className="stats-select"
        >
          {library.map((item) => (
            <option key={item.game.id} value={item.game.id}>
              {item.game.name}
            </option>
          ))}
        </select>

        {stats ? (
          <div className="stats-grid">
            <article>
              <strong>{stats.totalSessions}</strong>
              <span>Total Sessions</span>
            </article>
            <article>
              <strong>{durationLabel(stats.totalDurationSeconds)}</strong>
              <span>Total Time</span>
            </article>
            <article>
              <strong>{durationLabel(stats.averageDurationSeconds)}</strong>
              <span>Average</span>
            </article>
          </div>
        ) : (
          <div className="panel-empty">Stats unavailable.</div>
        )}
      </section>
    </div>
  );
}
