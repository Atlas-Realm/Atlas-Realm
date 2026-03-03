import { NotFoundError, ConflictError, ForbiddenError } from "@/lib/errors";
import type { ISessionsRepository, ISessionsService } from "./sessions.types";

export class SessionsService implements ISessionsService {
  constructor(private readonly repo: ISessionsRepository) {}

  async start(userId: string, gameId: string) {
    const existing = await this.repo.findActiveByUser(userId);
    if (existing) throw new ConflictError("sessions.active_exists");

    return this.repo.create({ userId, gameId, status: "active" });
  }

  async end(sessionId: string, userId: string) {
    const session = await this.repo.findById(sessionId);
    if (!session) throw new NotFoundError("sessions.not_found");
    if (session.userId !== userId) throw new ForbiddenError("sessions.forbidden");
    if (session.status === "completed") throw new ConflictError("sessions.already_completed");

    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);

    return this.repo.update(sessionId, { status: "completed", endedAt, durationSeconds });
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
