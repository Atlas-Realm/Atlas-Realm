import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/middleware/auth";
import type { SessionsController } from "./sessions.controller";

const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  gameId: z.string().uuid(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  durationSeconds: z.number().int().nullable(),
  lastHeartbeatAt: z.string().nullable(),
  status: z.enum(["active", "paused", "completed"]),
});

const SessionStatsSchema = z.object({
  gameId: z.string().uuid(),
  totalSessions: z.number().int(),
  totalDurationSeconds: z.number().int(),
  averageDurationSeconds: z.number().int(),
  lastSessionAt: z.string().nullable(),
});

const SuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), data });

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

const startRoute = createRoute({
  method: "post",
  path: "/start",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ gameId: z.string().uuid() }),
        },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: SuccessSchema(SessionSchema) } },
      description: "Session started",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    409: { content: { "application/json": { schema: ErrorSchema } }, description: "Conflict" },
  },
});

const heartbeatRoute = createRoute({
  method: "post",
  path: "/heartbeat",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string().uuid(),
            durationSeconds: z.number().int().min(0).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(SessionSchema) } },
      description: "Heartbeat accepted",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    403: { content: { "application/json": { schema: ErrorSchema } }, description: "Forbidden" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
    409: { content: { "application/json": { schema: ErrorSchema } }, description: "Conflict" },
  },
});

const endRoute = createRoute({
  method: "post",
  path: "/end",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string().uuid(),
            durationSeconds: z.number().int().min(0).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(SessionSchema) } },
      description: "Session ended",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    403: { content: { "application/json": { schema: ErrorSchema } }, description: "Forbidden" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
    409: { content: { "application/json": { schema: ErrorSchema } }, description: "Conflict" },
  },
});

const activeRoute = createRoute({
  method: "get",
  path: "/active",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(SessionSchema.nullable()),
        },
      },
      description: "Active session",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const historyRoute = createRoute({
  method: "get",
  path: "/history",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(200).optional().default(100),
      offset: z.coerce.number().int().min(0).optional().default(0),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.array(SessionSchema)),
        },
      },
      description: "Session history",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const statsRoute = createRoute({
  method: "get",
  path: "/stats/:gameId",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    params: z.object({ gameId: z.string().uuid() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(SessionStatsSchema),
        },
      },
      description: "Game play stats",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

// Backward compatible legacy routes
const startLegacyRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ gameId: z.string().uuid() }),
        },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: SuccessSchema(SessionSchema) } },
      description: "Session started",
    },
  },
});

const endLegacyRoute = createRoute({
  method: "patch",
  path: "/:id/end",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(SessionSchema) } },
      description: "Session ended",
    },
  },
});

const pauseLegacyRoute = createRoute({
  method: "patch",
  path: "/:id/pause",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(SessionSchema) } },
      description: "Session paused",
    },
  },
});

const resumeLegacyRoute = createRoute({
  method: "patch",
  path: "/:id/resume",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(SessionSchema) } },
      description: "Session resumed",
    },
  },
});

const listLegacyRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Sessions"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(z.array(SessionSchema)) } },
      description: "User sessions",
    },
  },
});

export function createSessionRoutes(controller: SessionsController) {
  return new OpenAPIHono()
    .openapi(startRoute, controller.startSession)
    .openapi(heartbeatRoute, controller.heartbeatSession)
    .openapi(endRoute, controller.endSession)
    .openapi(activeRoute, controller.activeSession)
    .openapi(historyRoute, controller.history)
    .openapi(statsRoute, controller.stats)
    .openapi(startLegacyRoute, controller.startSession)
    .openapi(endLegacyRoute, controller.endSessionLegacy)
    .openapi(pauseLegacyRoute, controller.pauseSession)
    .openapi(resumeLegacyRoute, controller.resumeSession)
    .openapi(listLegacyRoute, controller.listSessions);
}
