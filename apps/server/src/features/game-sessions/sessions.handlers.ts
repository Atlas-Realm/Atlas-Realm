import type { Context } from "hono";
import { successResponse } from "@/lib/response";
import type { JWTPayload } from "@/middleware/auth";
import { sessionsService } from "./sessions.service";

export const startSession = async (c: Context) => {
  const user = c.get("user") as JWTPayload;
  const { gameId } = c.req.valid("json" as never) as { gameId: string };
  const session = await sessionsService.start(user.sub, gameId);
  return c.json(successResponse(session), 201);
};

export const endSession = async (c: Context) => {
  const user = c.get("user") as JWTPayload;
  const { id } = c.req.valid("param" as never) as { id: string };
  const session = await sessionsService.end(id, user.sub);
  return c.json(successResponse(session), 200);
};

export const pauseSession = async (c: Context) => {
  const user = c.get("user") as JWTPayload;
  const { id } = c.req.valid("param" as never) as { id: string };
  const session = await sessionsService.pause(id, user.sub);
  return c.json(successResponse(session), 200);
};

export const resumeSession = async (c: Context) => {
  const user = c.get("user") as JWTPayload;
  const { id } = c.req.valid("param" as never) as { id: string };
  const session = await sessionsService.resume(id, user.sub);
  return c.json(successResponse(session), 200);
};

export const listSessions = async (c: Context) => {
  const user = c.get("user") as JWTPayload;
  const sessions = await sessionsService.getUserSessions(user.sub);
  return c.json(successResponse(sessions), 200);
};
