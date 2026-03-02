import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as handlers from "./auth.handlers";

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

const AuthResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: z.object({ id: z.string(), email: z.string(), username: z.string() }),
    tokens: z.object({ accessToken: z.string(), refreshToken: z.string() }),
  }),
});

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
    201: { content: { "application/json": { schema: AuthResponseSchema } }, description: "Registered" },
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
    200: { content: { "application/json": { schema: AuthResponseSchema } }, description: "Logged in" },
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
          schema: z.object({
            success: z.literal(true),
            data: z.object({ tokens: z.object({ accessToken: z.string(), refreshToken: z.string() }) }),
          }),
        },
      },
      description: "Tokens refreshed",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

export const authRoutes = new OpenAPIHono()
  .openapi(registerRoute, handlers.register)
  .openapi(loginRoute, handlers.login)
  .openapi(refreshRoute, handlers.refresh);
