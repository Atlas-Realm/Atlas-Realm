// Composition root — the only place where `new` is called.
import { db } from "@/db";
import { redis, CacheService } from "@/cache";

import { AuthRepository } from "@/features/auth/auth.repository";
import { AuthService } from "@/features/auth/auth.service";
import { AuthController } from "@/features/auth/auth.controller";
import { createAuthRoutes } from "@/features/auth/auth.routes";

import { GamesRepository } from "@/features/games/games.repository";
import { GamesService } from "@/features/games/games.service";
import { GamesController } from "@/features/games/games.controller";
import { createGamesRoutes } from "@/features/games/games.routes";

import { SessionsRepository } from "@/features/game-sessions/sessions.repository";
import { SessionsService } from "@/features/game-sessions/sessions.service";
import { SessionsController } from "@/features/game-sessions/sessions.controller";
import { createSessionRoutes } from "@/features/game-sessions/sessions.routes";

const cacheService = new CacheService(redis);

const authRepository = new AuthRepository(db);
const authService = new AuthService(authRepository, cacheService);
const authController = new AuthController(authService);
export const authRoutes = createAuthRoutes(authController);

const gamesRepository = new GamesRepository(db);
const gamesService = new GamesService(gamesRepository, cacheService);
const gamesController = new GamesController(gamesService);
export const gamesRoutes = createGamesRoutes(gamesController);

const sessionsRepository = new SessionsRepository(db);
const sessionsService = new SessionsService(sessionsRepository);
const sessionsController = new SessionsController(sessionsService);
export const sessionRoutes = createSessionRoutes(sessionsController);
