import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/middleware/auth";
import type { UsersController } from "./users.controller";

const PublicUserProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  displayName: z.string().nullable(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
});

const MeSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  displayName: z.string().nullable(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const SuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), data });

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

const getMeRoute = createRoute({
  method: "get",
  path: "/me",
  tags: ["Users"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(MeSchema) } },
      description: "Current user profile",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const patchMeRoute = createRoute({
  method: "patch",
  path: "/me",
  tags: ["Users"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              displayName: z.string().min(1).max(64).nullable().optional(),
              bio: z.string().max(280).nullable().optional(),
              avatarUrl: z.string().url().nullable().optional(),
            })
            .refine((data) => Object.keys(data).length > 0, {
              message: "At least one field must be provided",
            }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(
            z.object({
              id: z.string().uuid(),
              email: z.string().email(),
              username: z.string(),
              displayName: z.string().nullable(),
              bio: z.string().nullable(),
              avatarUrl: z.string().nullable(),
              updatedAt: z.string(),
            }),
          ),
        },
      },
      description: "Current user profile updated",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    422: { content: { "application/json": { schema: ErrorSchema } }, description: "Validation failed" },
  },
});

const searchRoute = createRoute({
  method: "get",
  path: "/search",
  tags: ["Users"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    query: z.object({
      q: z.string().min(1),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.array(PublicUserProfileSchema)),
        },
      },
      description: "User search results",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const byUsernameRoute = createRoute({
  method: "get",
  path: "/:username",
  tags: ["Users"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    params: z.object({ username: z.string().min(3).max(32) }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(PublicUserProfileSchema),
        },
      },
      description: "Public user profile",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

export function createUsersRoutes(controller: UsersController) {
  return new OpenAPIHono()
    .openapi(getMeRoute, controller.getMe)
    .openapi(patchMeRoute, controller.updateMe)
    .openapi(searchRoute, controller.search)
    .openapi(byUsernameRoute, controller.getByUsername);
}
