// Composition root — the only place where `new` is called.
import { CacheService, redis } from "@/cache";
import { db } from "@/db";

import { AuthController } from "@/features/auth/auth.controller";
import { AuthRepository } from "@/features/auth/auth.repository";
import { createAuthRoutes } from "@/features/auth/auth.routes";
import { AuthService } from "@/features/auth/auth.service";

import { UsersController } from "@/features/users/users.controller";
import { UsersRepository } from "@/features/users/users.repository";
import { createUsersRoutes } from "@/features/users/users.routes";
import { UsersService } from "@/features/users/users.service";

import { ActivitiesController } from "@/features/activities/activities.controller";
import { ActivitiesRepository } from "@/features/activities/activities.repository";
import { createActivitiesRoutes } from "@/features/activities/activities.routes";
import { ActivitiesService } from "@/features/activities/activities.service";

import { NotificationsController } from "@/features/notifications/notifications.controller";
import { NotificationsRepository } from "@/features/notifications/notifications.repository";
import { createNotificationsRoutes } from "@/features/notifications/notifications.routes";
import { NotificationsService } from "@/features/notifications/notifications.service";

import { GamesController } from "@/features/games/games.controller";
import { GamesRepository } from "@/features/games/games.repository";
import { createGamesRoutes } from "@/features/games/games.routes";
import { GamesService } from "@/features/games/games.service";

import { SessionsController } from "@/features/game-sessions/sessions.controller";
import { SessionsRepository } from "@/features/game-sessions/sessions.repository";
import { createSessionRoutes } from "@/features/game-sessions/sessions.routes";
import { SessionsService } from "@/features/game-sessions/sessions.service";

import { SocialController } from "@/features/social/social.controller";
import { SocialRepository } from "@/features/social/social.repository";
import { createSocialRoutes } from "@/features/social/social.routes";
import { SocialService } from "@/features/social/social.service";

import { ChatController } from "@/features/chat/chat.controller";
import { ChatRepository } from "@/features/chat/chat.repository";
import { createChatRoutes } from "@/features/chat/chat.routes";
import { ChatService } from "@/features/chat/chat.service";

const cacheService = new CacheService(redis);

const authRepository = new AuthRepository(db);
const authService = new AuthService(authRepository, cacheService);
const authController = new AuthController(authService);
export const authRoutes = createAuthRoutes(authController);

const usersRepository = new UsersRepository(db);
const usersService = new UsersService(usersRepository);
const usersController = new UsersController(usersService);
export const usersRoutes = createUsersRoutes(usersController);

const activitiesRepository = new ActivitiesRepository(db);
const activitiesService = new ActivitiesService(activitiesRepository);
const activitiesController = new ActivitiesController(activitiesService);
export const activitiesRoutes = createActivitiesRoutes(activitiesController);

const notificationsRepository = new NotificationsRepository(db);
const notificationsService = new NotificationsService(notificationsRepository);
const notificationsController = new NotificationsController(notificationsService);
export const notificationsRoutes = createNotificationsRoutes(notificationsController);

const gamesRepository = new GamesRepository(db);
const gamesService = new GamesService(gamesRepository, cacheService, activitiesService);
const gamesController = new GamesController(gamesService);
export const gamesRoutes = createGamesRoutes(gamesController);

const sessionsRepository = new SessionsRepository(db);
const sessionsService = new SessionsService(sessionsRepository, cacheService, activitiesService);
const sessionsController = new SessionsController(sessionsService);
export const sessionRoutes = createSessionRoutes(sessionsController);

const socialRepository = new SocialRepository(db);
const socialService = new SocialService(socialRepository, notificationsService, activitiesService);
const socialController = new SocialController(socialService);
export const socialRoutes = createSocialRoutes(socialController);

const chatRepository = new ChatRepository(db);
const chatService = new ChatService(chatRepository, notificationsService);
const chatController = new ChatController(chatService);
export const chatRoutes = createChatRoutes(chatController);
