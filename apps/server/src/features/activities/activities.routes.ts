import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/middleware/auth";
import type { ActivitiesController } from "./activities.controller";

const ActivitySchema = z.object({
  id: z.string().uuid(),
  actorId: z.string().uuid(),
  type: z.string(),
  payload: z.unknown().nullable(),
  visibility: z.enum(["public", "friends", "private"]),
  createdAt: z.string(),
});

const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const SuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), data });

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

const feedRoute = createRoute({
  method: "get",
  path: "/feed",
  tags: ["Activities"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { query: PaginationQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(z.array(ActivitySchema)) } },
      description: "Friend activity feed",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const meRoute = createRoute({
  method: "get",
  path: "/me",
  tags: ["Activities"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { query: PaginationQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(z.array(ActivitySchema)) } },
      description: "Own activities",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const byUserRoute = createRoute({
  method: "get",
  path: "/user/:userId",
  tags: ["Activities"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    params: z.object({ userId: z.string().uuid() }),
    query: PaginationQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(z.array(ActivitySchema)) } },
      description: "Activities by user",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

export function createActivitiesRoutes(controller: ActivitiesController) {
  return new OpenAPIHono()
    .openapi(feedRoute, controller.feed)
    .openapi(meRoute, controller.me)
    .openapi(byUserRoute, controller.byUser);
}
