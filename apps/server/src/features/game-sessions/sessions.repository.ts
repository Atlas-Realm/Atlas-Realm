import { and, desc, eq, sql } from "drizzle-orm";
import type { db as DB } from "@/db";
import { gameSessions, type GameSession, type NewGameSession } from "@/db/schema";
import type { ISessionsRepository, SessionStats } from "./sessions.types";

export class SessionsRepository implements ISessionsRepository {
  constructor(private readonly db: typeof DB) {}

  async create(data: NewGameSession): Promise<GameSession> {
    const [session] = await this.db.insert(gameSessions).values(data).returning();
    return session;
  }

  async findById(id: string): Promise<GameSession | undefined> {
    return this.db.query.gameSessions.findFirst({ where: eq(gameSessions.id, id) });
  }

  async findActiveByUser(userId: string): Promise<GameSession | undefined> {
    return this.db.query.gameSessions.findFirst({
      where: and(eq(gameSessions.userId, userId), eq(gameSessions.status, "active")),
    });
  }

  async findByUser(userId: string): Promise<GameSession[]> {
    return this.db.query.gameSessions.findMany({
      where: eq(gameSessions.userId, userId),
      orderBy: [desc(gameSessions.startedAt)],
    });
  }

  async findHistoryByUser(userId: string, limit: number, offset: number): Promise<GameSession[]> {
    return this.db.query.gameSessions.findMany({
      where: and(eq(gameSessions.userId, userId), eq(gameSessions.status, "completed")),
      orderBy: [desc(gameSessions.startedAt)],
      limit,
      offset,
    });
  }

  async update(id: string, data: Partial<NewGameSession>): Promise<GameSession> {
    const [session] = await this.db
      .update(gameSessions)
      .set(data)
      .where(eq(gameSessions.id, id))
      .returning();

    return session;
  }

  async getStats(userId: string, gameId: string): Promise<SessionStats> {
    const [result] = await this.db
      .select({
        totalSessions: sql<number>`count(*)::int`,
        totalDurationSeconds: sql<number>`coalesce(sum(${gameSessions.durationSeconds}), 0)::int`,
        averageDurationSeconds: sql<number>`coalesce(avg(${gameSessions.durationSeconds}), 0)::int`,
        lastSessionAt: sql<Date | null>`max(${gameSessions.endedAt})`,
      })
      .from(gameSessions)
      .where(
        and(
          eq(gameSessions.userId, userId),
          eq(gameSessions.gameId, gameId),
          eq(gameSessions.status, "completed"),
        ),
      );

    return {
      gameId,
      totalSessions: result?.totalSessions ?? 0,
      totalDurationSeconds: result?.totalDurationSeconds ?? 0,
      averageDurationSeconds: result?.averageDurationSeconds ?? 0,
      lastSessionAt: result?.lastSessionAt ?? null,
    };
  }
}
