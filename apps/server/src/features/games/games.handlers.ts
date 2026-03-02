import type { Context } from "hono";
import { successResponse } from "@/lib/response";
import { NotFoundError } from "@/lib/errors";
import { gamesService } from "./games.service";

export const searchGames = async (c: Context) => {
  const { q, source } = c.req.valid("query" as never) as { q: string; source: "rawg" | "steam" };
  const results = await gamesService.search(q, source);
  return c.json(successResponse(results), 200);
};

export const getGame = async (c: Context) => {
  const { id } = c.req.valid("param" as never) as { id: string };
  const game = await gamesService.getById(id);
  if (!game) throw new NotFoundError("Game not found");
  return c.json(successResponse(game), 200);
};
