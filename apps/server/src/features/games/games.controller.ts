import type { Context } from "hono";
import { NotFoundError } from "@/lib/errors";
import { successResponse } from "@/lib/response";
import type { JWTPayload } from "@/middleware/auth";
import type { IGamesService } from "./games.types";

export class GamesController {
  constructor(private readonly gamesService: IGamesService) {}

  searchGames = async (c: Context) => {
    const { q, source } = c.req.valid("query" as never) as { q: string; source: "rawg" | "steam" };
    const results = await this.gamesService.search(q, source);
    return c.json(successResponse(results), 200);
  };

  getGame = async (c: Context) => {
    const { id } = c.req.valid("param" as never) as { id: string };
    const game = await this.gamesService.getById(id);
    if (!game) throw new NotFoundError("games.not_found");
    return c.json(successResponse(game), 200);
  };

  getLibrary = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const library = await this.gamesService.getLibrary(user.sub);
    return c.json(successResponse(library), 200);
  };

  addLibraryItem = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const body = c.req.valid("json" as never) as {
      game: {
        id?: string;
        externalId?: string | null;
        source: "steam" | "rawg" | "igdb" | "manual";
        name: string;
        metadata?: Record<string, unknown> | null;
      };
      library?: {
        platform?: string;
        isInstalled?: boolean;
        installPath?: string | null;
        lastPlayedAt?: string | null;
        totalPlaytimeSeconds?: number;
      };
    };

    const result = await this.gamesService.addToLibrary(user.sub, {
      game: body.game,
      library: body.library
        ? {
            ...body.library,
            lastPlayedAt: body.library.lastPlayedAt ? new Date(body.library.lastPlayedAt) : null,
          }
        : undefined,
    });

    return c.json(successResponse(result), 201);
  };

  syncLibrary = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const body = c.req.valid("json" as never) as {
      items: Array<{
        game: {
          id?: string;
          externalId?: string | null;
          source: "steam" | "rawg" | "igdb" | "manual";
          name: string;
          metadata?: Record<string, unknown> | null;
        };
        library?: {
          platform?: string;
          isInstalled?: boolean;
          installPath?: string | null;
          lastPlayedAt?: string | null;
          totalPlaytimeSeconds?: number;
        };
      }>;
    };

    const result = await this.gamesService.syncLibrary(
      user.sub,
      body.items.map((item) => ({
        game: item.game,
        library: item.library
          ? {
              ...item.library,
              lastPlayedAt: item.library.lastPlayedAt ? new Date(item.library.lastPlayedAt) : null,
            }
          : undefined,
      })),
    );

    return c.json(successResponse(result), 200);
  };

  updateLibraryItem = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { gameId } = c.req.valid("param" as never) as { gameId: string };
    const body = c.req.valid("json" as never) as {
      platform?: string;
      isInstalled?: boolean;
      installPath?: string | null;
      lastPlayedAt?: string | null;
      totalPlaytimeSeconds?: number;
    };

    const parsedLastPlayedAt =
      body.lastPlayedAt === undefined
        ? undefined
        : body.lastPlayedAt === null
          ? null
          : new Date(body.lastPlayedAt);

    const result = await this.gamesService.updateLibraryItem(user.sub, gameId, {
      platform: body.platform,
      isInstalled: body.isInstalled,
      installPath: body.installPath,
      lastPlayedAt: parsedLastPlayedAt,
      totalPlaytimeSeconds: body.totalPlaytimeSeconds,
    });

    return c.json(successResponse(result), 200);
  };

  removeLibraryItem = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { gameId } = c.req.valid("param" as never) as { gameId: string };
    const result = await this.gamesService.removeLibraryItem(user.sub, gameId);
    return c.json(successResponse(result), 200);
  };
}
