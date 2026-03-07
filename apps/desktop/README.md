# Atlas Realm Desktop Architecture

Atlas Realm desktop client is a **Tauri + React** application optimized for low-latency UX and minimal re-render cost.

## Core Principles

- **No Context API for app state**: global state uses Zustand stores.
- **Server state in TanStack Query**: all HTTP read/write flows are query/mutation-driven.
- **Feature-based structure**: domain boundaries are explicit and scalable.
- **DaisyUI-based UI**: component primitives and theme tokens drive a consistent UI system.
- **Contract stability**: backend endpoint contracts and Tauri command names remain unchanged.

## Folder Architecture

`src` is organized in 3 layers:

- `src/app`
  - Routing, providers, guard logic, shell composition.
  - Route-level lazy loading is configured in `app/router/AppRouter.tsx`.
- `src/features`
  - Domain modules: `auth`, `launcher`, `library`, `sessions`, `profile`, `ui`.
  - Each feature uses `api`, `queries`, `store` (if needed), and `pages`.
- `src/shared`
  - Shared infrastructure: HTTP client, query keys/client, Tauri bridge, shared types, utilities.

## State Management

### Zustand (client/global state)

- `auth-store`
  - bootstrap lifecycle (`idle/loading/ready`), auth mode, auth UI error, token presence.
  - auth flow actions (`bootstrap`, `setAuthenticatedTokens`, `clearAuthSession`, `markUnauthorized`).
- `session-store`
  - local session stream from Tauri `session-update` event.
  - listener setup is isolated from UI for high-frequency updates.
- `ui-store`
  - global shell UI state (`mobileDrawerOpen`).

### Selector Rules

- Use **atomic selectors** (`state => state.field`) for component subscriptions.
- Avoid broad object selectors to prevent unnecessary re-renders.

## TanStack Query Strategy

Standardized query keys:

- `auth.me`
- `library.list`, `library.search(query, source)`
- `sessions.active`, `sessions.history`, `sessions.stats(gameId)`
- `profile.me`

Mutation invalidation rules:

- Library mutations (`sync/add/update/delete`) invalidate `library.list`.
- Profile update invalidates both `profile.me` and `auth.me`.
- Logout clears query cache.

Refetch policy (balanced):

- `refetchOnWindowFocus: true`
- `refetchOnReconnect: true`
- moderate `staleTime` per screen type

## Auth and Lifecycle Flow

1. App bootstraps auth (`set_api_base_url`, token lookup).
2. If token exists, `auth.me` query hydrates user state.
3. Unauthorized responses trigger store reset + query cache clear.
4. Tauri local session listener starts once at app lifecycle level.

## UI System (DaisyUI)

- DaisyUI components are used as primary primitives (`btn`, `card`, `menu`, `input`, `select`, `badge`, `table`, `drawer`, `navbar`, `stats`, `alert`).
- Theme is configured in `src/App.css` with teal/dark Atlas tokens.
- Custom CSS is limited to theme-level visual identity and minor shell behavior.

## Tauri Contract (Unchanged)

These commands are still used as-is:

- `scan_games`
- `set_auth_tokens`
- `get_access_token`
- `refresh_auth_tokens`
- `set_library_index`
- `logout_auth`
- `set_api_base_url`

## Dev Commands

From `apps/desktop`:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run tauri`

From monorepo root (existing scripts):

- `yarn dev:desktop`

