import { and, eq } from "drizzle-orm";
import type { db as DB } from "@/db";
import { games, type NewGame, type Game } from "@/db/schema";
import type { IGamesRepository } from "./games.types";

export class GamesRepository implements IGamesRepository {
  constructor(private readonly db: typeof DB) {}

  async findByExternalId(externalId: string, source: string): Promise<Game | undefined> {
    return this.db.query.games.findFirst({
      where: and(eq(games.externalId, externalId), eq(games.source, source as Game["source"])),
    });
  }

  async findById(id: string): Promise<Game | undefined> {
    return this.db.query.games.findFirst({ where: eq(games.id, id) });
  }

  async upsert(data: NewGame): Promise<Game> {
    const [game] = await this.db
      .insert(games)
      .values(data)
      .onConflictDoUpdate({
        target: [games.externalId, games.source],
        set: { name: data.name, metadata: data.metadata, lastFetchedAt: new Date() },
      })
      .returning();
    return game;
  }

  async findUserGames(_userId: string): Promise<Game[]> {
    return this.db.query.games.findMany();
  }
}
