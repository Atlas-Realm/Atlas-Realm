import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/middleware/auth";
import * as handlers from "./games.handlers";

const GameResultSchema = z.object({
  externalId: z.string(),
  source: z.enum(["steam", "rawg", "igdb", "manual"]),
  name: z.string(),
  metadata: z.record(z.unknown()).nullable(),
});

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

const searchRoute = createRoute({
  method: "get",
  path: "/search",
  tags: ["Games"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    query: z.object({
      q: z.string().min(1),
      source: z.enum(["rawg", "steam"]).optional().default("rawg"),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), data: z.array(GameResultSchema) }),
        },
      },
      description: "Search results",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const getGameRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["Games"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              id: z.string(),
              externalId: z.string().nullable(),
              source: z.string(),
              name: z.string(),
              metadata: z.unknown(),
            }),
          }),
        },
      },
      description: "Game found",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

export const gamesRoutes = new OpenAPIHono()
  .openapi(searchRoute, handlers.searchGames)
  .openapi(getGameRoute, handlers.getGame);
