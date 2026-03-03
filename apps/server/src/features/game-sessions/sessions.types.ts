import type { GameSession, NewGameSession } from "@/db/schema";

export interface ISessionsRepository {
  create(data: NewGameSession): Promise<GameSession>;
  findById(id: string): Promise<GameSession | undefined>;
  findActiveByUser(userId: string): Promise<GameSession | undefined>;
  findByUser(userId: string): Promise<GameSession[]>;
  update(id: string, data: Partial<NewGameSession>): Promise<GameSession>;
}

export interface ISessionsService {
  start(userId: string, gameId: string): Promise<GameSession>;
  end(sessionId: string, userId: string): Promise<GameSession>;
  pause(sessionId: string, userId: string): Promise<GameSession>;
  resume(sessionId: string, userId: string): Promise<GameSession>;
  getUserSessions(userId: string): Promise<GameSession[]>;
}
