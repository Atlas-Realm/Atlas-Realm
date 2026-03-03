import { ExternalApiError } from "@/lib/errors";
import { env } from "@/config/env";
import type { ICacheService } from "@/cache";
import type { IGamesRepository, IGamesService, GameSearchResult } from "./games.types";

export class GamesService implements IGamesService {
  constructor(
    private readonly repo: IGamesRepository,
    private readonly cache: ICacheService,
  ) {}

  private async searchRAWG(query: string): Promise<GameSearchResult[]> {
    if (!env.RAWG_API_KEY) throw new ExternalApiError("RAWG API key not configured");
    const url = `https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&key=${env.RAWG_API_KEY}&page_size=10`;
    const res = await fetch(url);
    if (!res.ok) throw new ExternalApiError("RAWG API request failed");
    const data = await res.json();
    return (data.results as any[]).map((g: any) => ({
      externalId: String(g.id),
      source: "rawg" as const,
      name: g.name,
      metadata: { slug: g.slug, backgroundImage: g.background_image, rating: g.rating },
    }));
  }

  private async searchSteam(query: string): Promise<GameSearchResult[]> {
    const url = `https://store.steampowered.com/api/storesearch?term=${encodeURIComponent(query)}&l=english&cc=US`;
    const res = await fetch(url);
    if (!res.ok) throw new ExternalApiError("Steam API request failed");
    const data = await res.json();
    return (data.items as any[]).map((g: any) => ({
      externalId: String(g.id),
      source: "steam" as const,
      name: g.name,
      metadata: { tiny_image: g.tiny_image, price: g.price },
    }));
  }

  async search(query: string, source: "rawg" | "steam" = "rawg"): Promise<GameSearchResult[]> {
    const cacheKey = `game-search:${source}:${query.toLowerCase()}`;
    const ttl = 60 * 60 * 6; // 6 hours

    if (source === "rawg") {
      return this.cache.cachedFetch(cacheKey, ttl, () => this.searchRAWG(query));
    }
    return this.cache.cachedFetch(cacheKey, ttl, () => this.searchSteam(query));
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }
}
