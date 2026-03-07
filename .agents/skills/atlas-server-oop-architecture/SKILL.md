---
name: atlas-server-oop-architecture
description: Implement and refactor code in Atlas Realm `apps/server` with strict adherence to the existing Hono + Drizzle + Redis + Bun architecture. Use when adding or changing API endpoints, feature modules, middleware, services, repositories, auth flow, cache logic, schema, migrations, or env config so layering, OOP boundaries, and current libraries remain consistent.
---

# Atlas Server OOP Architecture

## Overview

Apply Atlas server changes without breaking architecture consistency. Preserve current libraries, response/error contracts, and OOP layering in every edit.

## Required Workflow

1. Read [references/server-patterns.md](references/server-patterns.md) before editing.
2. Identify affected layer(s): route, controller, service, repository, middleware, config, schema.
3. Implement changes with constructor-based dependency injection and interface contracts.
4. Wire dependencies only in `apps/server/src/container.ts`.
5. Verify route schemas, typed validation, and response shape.
6. Keep imports with `@/` alias and TypeScript strict mode compatibility.

## Non-Negotiable Rules

- Instantiate classes with `new` only in `apps/server/src/container.ts`.
- Keep feature module shape as `*.types.ts`, `*.repository.ts`, `*.service.ts`, `*.controller.ts`, `*.routes.ts`.
- Keep controllers thin: read validated request data, call service, return `successResponse`.
- Keep services as business layer: orchestration, external API calls, cache usage, rule checks, error throwing.
- Keep repositories for database access only via Drizzle.
- Keep route definitions in `createRoute(...)` with `OpenAPIHono`, Zod schemas, and OpenAPI responses.
- Throw domain errors with `AppError` subclasses from `@/lib/errors`; do not return ad-hoc error objects.
- Keep success payload format `{ success: true, data }` and error payload format from `errorResponse(...)`.
- Reuse existing libs and patterns: `hono`, `@hono/zod-openapi`, `drizzle-orm`, `postgres`, `ioredis`, `zod`, Bun runtime APIs.
- Avoid introducing new dependencies or architecture styles unless user explicitly requests it.

## New Feature Checklist

1. Create feature folder under `apps/server/src/features/<feature-name>/`.
2. Define interfaces in `*.types.ts`.
3. Implement repository with `type { db as DB }` injection and Drizzle queries.
4. Implement service with injected interfaces (and cache where needed).
5. Implement controller class with arrow methods for route handlers.
6. Implement routes using `createRoute` and register middleware per-route when needed.
7. Register instances and exported routes in `apps/server/src/container.ts`.
8. Mount new routes in `apps/server/src/app.ts`.
9. Add translation keys in `apps/server/src/lib/i18n.ts` for new domain errors.

## Guardrails

- Prefer extension over replacement: modify existing module structure instead of introducing alternate patterns.
- Keep backwards compatibility for route paths and response contracts unless explicitly changed by user.
- Keep security behavior consistent with `authMiddleware` and JWT secrets in env.
- Keep environment variables validated through `apps/server/src/config/env.ts` using Zod schema updates.

## References

- Load [references/server-patterns.md](references/server-patterns.md) for detailed conventions and code skeletons.
