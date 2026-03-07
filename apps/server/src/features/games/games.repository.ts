import { and, eq } from "drizzle-orm";
import type { db as DB } from "@/db";
import { games, userGames, type Game, type NewGame, type NewUserGame, type UserGame } from "@/db/schema";
import type { IGamesRepository, UserLibraryItem } from "./games.types";

export class GamesRepository implements IGamesRepository {
  constructor(private readonly db: typeof DB) {}

  async findByExternalId(externalId: string, source: Game["source"]): Promise<Game | undefined> {
    return this.db.query.games.findFirst({
      where: and(eq(games.externalId, externalId), eq(games.source, source)),
    });
  }

  async findById(id: string): Promise<Game | undefined> {
    return this.db.query.games.findFirst({ where: eq(games.id, id) });
  }

  async upsertGame(data: NewGame): Promise<Game> {
    const [game] = await this.db
      .insert(games)
      .values(data)
      .onConflictDoUpdate({
        target: [games.externalId, games.source],
        set: {
          name: data.name,
          metadata: data.metadata,
          lastFetchedAt: data.lastFetchedAt ?? new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return game;
  }

  async upsertUserGame(data: NewUserGame): Promise<UserGame> {
    const [library] = await this.db
      .insert(userGames)
      .values(data)
      .onConflictDoUpdate({
        target: [userGames.userId, userGames.gameId],
        set: {
          platform: data.platform,
          isInstalled: data.isInstalled,
          installPath: data.installPath,
          lastPlayedAt: data.lastPlayedAt,
          totalPlaytimeSeconds: data.totalPlaytimeSeconds,
          updatedAt: new Date(),
        },
      })
      .returning();

    return library;
  }

  async findUserLibrary(userId: string): Promise<UserLibraryItem[]> {
    const rows = await this.db
      .select({
        library: userGames,
        game: games,
      })
      .from(userGames)
      .innerJoin(games, eq(userGames.gameId, games.id))
      .where(eq(userGames.userId, userId));

    return rows;
  }

  async findUserGame(userId: string, gameId: string): Promise<UserGame | undefined> {
    return this.db.query.userGames.findFirst({
      where: and(eq(userGames.userId, userId), eq(userGames.gameId, gameId)),
    });
  }

  async updateUserGame(
    userId: string,
    gameId: string,
    data: Partial<
      Pick<NewUserGame, "platform" | "isInstalled" | "installPath" | "lastPlayedAt" | "totalPlaytimeSeconds">
    >,
  ): Promise<UserGame | undefined> {
    const [library] = await this.db
      .update(userGames)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(userGames.userId, userId), eq(userGames.gameId, gameId)))
      .returning();

    return library;
  }

  async deleteUserGame(userId: string, gameId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(userGames)
      .where(and(eq(userGames.userId, userId), eq(userGames.gameId, gameId)))
      .returning({ id: userGames.id });

    return deleted.length > 0;
  }
}
