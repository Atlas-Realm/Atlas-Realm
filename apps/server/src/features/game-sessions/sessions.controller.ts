import type { Context } from "hono";
import { successResponse } from "@/lib/response";
import type { JWTPayload } from "@/middleware/auth";
import type { ISessionsService } from "./sessions.types";

export class SessionsController {
  constructor(private readonly sessionsService: ISessionsService) {}

  startSession = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { gameId } = c.req.valid("json" as never) as { gameId: string };
    const session = await this.sessionsService.start(user.sub, gameId);
    return c.json(successResponse(session), 201);
  };

  heartbeatSession = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { sessionId, durationSeconds } = c.req.valid("json" as never) as {
      sessionId: string;
      durationSeconds?: number;
    };

    const session = await this.sessionsService.heartbeat(user.sub, sessionId, durationSeconds);
    return c.json(successResponse(session), 200);
  };

  endSession = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { sessionId, durationSeconds } = c.req.valid("json" as never) as {
      sessionId: string;
      durationSeconds?: number;
    };

    const session = await this.sessionsService.end(user.sub, sessionId, durationSeconds);
    return c.json(successResponse(session), 200);
  };

  activeSession = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const session = await this.sessionsService.getActiveSession(user.sub);
    return c.json(successResponse(session), 200);
  };

  history = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { limit, offset } = c.req.valid("query" as never) as { limit?: number; offset?: number };
    const sessions = await this.sessionsService.getHistory(user.sub, limit, offset);
    return c.json(successResponse(sessions), 200);
  };

  stats = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { gameId } = c.req.valid("param" as never) as { gameId: string };
    const stats = await this.sessionsService.getStats(user.sub, gameId);
    return c.json(successResponse(stats), 200);
  };

  // Legacy endpoints for backward compatibility
  endSessionLegacy = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { id } = c.req.valid("param" as never) as { id: string };
    const session = await this.sessionsService.end(user.sub, id);
    return c.json(successResponse(session), 200);
  };

  pauseSession = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { id } = c.req.valid("param" as never) as { id: string };
    const session = await this.sessionsService.pause(id, user.sub);
    return c.json(successResponse(session), 200);
  };

  resumeSession = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { id } = c.req.valid("param" as never) as { id: string };
    const session = await this.sessionsService.resume(id, user.sub);
    return c.json(successResponse(session), 200);
  };

  listSessions = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const sessions = await this.sessionsService.getUserSessions(user.sub);
    return c.json(successResponse(sessions), 200);
  };
}
