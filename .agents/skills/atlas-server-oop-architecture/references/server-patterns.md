# Atlas Server Patterns

## Scope

Apply this reference for edits under `apps/server/src`.

## Stack Lock

- Runtime: Bun
- HTTP: Hono + `@hono/zod-openapi`
- API docs: `@scalar/hono-api-reference`
- Validation: Zod
- DB: Drizzle ORM + `postgres`
- Cache: `ioredis`

Do not replace these with alternative frameworks unless requested.

## App Composition

- Keep server bootstrap in `src/index.ts`.
- Keep middleware + route mounting in `src/app.ts`.
- Keep object graph construction in `src/container.ts`.
- Keep `new` calls out of feature files.

## Feature Module Contract

For each feature, maintain:

- `feature.types.ts`: interfaces and core DTO types
- `feature.repository.ts`: persistence only
- `feature.service.ts`: business logic
- `feature.controller.ts`: request/response adaptation
- `feature.routes.ts`: OpenAPI route definitions

## Layer Responsibilities

Repository:

- Inject `db` in constructor
- Use Drizzle query builders
- Return typed entities from schema in `@/db/schema`

Service:

- Inject interfaces, not concrete classes
- Encode business rules and state transitions
- Throw `AppError` subclasses for expected failures
- Use cache through `ICacheService` where needed

Controller:

- Use arrow methods for handlers
- Read `c.req.valid("json" | "query" | "param")`
- Call service once per operation
- Return `c.json(successResponse(data), statusCode)`

Routes:

- Define each endpoint with `createRoute(...)`
- Validate request with Zod
- Include explicit response schemas and status codes
- Apply `authMiddleware` route-level where required

## Error and Response Contract

- Success: `successResponse(data)` from `@/lib/response`
- Error: `AppError` hierarchy + global `errorHandler`
- Translation keys must exist in `@/lib/i18n.ts`
- Use consistent error code mapping from subclasses in `@/lib/errors`

## DI and Wiring Pattern

1. Instantiate repositories with `db`.
2. Instantiate services with repository interfaces and optional cache.
3. Instantiate controllers with services.
4. Export routes via `createXRoutes(controller)` from `src/container.ts`.
5. Mount exported routes in `src/app.ts`.

## Env and Config Rules

- Add or update env vars only in `src/config/env.ts`.
- Validate each env var via Zod schema.
- Keep defaults and optionality explicit.

## Skeleton

```ts
// feature.repository.ts
export class FeatureRepository implements IFeatureRepository {
  constructor(private readonly db: typeof DB) {}
}
```

```ts
// feature.service.ts
export class FeatureService implements IFeatureService {
  constructor(private readonly repo: IFeatureRepository) {}
}
```

```ts
// feature.controller.ts
export class FeatureController {
  constructor(private readonly service: IFeatureService) {}

  action = async (c: Context) => {
    const input = c.req.valid("json" as never);
    const result = await this.service.action((input as any).id);
    return c.json(successResponse(result), 200);
  };
}
```

```ts
// feature.routes.ts
export function createFeatureRoutes(controller: FeatureController) {
  return new OpenAPIHono().openapi(actionRoute, controller.action);
}
```
