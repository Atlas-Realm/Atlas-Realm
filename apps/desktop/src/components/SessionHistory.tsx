import { Calendar, Clock, History } from "lucide-react";
import { GameSession } from "../types";

interface SessionHistoryProps {
  sessions: GameSession[];
}

export default function SessionHistory({ sessions }: SessionHistoryProps) {
  const inactiveSessions = sessions
    .filter((s) => !s.is_active)
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

  if (inactiveSessions.length === 0) return null;

  return (
    <div className="session-history">
      <div className="section-header">
        <History size={20} />
        <h2>Recent Sessions</h2>
      </div>
      <div className="history-list">
        {inactiveSessions.map((session, idx) => (
          <div key={session.id || idx} className="history-item">
            <div className="history-main">
              <span className="game-name">{session.game_name}</span>
              <div className="history-meta">
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>
                    {new Date(session.start_time).toLocaleDateString()}
                  </span>
                </div>
                <div className="meta-item">
                  <Clock size={14} />
                  <span>{formatDuration(session.duration_seconds)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
