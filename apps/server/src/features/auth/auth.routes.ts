import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/middleware/auth";
import type { AuthController } from "./auth.controller";

const RegisterBodySchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
});

const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RefreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

const LogoutBodySchema = z.object({
  refreshToken: z.string().min(1),
});

const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

const TokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

const SuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), data });

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

const registerRoute = createRoute({
  method: "post",
  path: "/register",
  tags: ["Auth"],
  request: { body: { content: { "application/json": { schema: RegisterBodySchema } } } },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.object({ user: AuthUserSchema, tokens: TokenSchema })),
        },
      },
      description: "Registered",
    },
    409: { content: { "application/json": { schema: ErrorSchema } }, description: "Conflict" },
    422: { content: { "application/json": { schema: ErrorSchema } }, description: "Validation failed" },
  },
});

const loginRoute = createRoute({
  method: "post",
  path: "/login",
  tags: ["Auth"],
  request: { body: { content: { "application/json": { schema: LoginBodySchema } } } },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.object({ user: AuthUserSchema, tokens: TokenSchema })),
        },
      },
      description: "Logged in",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    422: { content: { "application/json": { schema: ErrorSchema } }, description: "Validation failed" },
  },
});

const refreshRoute = createRoute({
  method: "post",
  path: "/refresh",
  tags: ["Auth"],
  request: { body: { content: { "application/json": { schema: RefreshBodySchema } } } },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.object({ tokens: TokenSchema })),
        },
      },
      description: "Tokens refreshed",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const logoutRoute = createRoute({
  method: "post",
  path: "/logout",
  tags: ["Auth"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { body: { content: { "application/json": { schema: LogoutBodySchema } } } },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.object({ loggedOut: z.literal(true) })),
        },
      },
      description: "Logged out",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const meRoute = createRoute({
  method: "get",
  path: "/me",
  tags: ["Auth"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      content: { "application/json": { schema: SuccessSchema(AuthUserSchema) } },
      description: "Current auth user",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

const oauthSchema = SuccessSchema(
  z.object({
    provider: z.enum(["google", "discord"]),
    url: z.string().url().nullable(),
  }),
);

const googleRoute = createRoute({
  method: "get",
  path: "/google",
  tags: ["Auth"],
  responses: {
    200: { content: { "application/json": { schema: oauthSchema } }, description: "Google OAuth info" },
  },
});

const discordRoute = createRoute({
  method: "get",
  path: "/discord",
  tags: ["Auth"],
  responses: {
    200: { content: { "application/json": { schema: oauthSchema } }, description: "Discord OAuth info" },
  },
});

export function createAuthRoutes(controller: AuthController) {
  return new OpenAPIHono()
    .openapi(registerRoute, controller.register)
    .openapi(loginRoute, controller.login)
    .openapi(refreshRoute, controller.refresh)
    .openapi(logoutRoute, controller.logout)
    .openapi(meRoute, controller.me)
    .openapi(googleRoute, controller.google)
    .openapi(discordRoute, controller.discord);
}
