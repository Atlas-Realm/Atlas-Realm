import type { GameSession, NewGameSession } from "@/db/schema";

export type SessionStats = {
  gameId: string;
  totalSessions: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  lastSessionAt: Date | null;
};

export interface ISessionsRepository {
  create(data: NewGameSession): Promise<GameSession>;
  findById(id: string): Promise<GameSession | undefined>;
  findActiveByUser(userId: string): Promise<GameSession | undefined>;
  findByUser(userId: string): Promise<GameSession[]>;
  findHistoryByUser(userId: string, limit: number, offset: number): Promise<GameSession[]>;
  update(id: string, data: Partial<NewGameSession>): Promise<GameSession>;
  getStats(userId: string, gameId: string): Promise<SessionStats>;
}

export interface ISessionsService {
  start(userId: string, gameId: string): Promise<GameSession>;
  heartbeat(userId: string, sessionId: string, durationSeconds?: number): Promise<GameSession>;
  end(userId: string, sessionId: string, durationSeconds?: number): Promise<GameSession>;
  getActiveSession(userId: string): Promise<GameSession | null>;
  getHistory(userId: string, limit?: number, offset?: number): Promise<GameSession[]>;
  getStats(userId: string, gameId: string): Promise<SessionStats>;
  pause(sessionId: string, userId: string): Promise<GameSession>;
  resume(sessionId: string, userId: string): Promise<GameSession>;
  getUserSessions(userId: string): Promise<GameSession[]>;
}
