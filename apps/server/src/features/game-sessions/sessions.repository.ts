import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { gameSessions, type GameSession, type NewGameSession } from "@/db/schema";

export const sessionsRepository = {
  async create(data: NewGameSession): Promise<GameSession> {
    const [session] = await db.insert(gameSessions).values(data).returning();
    return session;
  },

  async findById(id: string): Promise<GameSession | undefined> {
    return db.query.gameSessions.findFirst({ where: eq(gameSessions.id, id) });
  },

  async findActiveByUser(userId: string): Promise<GameSession | undefined> {
    return db.query.gameSessions.findFirst({
      where: and(eq(gameSessions.userId, userId), eq(gameSessions.status, "active")),
    });
  },

  async findByUser(userId: string): Promise<GameSession[]> {
    return db.query.gameSessions.findMany({ where: eq(gameSessions.userId, userId) });
  },

  async update(id: string, data: Partial<NewGameSession>): Promise<GameSession> {
    const [session] = await db
      .update(gameSessions)
      .set(data)
      .where(eq(gameSessions.id, id))
      .returning();
    return session;
  },
};
