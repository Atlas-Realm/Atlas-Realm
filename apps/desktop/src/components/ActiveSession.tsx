import { Flame, Gamepad2, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { GameSession } from "../types";

interface ActiveSessionProps {
  sessions: GameSession[];
}

export default function ActiveSession({ sessions }: ActiveSessionProps) {
  const [elapsed, setElapsed] = useState<{ [key: string]: number }>({});

  // Local timer to update seconds smoothly without waiting for backend
  useEffect(() => {
    const interval = setInterval(() => {
      const newElapsed: { [key: string]: number } = {};
      sessions.forEach((s) => {
        // Calculate rough duration from start time to now
        const start = new Date(s.start_time).getTime();
        const now = new Date().getTime();
        newElapsed[s.game_name] = Math.floor((now - start) / 1000);
      });
      setElapsed(newElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessions]);

  const activeSessions = sessions.filter((s) => s.is_active);

  if (activeSessions.length === 0) return null;

  return (
    <div className="active-session-bar">
      {activeSessions.map((session) => (
        <div key={session.process_id} className="session-item">
          <div className="session-icon-pulse">
            <Gamepad2 size={24} />
            <div className="pulse-ring"></div>
          </div>

          <div className="session-info">
            <span className="label">NOW PLAYING</span>
            <span className="game-title">{session.game_name}</span>
          </div>

          <div className="session-stats">
            <div className="stat">
              <Timer size={16} />
              <span>
                {formatDuration(
                  elapsed[session.game_name] || session.duration_seconds
                )}
              </span>
            </div>
            <div className="stat highlight">
              <Flame size={16} />
              <span>Active</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}
