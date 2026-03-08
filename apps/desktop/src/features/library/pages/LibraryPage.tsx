import { Grid2X2, List, RefreshCw, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { GameSearchResult } from "../../../shared/types";
import { useI18n } from "../../../shared/i18n/i18n-provider";
import { deriveCategory, formatHours, resolveGameImage } from "../../../shared/utils/ui-format";
import { useUiStore } from "../../ui/store/ui-store";
import {
  useAddLibraryItemMutation,
  useDeleteLibraryItemMutation,
  useLibraryQuery,
  useLibrarySearchQuery,
  useSyncLibraryMutation,
  useToggleInstalledMutation,
} from "../queries/use-library-queries";

export default function LibraryPage() {
  const { t } = useI18n();
  const defaultLibraryView = useUiStore((state) => state.defaultLibraryView);

  const [filter, setFilter] = useState("");
  const [platform, setPlatform] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"grid" | "list">(defaultLibraryView);
  const [source, setSource] = useState<"rawg" | "steam">("rawg");
  const [query, setQuery] = useState("");
  const [searchRequest, setSearchRequest] = useState<{ query: string; source: "rawg" | "steam" } | null>(null);

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

  useEffect(() => {
    setView(defaultLibraryView);
  }, [defaultLibraryView]);

  const library = libraryQuery.data ?? [];
  const platformOptions = useMemo(
    () => Array.from(new Set(library.map((item) => item.library.platform))).sort(),
    [library],
  );
  const categoryOptions = useMemo(
    () => Array.from(new Set(library.map((item) => deriveCategory(item)))).sort(),
    [library],
  );

  const filteredLibrary = useMemo(() => {
    return library.filter((item) => {
      const matchesQuery = item.game.name.toLowerCase().includes(filter.toLowerCase());
      const matchesPlatform = platform === "all" || item.library.platform === platform;
      const itemCategory = deriveCategory(item);
      const matchesCategory = category === "all" || itemCategory === category;
      const matchesStatus =
        status === "all" ||
        (status === "installed" && item.library.isInstalled) ||
        (status === "not-installed" && !item.library.isInstalled);

      return matchesQuery && matchesPlatform && matchesCategory && matchesStatus;
    });
  }, [library, filter, platform, category, status]);

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
    if (!trimmed) return;
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
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,25rem)]">
      <section className="atlas-glass-panel p-5 md:p-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("library.title")}</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{t("library.subtitle")}</h1>
            <p className="mt-2 text-sm text-white/55">
              {library.length} {t("library.total")} • {filteredLibrary.length} {t("library.filtered")}
            </p>
          </div>
          <button
            type="button"
            className="btn atlas-primary-btn"
            onClick={() => void syncMutation.mutateAsync()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw size={16} className={syncMutation.isPending ? "animate-spin" : ""} />
            {t("library.rescan")}
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,0.72fr))]">
          <label className="atlas-input-shell lg:col-span-2">
            <Search size={16} className="text-white/45" />
            <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder={t("library.search")} />
          </label>
          <select className="atlas-select-shell" value={platform} onChange={(event) => setPlatform(event.target.value)}>
            <option value="all">{t("library.allPlatforms")}</option>
            {platformOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select className="atlas-select-shell" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">{t("library.allCategories")}</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select className="atlas-select-shell" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">{t("library.statusAny")}</option>
            <option value="installed">{t("library.statusInstalled")}</option>
            <option value="not-installed">{t("library.statusNotInstalled")}</option>
          </select>
          <div className="inline-flex rounded-full border border-white/10 bg-black/10 p-1">
            <button type="button" className={`atlas-icon-switch ${view === "grid" ? "is-active" : ""}`} onClick={() => setView("grid")}>
              <Grid2X2 size={16} />
            </button>
            <button type="button" className={`atlas-icon-switch ${view === "list" ? "is-active" : ""}`} onClick={() => setView("list")}>
              <List size={16} />
            </button>
          </div>
        </div>

        {libraryQuery.isPending ? (
          <div className="atlas-empty-state mt-6">{t("common.loading")}...</div>
        ) : filteredLibrary.length === 0 ? (
          <div className="atlas-empty-state mt-6">{t("library.empty")}</div>
        ) : view === "grid" ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredLibrary.map((item) => (
              <article key={item.library.id} className="rounded-[1.75rem] border border-white/10 bg-black/10 p-3 transition hover:border-primary/30">
                <div
                  className="aspect-[16/11] rounded-[1.35rem] bg-base-300 bg-cover bg-center"
                  style={resolveGameImage(item.game) ? { backgroundImage: `url(${resolveGameImage(item.game)})` } : undefined}
                />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-white">{item.game.name}</h3>
                    <p className="text-sm text-white/55">{deriveCategory(item)}</p>
                  </div>
                  <span className={`atlas-pill ${item.library.isInstalled ? "text-primary" : "text-white/55"}`}>
                    {item.library.isInstalled ? t("library.statusInstalled") : t("library.statusNotInstalled")}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/60">
                  <span>{item.library.platform}</span>
                  <span>{formatHours(item.library.totalPlaytimeSeconds)}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link to={`/library/${item.game.id}`} className="btn atlas-secondary-btn flex-1">
                    {t("library.details")}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost rounded-full border border-white/10"
                    onClick={() =>
                      void toggleInstalledMutation.mutateAsync({ gameId: item.game.id, isInstalled: item.library.isInstalled })
                    }
                    disabled={busy}
                  >
                    {item.library.isInstalled ? t("library.statusInstalled") : t("library.statusNotInstalled")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/10">
            <table className="table">
              <thead>
                <tr className="text-white/45">
                  <th>{t("library.game")}</th>
                  <th>{t("library.platform")}</th>
                  <th>{t("library.category")}</th>
                  <th>{t("home.playtime")}</th>
                  <th>{t("library.status")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredLibrary.map((item) => (
                  <tr key={item.library.id} className="border-white/6 text-white/80">
                    <td className="font-medium">{item.game.name}</td>
                    <td>{item.library.platform}</td>
                    <td>{deriveCategory(item)}</td>
                    <td>{formatHours(item.library.totalPlaytimeSeconds)}</td>
                    <td>
                      <button
                        type="button"
                        className={`atlas-pill ${item.library.isInstalled ? "text-primary" : "text-white/60"}`}
                        onClick={() =>
                          void toggleInstalledMutation.mutateAsync({ gameId: item.game.id, isInstalled: item.library.isInstalled })
                        }
                        disabled={busy}
                      >
                        {item.library.isInstalled ? t("library.statusInstalled") : t("library.statusNotInstalled")}
                      </button>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Link to={`/library/${item.game.id}`} className="btn btn-ghost btn-sm rounded-full border border-white/10">
                          {t("library.details")}
                        </Link>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm rounded-full border border-white/10 text-error"
                          onClick={() => void deleteMutation.mutateAsync(item.game.id)}
                          disabled={busy}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {mutationError ? (
          <div role="alert" className="alert alert-error mt-4 rounded-[1.25rem] border border-error/25 bg-error/10 text-sm">
            <span>{mutationError instanceof Error ? mutationError.message : t("common.requestFailed")}</span>
          </div>
        ) : null}
      </section>

      <aside className="atlas-glass-panel p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("library.manualAdd")}</p>
        <form onSubmit={handleSearch} className="mt-4 grid gap-3">
          <input
            className="atlas-input-shell"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("library.searchGame")}
          />
          <select className="atlas-select-shell" value={source} onChange={(event) => setSource(event.target.value as "rawg" | "steam")}>
            <option value="rawg">RAWG</option>
            <option value="steam">Steam</option>
          </select>
          <button type="submit" className="btn atlas-primary-btn" disabled={query.trim().length === 0 || searchQuery.isFetching}>
            {searchQuery.isFetching ? t("library.searching") : t("library.searchAction")}
          </button>
        </form>

        <div className="mt-5 grid gap-3">
          {(searchQuery.data ?? []).map((result) => (
            <article key={`${result.source}:${result.externalId}`} className="rounded-[1.5rem] border border-white/10 bg-black/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{result.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/45">{result.source}</p>
                </div>
                <button type="button" className="btn atlas-secondary-btn btn-sm" onClick={() => void handleAdd(result)} disabled={addMutation.isPending}>
                  {t("library.add")}
                </button>
              </div>
            </article>
          ))}
          {!searchQuery.isFetching && (searchQuery.data?.length ?? 0) === 0 ? (
            <div className="atlas-empty-state">{t("library.searchNone")}</div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
