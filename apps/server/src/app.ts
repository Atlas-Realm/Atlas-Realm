import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { languageDetector } from "hono/language";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { env } from "@/config/env";
import {
  activitiesRoutes,
  authRoutes,
  chatRoutes,
  gamesRoutes,
  notificationsRoutes,
  sessionRoutes,
  socialRoutes,
  usersRoutes,
} from "@/container";
import { t } from "@/lib/i18n";
import { errorHandler } from "@/middleware/error-handler";

export function createApp() {
  const allowedOrigins =
    env.NODE_ENV === "production"
      ? ["tauri://localhost", "https://tauri.localhost"]
      : [
          "http://localhost:1420",
          "http://127.0.0.1:1420",
          "tauri://localhost",
          "https://tauri.localhost",
        ];

  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        const lang = c.get("language") ?? "en";
        return c.json(
          {
            success: false,
            error: t(lang, "errors.validation_failed"),
            details: result.error.flatten(),
          },
          422,
        );
      }
    },
  });

  app.use("*", requestId());

  const loggerMiddleware = logger();
  app.use("*", (c, next) => {
    const skip = ["/api/openapi.json", "/api/docs"];
    if (skip.includes(c.req.path)) return next();
    return loggerMiddleware(c, next);
  });

  app.use(
    "*",
    languageDetector({
      supportedLanguages: ["tr", "en"],
      fallbackLanguage: "en",
      order: ["header"],
      lookupFromHeaderKey: "accept-language",
      caches: false,
    }),
  );

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return origin;
        return allowedOrigins.includes(origin) ? origin : "";
      },
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "Accept-Language"],
      credentials: true,
    }),
  );

  app.route("/api/auth", authRoutes);
  app.route("/api/users", usersRoutes);
  app.route("/api/games", gamesRoutes);
  app.route("/api/sessions", sessionRoutes);
  app.route("/api/activities", activitiesRoutes);
  app.route("/api/social", socialRoutes);
  app.route("/api/chat", chatRoutes);
  app.route("/api/notifications", notificationsRoutes);

  app.doc("/api/openapi.json", {
    openapi: "3.0.0",
    info: { title: "Atlas Realm API", version: "1.0.0" },
    servers: [{ url: `http://${env.HOST}:${env.PORT}` }],
  });

  app.get("/api/docs", apiReference({ url: "/api/openapi.json" }));

  app.onError(errorHandler);
  app.notFound((c) => {
    const lang = c.get("language") ?? "en";
    return c.json({ success: false, error: t(lang, "errors.route_not_found") }, 404);
  });

  return app;
}
