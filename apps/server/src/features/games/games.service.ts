import { ExternalApiError, NotFoundError } from "@/lib/errors";
import { env } from "@/config/env";
import type { IActivityPublisher } from "@/features/activities/activities.types";
import type { ICacheService } from "@/cache";
import type {
  GameSearchResult,
  GameSearchSource,
  IGamesRepository,
  IGamesService,
  LibraryEntryInput,
} from "./games.types";

export class GamesService implements IGamesService {
  constructor(
    private readonly repo: IGamesRepository,
    private readonly cache: ICacheService,
    private readonly activities: IActivityPublisher,
  ) {}

  private async searchRAWG(query: string): Promise<GameSearchResult[]> {
    if (!env.RAWG_API_KEY) throw new ExternalApiError("games.rawg_not_configured");

    const url = `https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&key=${env.RAWG_API_KEY}&page_size=10`;
    const res = await fetch(url);
    if (!res.ok) throw new ExternalApiError("games.search_failed");

    const data = await res.json();
    return (data.results as Array<Record<string, unknown>>).map((game) => ({
      externalId: String(game.id),
      source: "rawg" as const,
      name: String(game.name ?? "Unknown"),
      metadata: {
        slug: game.slug,
        backgroundImage: game.background_image,
        rating: game.rating,
      },
    }));
  }

  private async searchSteam(query: string): Promise<GameSearchResult[]> {
    const url = `https://store.steampowered.com/api/storesearch?term=${encodeURIComponent(query)}&l=english&cc=US`;
    const res = await fetch(url);
    if (!res.ok) throw new ExternalApiError("games.search_failed");

    const data = await res.json();
    return (data.items as Array<Record<string, unknown>>).map((game) => ({
      externalId: String(game.id),
      source: "steam" as const,
      name: String(game.name ?? "Unknown"),
      metadata: {
        tinyImage: game.tiny_image,
        price: game.price,
      },
    }));
  }

  async search(query: string, source: GameSearchSource = "rawg") {
    const cacheKey = `games:search:${source}:${query.toLowerCase().trim()}`;
    const ttl = 60 * 60 * 6;

    return this.cache.cachedFetch(cacheKey, ttl, () => {
      if (source === "steam") return this.searchSteam(query);
      return this.searchRAWG(query);
    });
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }

  private async resolveGame(input: LibraryEntryInput["game"]) {
    if (input.id) {
      const existing = await this.repo.findById(input.id);
      if (!existing) throw new NotFoundError("games.not_found");
      return existing;
    }

    if (!input.externalId) {
      return this.repo.upsertGame({
        source: input.source,
        externalId: null,
        name: input.name,
        metadata: input.metadata ?? null,
      });
    }

    return this.repo.upsertGame({
      source: input.source,
      externalId: input.externalId,
      name: input.name,
      metadata: input.metadata ?? null,
      lastFetchedAt: new Date(),
    });
  }

  private async attachLibraryItem(userId: string, gameId: string) {
    const library = await this.repo.findUserLibrary(userId);
    const found = library.find((item) => item.game.id === gameId);
    if (!found) throw new NotFoundError("games.library_item_not_found");
    return found;
  }

  async getLibrary(userId: string) {
    return this.repo.findUserLibrary(userId);
  }

  async addToLibrary(userId: string, input: LibraryEntryInput) {
    const game = await this.resolveGame(input.game);

    await this.repo.upsertUserGame({
      userId,
      gameId: game.id,
      platform: input.library?.platform ?? input.game.source,
      isInstalled: input.library?.isInstalled ?? false,
      installPath: input.library?.installPath ?? null,
      lastPlayedAt: input.library?.lastPlayedAt ?? null,
      totalPlaytimeSeconds: input.library?.totalPlaytimeSeconds ?? 0,
    });

    await this.activities.publish({
      actorId: userId,
      type: "games.library.added",
      payload: { gameId: game.id, gameName: game.name },
      visibility: "friends",
    });

    return this.attachLibraryItem(userId, game.id);
  }

  async syncLibrary(userId: string, items: LibraryEntryInput[]) {
    for (const item of items) {
      await this.addToLibrary(userId, item);
    }

    return { synced: items.length };
  }

  async updateLibraryItem(
    userId: string,
    gameId: string,
    input: {
      platform?: string;
      isInstalled?: boolean;
      installPath?: string | null;
      lastPlayedAt?: Date | null;
      totalPlaytimeSeconds?: number;
    },
  ) {
    const existing = await this.repo.findUserGame(userId, gameId);
    if (!existing) throw new NotFoundError("games.library_item_not_found");

    await this.repo.updateUserGame(userId, gameId, input);
    return this.attachLibraryItem(userId, gameId);
  }

  async removeLibraryItem(userId: string, gameId: string) {
    const deleted = await this.repo.deleteUserGame(userId, gameId);
    if (!deleted) throw new NotFoundError("games.library_item_not_found");

    await this.activities.publish({
      actorId: userId,
      type: "games.library.removed",
      payload: { gameId },
      visibility: "private",
    });

    return { deleted: true as const };
  }
}
