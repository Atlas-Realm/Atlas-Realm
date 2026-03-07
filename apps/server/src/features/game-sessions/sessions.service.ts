import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { ICacheService } from "@/cache";
import type { IActivityPublisher } from "@/features/activities/activities.types";
import type { ISessionsRepository, ISessionsService } from "./sessions.types";

export class SessionsService implements ISessionsService {
  constructor(
    private readonly repo: ISessionsRepository,
    private readonly cache: ICacheService,
    private readonly activities: IActivityPublisher,
  ) {}

  private keyForActiveSession(userId: string) {
    return `sessions:active:${userId}`;
  }

  async start(userId: string, gameId: string) {
    const existing = await this.repo.findActiveByUser(userId);
    if (existing) throw new ConflictError("sessions.active_exists");

    const session = await this.repo.create({
      userId,
      gameId,
      status: "active",
      durationSeconds: 0,
      lastHeartbeatAt: new Date(),
    });

    await this.cache.set(this.keyForActiveSession(userId), { sessionId: session.id, gameId }, 60 * 60 * 12);

    await this.activities.publish({
      actorId: userId,
      type: "sessions.started",
      payload: { gameId, sessionId: session.id },
      visibility: "friends",
    });

    return session;
  }

  async heartbeat(userId: string, sessionId: string, durationSeconds?: number) {
    const session = await this.repo.findById(sessionId);
    if (!session) throw new NotFoundError("sessions.not_found");
    if (session.userId !== userId) throw new ForbiddenError("sessions.forbidden");
    if (session.status !== "active") throw new ConflictError("sessions.not_active");

    const now = new Date();
    const computedDuration = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);
    const nextDuration = Math.max(session.durationSeconds ?? 0, durationSeconds ?? 0, computedDuration);

    const updated = await this.repo.update(sessionId, {
      durationSeconds: nextDuration,
      lastHeartbeatAt: now,
    });

    await this.cache.set(
      this.keyForActiveSession(userId),
      { sessionId, gameId: session.gameId, durationSeconds: nextDuration },
      60 * 60 * 12,
    );

    return updated;
  }

  async end(userId: string, sessionId: string, durationSeconds?: number) {
    const session = await this.repo.findById(sessionId);
    if (!session) throw new NotFoundError("sessions.not_found");
    if (session.userId !== userId) throw new ForbiddenError("sessions.forbidden");
    if (session.status === "completed") throw new ConflictError("sessions.already_completed");

    const endedAt = new Date();
    const computedDuration = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);
    const finalDuration = Math.max(session.durationSeconds ?? 0, durationSeconds ?? 0, computedDuration);

    const updated = await this.repo.update(sessionId, {
      status: "completed",
      endedAt,
      durationSeconds: finalDuration,
      lastHeartbeatAt: endedAt,
    });

    await this.cache.del(this.keyForActiveSession(userId));

    await this.activities.publish({
      actorId: userId,
      type: "sessions.completed",
      payload: { gameId: session.gameId, sessionId, durationSeconds: finalDuration },
      visibility: "friends",
    });

    return updated;
  }

  async getActiveSession(userId: string) {
    const session = await this.repo.findActiveByUser(userId);
    return session ?? null;
  }

  async getHistory(userId: string, limit = 100, offset = 0) {
    return this.repo.findHistoryByUser(userId, limit, offset);
  }

  async getStats(userId: string, gameId: string) {
    return this.repo.getStats(userId, gameId);
  }

  async pause(sessionId: string, userId: string) {
    const session = await this.repo.findById(sessionId);
    if (!session) throw new NotFoundError("sessions.not_found");
    if (session.userId !== userId) throw new ForbiddenError("sessions.forbidden");
    if (session.status !== "active") throw new ConflictError("sessions.not_active");

    return this.repo.update(sessionId, { status: "paused" });
  }

  async resume(sessionId: string, userId: string) {
    const session = await this.repo.findById(sessionId);
    if (!session) throw new NotFoundError("sessions.not_found");
    if (session.userId !== userId) throw new ForbiddenError("sessions.forbidden");
    if (session.status !== "paused") throw new ConflictError("sessions.not_paused");

    return this.repo.update(sessionId, { status: "active" });
  }

  async getUserSessions(userId: string) {
    return this.repo.findByUser(userId);
  }
}
