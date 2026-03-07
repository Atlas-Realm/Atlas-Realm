import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/middleware/auth";
import type { SocialController } from "./social.controller";

const FriendSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
});

const PendingRequestSchema = z.object({
  id: z.string().uuid(),
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  status: z.enum(["pending", "accepted", "rejected"]),
  createdAt: z.string(),
  sender: FriendSchema,
});

const SuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), data });

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

const getFriendsRoute = createRoute({
  method: "get",
  path: "/friends",
  tags: ["Social"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(z.array(FriendSchema)) } },
      description: "Friend list",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const sendRequestRoute = createRoute({
  method: "post",
  path: "/friends/request",
  tags: ["Social"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ userId: z.string().uuid() }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.object({ requestId: z.string().uuid() })),
        },
      },
      description: "Friend request sent",
    },
    400: { content: { "application/json": { schema: ErrorSchema } }, description: "Bad request" },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
    409: { content: { "application/json": { schema: ErrorSchema } }, description: "Conflict" },
  },
});

const pendingRequestsRoute = createRoute({
  method: "get",
  path: "/friends/requests/pending",
  tags: ["Social"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.array(PendingRequestSchema)),
        },
      },
      description: "Pending friend requests",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const acceptRequestRoute = createRoute({
  method: "post",
  path: "/friends/request/:id/accept",
  tags: ["Social"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.object({ accepted: z.literal(true), friendId: z.string().uuid() })),
        },
      },
      description: "Friend request accepted",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    403: { content: { "application/json": { schema: ErrorSchema } }, description: "Forbidden" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
    409: { content: { "application/json": { schema: ErrorSchema } }, description: "Conflict" },
  },
});

const rejectRequestRoute = createRoute({
  method: "post",
  path: "/friends/request/:id/reject",
  tags: ["Social"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.object({ rejected: z.literal(true) })),
        },
      },
      description: "Friend request rejected",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    403: { content: { "application/json": { schema: ErrorSchema } }, description: "Forbidden" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
    409: { content: { "application/json": { schema: ErrorSchema } }, description: "Conflict" },
  },
});

const removeFriendRoute = createRoute({
  method: "delete",
  path: "/friends/:friendId",
  tags: ["Social"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { params: z.object({ friendId: z.string().uuid() }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.object({ removed: z.literal(true) })),
        },
      },
      description: "Friend removed",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

export function createSocialRoutes(controller: SocialController) {
  return new OpenAPIHono()
    .openapi(getFriendsRoute, controller.getFriends)
    .openapi(sendRequestRoute, controller.sendRequest)
    .openapi(pendingRequestsRoute, controller.getPendingRequests)
    .openapi(acceptRequestRoute, controller.acceptRequest)
    .openapi(rejectRequestRoute, controller.rejectRequest)
    .openapi(removeFriendRoute, controller.removeFriend);
}
