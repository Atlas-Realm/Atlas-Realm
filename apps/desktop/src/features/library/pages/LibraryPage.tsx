import { RefreshCw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { GameSearchResult } from "../../../shared/types";
import {
  useAddLibraryItemMutation,
  useDeleteLibraryItemMutation,
  useLibraryQuery,
  useLibrarySearchQuery,
  useSyncLibraryMutation,
  useToggleInstalledMutation,
} from "../queries/use-library-queries";

function formatHours(totalSeconds: number): string {
  const totalHours = totalSeconds / 3600;
  return `${totalHours.toFixed(1)} h`;
}

export default function LibraryPage() {
  const [filter, setFilter] = useState("");
  const [source, setSource] = useState<"rawg" | "steam">("rawg");
  const [query, setQuery] = useState("");
  const [searchRequest, setSearchRequest] = useState<{ query: string; source: "rawg" | "steam" } | null>(
    null,
  );

  const libraryQuery = useLibraryQuery();
  const syncMutation = useSyncLibraryMutation();
  const addMutation = useAddLibraryItemMutation();
  const toggleInstalledMutation = useToggleInstalledMutation();
  const deleteMutation = useDeleteLibraryItemMutation();

  const searchQuery = useLibrarySearchQuery(
    searchRequest?.query ?? "",
    searchRequest?.source ?? "rawg",
    Boolean(searchRequest),
  );

  const library = libraryQuery.data ?? [];

  const filteredLibrary = useMemo(
    () => library.filter((item) => item.game.name.toLowerCase().includes(filter.toLowerCase())),
    [library, filter],
  );

  const busy =
    syncMutation.isPending ||
    addMutation.isPending ||
    toggleInstalledMutation.isPending ||
    deleteMutation.isPending;

  const mutationError =
    syncMutation.error || addMutation.error || toggleInstalledMutation.error || deleteMutation.error;

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    setSearchRequest({ query: trimmed, source });
  };

  const handleAdd = async (result: GameSearchResult) => {
    await addMutation.mutateAsync({
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
  };

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6">
      <section className="card bg-base-200 border border-base-300 shadow-xl">
        <div className="card-body gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="card-title text-2xl">Library Manager</h2>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void syncMutation.mutateAsync()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw size={16} className={syncMutation.isPending ? "animate-spin" : ""} />
              {syncMutation.isPending ? "Syncing" : "Rescan + Sync"}
            </button>
          </div>

          <label className="input input-bordered flex items-center gap-2">
            <Search size={16} className="opacity-60" />
            <input
              className="grow"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter library"
            />
          </label>

          {libraryQuery.isPending ? (
            <div className="w-full grid place-items-center py-8">
              <span className="loading loading-spinner loading-md text-primary" aria-hidden="true" />
            </div>
          ) : filteredLibrary.length === 0 ? (
            <div className="alert alert-info">
              <span>No games found.</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Platform</th>
                    <th>Playtime</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLibrary.map((item) => (
                    <tr key={item.library.id}>
                      <td className="font-medium">{item.game.name}</td>
                      <td>{item.library.platform}</td>
                      <td>{formatHours(item.library.totalPlaytimeSeconds)}</td>
                      <td>
                        <button
                          type="button"
                          className={`badge cursor-pointer ${
                            item.library.isInstalled ? "badge-primary" : "badge-outline"
                          }`}
                          onClick={() =>
                            void toggleInstalledMutation.mutateAsync({
                              gameId: item.game.id,
                              isInstalled: item.library.isInstalled,
                            })
                          }
                          disabled={busy}
                        >
                          {item.library.isInstalled ? "Installed" : "Not Installed"}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => void deleteMutation.mutateAsync(item.game.id)}
                          disabled={busy}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {mutationError ? (
            <div role="alert" className="alert alert-error py-2 text-sm">
              <span>{mutationError instanceof Error ? mutationError.message : "Request failed"}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="card bg-base-200 border border-base-300 shadow-xl">
        <div className="card-body gap-4">
          <h2 className="card-title text-2xl">Manual Add</h2>

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_160px_auto] gap-2">
            <input
              className="input input-bordered"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search game"
            />
            <select
              className="select select-bordered"
              value={source}
              onChange={(event) => setSource(event.target.value as "rawg" | "steam")}
            >
              <option value="rawg">RAWG</option>
              <option value="steam">Steam</option>
            </select>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={query.trim().length === 0 || searchQuery.isFetching}
            >
              {searchQuery.isFetching ? "Searching" : "Search"}
            </button>
          </form>

          {searchQuery.error ? (
            <div role="alert" className="alert alert-error py-2 text-sm">
              <span>{searchQuery.error instanceof Error ? searchQuery.error.message : "Search failed"}</span>
            </div>
          ) : null}

          <div className="grid gap-2">
            {(searchQuery.data ?? []).map((result) => (
              <article
                key={`${result.source}:${result.externalId}`}
                className="card bg-base-100 border border-base-300 shadow-sm"
              >
                <div className="card-body py-3 px-4 flex-row items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{result.name}</h3>
                    <p className="text-xs opacity-70 uppercase tracking-wide">{result.source}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => void handleAdd(result)}
                    disabled={addMutation.isPending}
                  >
                    Add
                  </button>
                </div>
              </article>
            ))}

            {!searchQuery.isFetching && (searchQuery.data?.length ?? 0) === 0 ? (
              <div className="alert alert-info">
                <span>No search results yet.</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
