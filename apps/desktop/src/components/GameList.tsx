import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Gamepad2, Loader2, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { GameMetadata } from "../types";

export default function GameList() {
  const [games, setGames] = useState<GameMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const scanGames = async () => {
    setLoading(true);
    try {
      const result = await invoke<GameMetadata[]>("scan_games");
      setGames(result);
    } catch (error) {
      console.error("Failed to scan games:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scanGames();

    // Listen for real-time metadata updates
    const unlistenPromise = listen<GameMetadata>("metadata-update", (event) => {
      const enrichedGame = event.payload;
      setGames((prevGames) =>
        prevGames.map((g) =>
          g.exe_name === enrichedGame.exe_name ? enrichedGame : g,
        ),
      );
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const filteredGames = games.filter(
    (g) =>
      g.name.toLowerCase().includes(filter.toLowerCase()) ||
      g.platform.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="game-list-container">
      <div className="header">
        <div className="title-group">
          <h2>
            <Gamepad2 className="icon" size={28} /> Library
          </h2>
          <span className="badge">{games.length} detected</span>
        </div>

        <div className="actions">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search games..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <button
            onClick={scanGames}
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <RefreshCw size={18} />
            )}
            <span>Rescan</span>
          </button>
        </div>
      </div>

      {loading && games.length === 0 ? (
        <div className="loading-state">
          <Loader2 className="spin large" size={48} />
          <p>Scanning your system for games...</p>
        </div>
      ) : (
        <div className="grid">
          {filteredGames.length === 0 ? (
            <div className="empty-state">
              <p>No games found matching your search.</p>
            </div>
          ) : (
            filteredGames.map((game, i) => (
              <div key={i} className="game-card">
                <div className="card-bg-glow"></div>

                {game.cover_image ? (
                  <div className="game-cover">
                    <img
                      src={game.cover_image}
                      alt={game.name}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="game-cover-loading">
                    <div className="shimmer"></div>
                    <Loader2 className="spin" size={32} />
                    <span>Enriching...</span>
                  </div>
                )}

                <div className="card-content">
                  {!game.cover_image && (
                    <div className="game-icon-placeholder">
                      {game.icon ? (
                        <img
                          src={game.icon}
                          alt=""
                          className="game-icon-small"
                        />
                      ) : (
                        <Gamepad2 size={32} />
                      )}
                    </div>
                  )}
                  <div className="game-info">
                    <span className="game-name">{game.name}</span>
                    <div className="game-meta-row">
                      <span className="game-platform">{game.platform}</span>
                      {game.developer && (
                        <span className="game-developer">
                          • {game.developer}
                        </span>
                      )}
                    </div>
                    {game.genres && game.genres.length > 0 && (
                      <div className="game-genres">
                        {game.genres.slice(0, 2).map((genre, idx) => (
                          <span key={idx} className="genre-tag">
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {game.description && (
                  <div className="game-card-overlay">
                    <p>{game.description}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
