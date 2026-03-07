import { Play, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { useAppData } from "../context/AppDataContext";

function toHours(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  if (hours > 0) {
    return `${hours} hours played`;
  }
  const minutes = Math.max(1, Math.floor(totalSeconds / 60));
  return `${minutes} minutes played`;
}

export default function HomePage() {
  const { library, libraryLoading, syncing, syncLocalLibrary, localSessions } = useAppData();

  const activeSession = localSessions.find((session) => session.is_active);
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
        title: "Sync your local games",
        subtitle: "READY TO DISCOVER",
      };
    }

    return {
      title: first.game.name,
      subtitle: "RECENTLY PLAYED",
    };
  }, [activeSession, library]);

  return (
    <div className="home-page">
      <section className="hero-card">
        <div className="hero-backdrop" />
        <div className="hero-overlay">
          <span className="hero-eyebrow">{featured.subtitle}</span>
          <h1>{featured.title}</h1>
          <div className="hero-actions">
            <button type="button" className="primary-btn" disabled>
              <Play size={16} />
              Play Now
            </button>
            <button type="button" className="secondary-btn" disabled>
              Details
            </button>
            <button type="button" className="ghost-btn" onClick={() => void syncLocalLibrary()}>
              <RefreshCw size={16} className={syncing ? "spin" : ""} />
              {syncing ? "Syncing..." : "Rescan + Sync"}
            </button>
          </div>
        </div>
      </section>

      <section className="library-preview">
        <div className="section-title-row">
          <h2>My Library</h2>
          <span>{library.length} games</span>
        </div>

        {libraryLoading ? (
          <div className="panel-empty">Loading library...</div>
        ) : library.length === 0 ? (
          <div className="panel-empty">No games in your server library yet.</div>
        ) : (
          <div className="game-grid">
            {library.slice(0, 8).map((item) => (
              <article key={item.library.id} className="game-tile">
                <div className="game-art" />
                <h3>{item.game.name}</h3>
                <p>{toHours(item.library.totalPlaytimeSeconds)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
