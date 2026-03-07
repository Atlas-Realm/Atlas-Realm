import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/middleware/auth";
import type { GamesController } from "./games.controller";

const GameSchema = z.object({
  id: z.string().uuid(),
  externalId: z.string().nullable(),
  source: z.enum(["steam", "rawg", "igdb", "manual"]),
  name: z.string(),
  metadata: z.unknown().nullable(),
  lastFetchedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const LibrarySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  gameId: z.string().uuid(),
  platform: z.string(),
  isInstalled: z.boolean(),
  installPath: z.string().nullable(),
  lastPlayedAt: z.string().nullable(),
  totalPlaytimeSeconds: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const LibraryItemSchema = z.object({
  library: LibrarySchema,
  game: GameSchema,
});

const GameSearchResultSchema = z.object({
  externalId: z.string(),
  source: z.enum(["rawg", "steam"]),
  name: z.string(),
  metadata: z.unknown(),
});

const GameInputSchema = z.object({
  id: z.string().uuid().optional(),
  externalId: z.string().nullable().optional(),
  source: z.enum(["steam", "rawg", "igdb", "manual"]),
  name: z.string().min(1),
  metadata: z.unknown().nullable().optional(),
});

const LibraryInputSchema = z.object({
  platform: z.string().min(1).optional(),
  isInstalled: z.boolean().optional(),
  installPath: z.string().nullable().optional(),
  lastPlayedAt: z.string().datetime().nullable().optional(),
  totalPlaytimeSeconds: z.number().int().min(0).optional(),
});

const SuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), data });

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
          schema: SuccessSchema(z.array(GameSearchResultSchema)),
        },
      },
      description: "Search results",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    502: { content: { "application/json": { schema: ErrorSchema } }, description: "External API error" },
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
      content: { "application/json": { schema: SuccessSchema(GameSchema) } },
      description: "Game details",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

const libraryListRoute = createRoute({
  method: "get",
  path: "/library",
  tags: ["Games"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.array(LibraryItemSchema)),
        },
      },
      description: "User library",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const libraryAddRoute = createRoute({
  method: "post",
  path: "/library",
  tags: ["Games"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            game: GameInputSchema,
            library: LibraryInputSchema.optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: SuccessSchema(LibraryItemSchema),
        },
      },
      description: "Game added to library",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

const librarySyncRoute = createRoute({
  method: "post",
  path: "/library/sync",
  tags: ["Games"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            items: z
              .array(
                z.object({
                  game: GameInputSchema,
                  library: LibraryInputSchema.optional(),
                }),
              )
              .min(1)
              .max(500),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.object({ synced: z.number().int().min(0) })),
        },
      },
      description: "Library synchronized",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
  },
});

const libraryUpdateRoute = createRoute({
  method: "patch",
  path: "/library/:gameId",
  tags: ["Games"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    params: z.object({ gameId: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: LibraryInputSchema.refine((data) => Object.keys(data).length > 0, {
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
          schema: SuccessSchema(LibraryItemSchema),
        },
      },
      description: "Library entry updated",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

const libraryDeleteRoute = createRoute({
  method: "delete",
  path: "/library/:gameId",
  tags: ["Games"],
  security: [{ BearerAuth: [] }],
  middleware: [authMiddleware] as const,
  request: {
    params: z.object({ gameId: z.string().uuid() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema(z.object({ deleted: z.literal(true) })),
        },
      },
      description: "Library entry deleted",
    },
    401: { content: { "application/json": { schema: ErrorSchema } }, description: "Unauthorized" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

export function createGamesRoutes(controller: GamesController) {
  return new OpenAPIHono()
    .openapi(searchRoute, controller.searchGames)
    .openapi(libraryListRoute, controller.getLibrary)
    .openapi(libraryAddRoute, controller.addLibraryItem)
    .openapi(librarySyncRoute, controller.syncLibrary)
    .openapi(libraryUpdateRoute, controller.updateLibraryItem)
    .openapi(libraryDeleteRoute, controller.removeLibraryItem)
    .openapi(getGameRoute, controller.getGame);
}
