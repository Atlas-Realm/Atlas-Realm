import type { Context } from "hono";
import { successResponse } from "@/lib/response";
import { NotFoundError } from "@/lib/errors";
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
}
