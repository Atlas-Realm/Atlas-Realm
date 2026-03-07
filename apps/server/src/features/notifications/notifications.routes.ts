import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/middleware/auth";
import type { NotificationsController } from "./notifications.controller";

const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(["friend_request", "friend_accept", "chat_message", "activity", "system"]),
  title: z.string(),
  message: z.string(),
  data: z.unknown().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

const SuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), data });

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

const listNotificationsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Notifications"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).optional().default(50),
      offset: z.coerce.number().int().min(0).optional().default(0),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(z.array(NotificationSchema)) } },
      description: "Notifications listed",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const markReadRoute = createRoute({
  method: "patch",
  path: "/:id/read",
  tags: ["Notifications"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(NotificationSchema) } },
      description: "Notification marked as read",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

const markAllReadRoute = createRoute({
  method: "patch",
  path: "/read-all",
  tags: ["Notifications"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.object({ updated: z.number().int().min(0) })),
        },
      },
      description: "All notifications marked as read",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

export function createNotificationsRoutes(controller: NotificationsController) {
  return new OpenAPIHono()
    .openapi(listNotificationsRoute, controller.listNotifications)
    .openapi(markReadRoute, controller.markRead)
    .openapi(markAllReadRoute, controller.markAllRead);
}
