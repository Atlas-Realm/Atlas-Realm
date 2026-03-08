import { ArrowLeft, Trophy } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useI18n } from "../../../shared/i18n/i18n-provider";
import { buildGameDetailViewModel, formatDate, formatHours } from "../../../shared/utils/ui-format";
import { useGameDetailQuery, useLibraryQuery } from "../queries/use-library-queries";

export default function LibraryDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const gameId = params.gameId ?? "";
  const libraryQuery = useLibraryQuery();
  const detailQuery = useGameDetailQuery(gameId);

  const libraryItem = (libraryQuery.data ?? []).find((item) => item.game.id === gameId) ?? null;
  const game = detailQuery.data ?? libraryItem?.game ?? null;

  if (libraryQuery.isPending || detailQuery.isPending) {
    return <div className="atlas-empty-state">{t("common.loading")}...</div>;
  }

  if (!game) {
    return <div className="atlas-empty-state">{t("library.empty")}</div>;
  }

  const detail = buildGameDetailViewModel(game, libraryItem?.library ?? null);

  // TODO(api-gap): achievements, social rank, screenshots, and completion are not available in current game detail APIs.
  const dummyAchievements = ["Glass Runner", "Midnight Session", "Archive Diver"];
  const dummyScreenshots = [detail.heroImage, detail.heroImage, detail.heroImage].filter(Boolean) as string[];
  const dummyRank = `#${(game.id.charCodeAt(0) % 9) + 1},${(game.id.charCodeAt(1) % 900) + 120}`;
  const dummyCompletion = `${((game.name.length * 7) % 60) + 25}%`;
  const dummyFriends = (game.name.length % 4) + 1;

  return (
    <div className="grid gap-6">
      <section className="atlas-detail-hero overflow-hidden rounded-[2rem] border border-white/10 p-6 md:p-8">
        {detail.heroImage ? <div className="atlas-detail-image" style={{ backgroundImage: `url(${detail.heroImage})` }} /> : null}
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <Link to="/library" className="mb-5 inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-white">
              <ArrowLeft size={15} />
              {t("library.back")}
            </Link>
            <span className="atlas-pill mb-5 inline-flex">{detail.library?.platform ?? game.source}</span>
            <h1 className="text-4xl font-black uppercase leading-none text-white sm:text-5xl lg:text-6xl">{game.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">{detail.description ?? t("library.noDescription")}</p>
          </div>
          <div className="atlas-glass-panel w-full max-w-xs p-4">
            <div className="grid gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">{t("home.playtime")}</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {detail.library ? formatHours(detail.library.totalPlaytimeSeconds) : t("common.never")}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">{t("home.lastPlayed")}</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {detail.library?.lastPlayedAt ? formatDate(detail.library.lastPlayedAt, locale) : t("common.never")}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">{t("library.rank")}</p>
                <p className="mt-2 text-lg font-semibold text-primary">{dummyRank}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,24rem)]">
        <div className="grid gap-6">
          <article className="atlas-glass-panel p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("library.overview")}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
                <p className="text-sm text-white/55">{t("library.installPath")}</p>
                <p className="mt-2 break-all text-white">{detail.library?.installPath ?? t("common.unknown")}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
                <p className="text-sm text-white/55">{t("library.releaseDate")}</p>
                <p className="mt-2 text-white">{detail.releaseDate ? formatDate(detail.releaseDate, locale) : t("common.unknown")}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
                <p className="text-sm text-white/55">{t("library.developer")}</p>
                <p className="mt-2 text-white">{detail.developer ?? t("common.unknown")}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
                <p className="text-sm text-white/55">{t("library.publisher")}</p>
                <p className="mt-2 text-white">{detail.publisher ?? t("common.unknown")}</p>
              </div>
            </div>
          </article>

          <article className="atlas-glass-panel p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("library.media")}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="grid gap-3 sm:grid-cols-3">
                {dummyScreenshots.length > 0 ? (
                  dummyScreenshots.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="aspect-[4/3] rounded-[1.4rem] border border-white/10 bg-cover bg-center"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  ))
                ) : (
                  <div className="atlas-empty-state sm:col-span-3">{t("library.todoMedia")}</div>
                )}
              </div>
              <div className="grid gap-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
                  <p className="text-sm text-white/55">{t("library.completion")}</p>
                  <p className="mt-2 text-xl font-semibold text-primary">{dummyCompletion}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
                  <p className="text-sm text-white/55">{t("library.friendsPlaying")}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{dummyFriends}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
                  <div className="flex items-center gap-2 text-white">
                    <Trophy size={16} className="text-primary" />
                    <span className="font-semibold">{t("library.achievements")}</span>
                  </div>
                  <ul className="mt-3 grid gap-2 text-sm text-white/65">
                    {dummyAchievements.map((achievement) => (
                      <li key={achievement}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="alert alert-info mt-4 rounded-[1.25rem] border border-primary/20 bg-primary/10 text-sm text-white/80">
              <span>{t("library.todoMedia")}</span>
            </div>
          </article>
        </div>

        <aside className="atlas-glass-panel p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("library.metadata")}</p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
              <p className="text-sm text-white/55">{t("library.platform")}</p>
              <p className="mt-2 text-white">{detail.library?.platform ?? game.source}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
              <p className="text-sm text-white/55">{t("library.genres")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(detail.genres.length > 0 ? detail.genres : ["Collection"]).map((genre) => (
                  <span key={genre} className="atlas-pill">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4">
              <p className="text-sm text-white/55">Source</p>
              <p className="mt-2 text-white">{game.source}</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
