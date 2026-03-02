import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/error-handler";
import { authRoutes } from "@/features/auth/auth.routes";
import { gamesRoutes } from "@/features/games/games.routes";
import { sessionRoutes } from "@/features/game-sessions/sessions.routes";

export function createApp() {
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: "Validation failed",
            details: result.error.flatten(),
          },
          422,
        );
      }
    },
  });

  app.use("*", requestId());
  app.use("*", logger());
  app.use(
    "*",
    cors({
      origin: env.NODE_ENV === "production" ? "tauri://localhost" : "*",
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.route("/api/auth", authRoutes);
  app.route("/api/games", gamesRoutes);
  app.route("/api/sessions", sessionRoutes);

  app.doc("/api/openapi.json", {
    openapi: "3.0.0",
    info: { title: "Atlas Realm API", version: "1.0.0" },
    servers: [{ url: `http://${env.HOST}:${env.PORT}` }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  });
  app.get("/api/docs", apiReference({ spec: { url: "/api/openapi.json" } }));

  app.onError(errorHandler);
  app.notFound((c) => c.json({ success: false, error: "Route not found" }, 404));

  return app;
}
