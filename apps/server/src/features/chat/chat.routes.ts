import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/middleware/auth";
import type { ChatController } from "./chat.controller";

const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  content: z.string(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
});

const ConversationSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
  lastMessage: ChatMessageSchema,
  unreadCount: z.number().int().min(0),
});

const SuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), data });

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

const listConversationsRoute = createRoute({
  method: "get",
  path: "/conversations",
  tags: ["Chat"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(z.array(ConversationSchema)) } },
      description: "Recent conversations",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const getConversationRoute = createRoute({
  method: "get",
  path: "/conversation/:userId",
  tags: ["Chat"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    params: z.object({ userId: z.string().uuid() }),
    query: z.object({
      limit: z.coerce.number().int().min(1).max(200).optional().default(100),
      offset: z.coerce.number().int().min(0).optional().default(0),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(z.array(ChatMessageSchema)) } },
      description: "Conversation messages",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

const sendRoute = createRoute({
  method: "post",
  path: "/send",
  tags: ["Chat"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ receiverId: z.string().uuid(), content: z.string().min(1).max(4000) }),
        },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: SuccessSchema(ChatMessageSchema) } },
      description: "Message sent",
    },
    400: { content: { "application/json": { schema: ErrorSchema } }, description: "Bad request" },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

const markReadRoute = createRoute({
  method: "post",
  path: "/read/:senderId",
  tags: ["Chat"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { params: z.object({ senderId: z.string().uuid() }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.object({ updated: z.number().int().min(0) })),
        },
      },
      description: "Messages marked read",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

export function createChatRoutes(controller: ChatController) {
  return new OpenAPIHono()
    .openapi(listConversationsRoute, controller.listConversations)
    .openapi(getConversationRoute, controller.getConversation)
    .openapi(sendRoute, controller.send)
    .openapi(markReadRoute, controller.markRead);
}
