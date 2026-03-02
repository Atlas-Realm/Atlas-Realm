import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/middleware/auth";
import * as handlers from "./sessions.handlers";

const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  gameId: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  status: z.enum(["active", "paused", "completed"]),
});

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

const startRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: {
      content: { "application/json": { schema: z.object({ gameId: z.string().uuid() }) } },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), data: SessionSchema }),
        },
      },
      description: "Session started",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    409: { content: { "application/json": { schema: ErrorSchema } }, description: "Conflict" },
  },
});

const endRoute = createRoute({
  method: "patch",
  path: "/:id/end",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), data: SessionSchema }),
        },
      },
      description: "Session ended",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

const pauseRoute = createRoute({
  method: "patch",
  path: "/:id/pause",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), data: SessionSchema }),
        },
      },
      description: "Session paused",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

const resumeRoute = createRoute({
  method: "patch",
  path: "/:id/resume",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), data: SessionSchema }),
        },
      },
      description: "Session resumed",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), data: z.array(SessionSchema) }),
        },
      },
      description: "User sessions",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

export const sessionRoutes = new OpenAPIHono()
  .openapi(startRoute, handlers.startSession)
  .openapi(endRoute, handlers.endSession)
  .openapi(pauseRoute, handlers.pauseSession)
  .openapi(resumeRoute, handlers.resumeSession)
  .openapi(listRoute, handlers.listSessions);
