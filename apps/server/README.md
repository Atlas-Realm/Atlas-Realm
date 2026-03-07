# Atlas Realm Server

Atlas Realm backend service built with Bun + Hono + Drizzle + Redis.

## Stack

- Runtime: Bun
- HTTP: Hono + `@hono/zod-openapi`
- DB: PostgreSQL + Drizzle ORM
- Cache: Redis (`ioredis`)
- Validation: Zod
- API docs: Scalar (`/api/docs`)

## Architecture

Server follows strict OOP layering per feature:

- `*.types.ts`: contracts and DTOs
- `*.repository.ts`: database access only
- `*.service.ts`: business logic
- `*.controller.ts`: request/response adaptation
- `*.routes.ts`: OpenAPI route definitions

Dependency injection is centralized in [`src/container.ts`](/Users/kadir/Desktop/Software/Atlas/Atlas-Realm/apps/server/src/container.ts).

## Feature Modules

- `auth`
- `users`
- `games`
- `game-sessions`
- `activities`
- `social`
- `chat`
- `notifications`

## API Base

- Base URL: `http://127.0.0.1:3000`
- OpenAPI JSON: `/api/openapi.json`
- Docs UI: `/api/docs`

## Implemented MVP Endpoints

### Auth `/api/auth`

- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /logout`
- `GET /me`
- `GET /google`
- `GET /discord`

### Users `/api/users`

- `GET /me`
- `PATCH /me`
- `GET /search?q=`
- `GET /:username`

### Games `/api/games`

- `GET /library`
- `POST /library`
- `POST /library/sync`
- `PATCH /library/:gameId`
- `DELETE /library/:gameId`
- `GET /search?q=&source=`
- `GET /:id` (compatibility endpoint)

### Sessions `/api/sessions`

- `POST /start`
- `POST /heartbeat`
- `POST /end`
- `GET /active`
- `GET /history`
- `GET /stats/:gameId`
- Legacy compatibility routes from previous version are still mounted.

### Activities `/api/activities`

- `GET /feed`
- `GET /me`
- `GET /user/:userId`

### Social `/api/social`

- `GET /friends`
- `POST /friends/request`
- `GET /friends/requests/pending`
- `POST /friends/request/:id/accept`
- `POST /friends/request/:id/reject`
- `DELETE /friends/:friendId`

### Chat `/api/chat`

- `GET /conversations`
- `GET /conversation/:userId`
- `POST /send`
- `POST /read/:senderId`

### Notifications `/api/notifications`

- `GET /`
- `PATCH /:id/read`
- `PATCH /read-all`

## Environment

Use [`apps/server/.env.example`](/Users/kadir/Desktop/Software/Atlas/Atlas-Realm/apps/server/.env.example) as reference.

Required core vars:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

Optional:

- `RAWG_API_KEY`
- `STEAM_API_KEY`
- `IGDB_CLIENT_ID`
- `IGDB_CLIENT_SECRET`
- `GOOGLE_OAUTH_URL`
- `DISCORD_OAUTH_URL`

## Local Development

From repository root:

```sh
bun install
bun --filter server dev
```

Or from `apps/server`:

```sh
bun install
bun run dev
```

## Database

Generate migration:

```sh
bun run db:generate
```

Run migrations:

```sh
bun run db:migrate
```

Seed data:

```sh
bun run db:seed
```

Current migrations include:

- `0000_sharp_hellion`
- `0001_blue_spirit`
- `0002_fantastic_romulus`

## Response Contracts

- Success: `{ success: true, data }`
- Error: `{ success: false, error, code? }`

All domain errors are handled by global error middleware with i18n support (`tr`, `en`).
