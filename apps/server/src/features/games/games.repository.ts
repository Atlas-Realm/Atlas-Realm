import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { games, type NewGame, type Game } from "@/db/schema";

export const gamesRepository = {
  async findByExternalId(externalId: string, source: string): Promise<Game | undefined> {
    return db.query.games.findFirst({
      where: and(eq(games.externalId, externalId), eq(games.source, source as Game["source"])),
    });
  },

  async findById(id: string): Promise<Game | undefined> {
    return db.query.games.findFirst({ where: eq(games.id, id) });
  },

  async upsert(data: NewGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values(data)
      .onConflictDoUpdate({
        target: [games.externalId, games.source],
        set: { name: data.name, metadata: data.metadata, lastFetchedAt: new Date() },
      })
      .returning();
    return game;
  },

  async findUserGames(userId: string): Promise<Game[]> {
    return db.query.games.findMany();
  },
};
