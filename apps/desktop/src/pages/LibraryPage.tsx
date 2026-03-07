import { RefreshCw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { gamesApi } from "../lib/api";
import { useAppData } from "../context/AppDataContext";
import type { GameSearchResult } from "../types";

function formatHours(totalSeconds: number): string {
  const totalHours = totalSeconds / 3600;
  return `${totalHours.toFixed(1)} h`;
}

export default function LibraryPage() {
  const { library, refreshLibrary, syncLocalLibrary, syncing, libraryLoading } = useAppData();
  const [filter, setFilter] = useState("");
  const [source, setSource] = useState<"rawg" | "steam">("rawg");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredLibrary = useMemo(
    () =>
      library.filter((item) =>
        item.game.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [library, filter],
  );

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const searchResults = await gamesApi.searchGames(query.trim(), source);
      setResults(searchResults);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Search failed");
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async (result: GameSearchResult) => {
    setBusy(true);
    setError(null);

    try {
      await gamesApi.addLibraryItem({
        game: {
          externalId: result.externalId,
          source: result.source,
          name: result.name,
          metadata: result.metadata,
        },
        library: {
          platform: result.source,
          isInstalled: false,
        },
      });
      await refreshLibrary();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Add failed");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleInstalled = async (gameId: string, current: boolean) => {
    setBusy(true);
    setError(null);
    try {
      await gamesApi.updateLibraryItem(gameId, { isInstalled: !current });
      await refreshLibrary();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (gameId: string) => {
    setBusy(true);
    setError(null);
    try {
      await gamesApi.deleteLibraryItem(gameId);
      await refreshLibrary();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="library-page-grid">
      <section className="panel">
        <div className="panel-header">
          <h2>Library Manager</h2>
          <button type="button" onClick={() => void syncLocalLibrary()} className="action-btn">
            <RefreshCw size={16} className={syncing ? "spin" : ""} />
            {syncing ? "Syncing" : "Rescan + Sync"}
          </button>
        </div>

        <label className="inline-search">
          <Search size={16} />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter library"
          />
        </label>

        {libraryLoading ? (
          <div className="panel-empty">Loading...</div>
        ) : filteredLibrary.length === 0 ? (
          <div className="panel-empty">No games found.</div>
        ) : (
          <div className="table-list">
            {filteredLibrary.map((item) => (
              <article key={item.library.id} className="table-row">
                <div>
                  <strong>{item.game.name}</strong>
                  <p>{item.library.platform}</p>
                </div>
                <div className="row-stats">{formatHours(item.library.totalPlaytimeSeconds)}</div>
                <button
                  type="button"
                  className={item.library.isInstalled ? "pill installed" : "pill"}
                  onClick={() => void handleToggleInstalled(item.game.id, item.library.isInstalled)}
                  disabled={busy}
                >
                  {item.library.isInstalled ? "Installed" : "Not Installed"}
                </button>
                <button
                  type="button"
                  className="icon-trash"
                  onClick={() => void handleDelete(item.game.id)}
                  disabled={busy}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Manual Add</h2>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search game"
          />
          <select value={source} onChange={(event) => setSource(event.target.value as "rawg" | "steam")}> 
            <option value="rawg">RAWG</option>
            <option value="steam">Steam</option>
          </select>
          <button type="submit" disabled={busy || query.trim().length === 0}>
            {busy ? "Searching..." : "Search"}
          </button>
        </form>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="search-results">
          {results.map((result) => (
            <article key={`${result.source}:${result.externalId}`} className="result-row">
              <div>
                <strong>{result.name}</strong>
                <p>{result.source}</p>
              </div>
              <button type="button" onClick={() => void handleAdd(result)} disabled={busy}>
                Add
              </button>
            </article>
          ))}
          {results.length === 0 ? <div className="panel-empty">No search results yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
