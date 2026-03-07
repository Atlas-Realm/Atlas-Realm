## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file.

### Available skills
- atlas-server-oop-architecture: Enforce Atlas Realm server architecture in `apps/server` with strict OOP layering (repository/service/controller/routes), DI through `container.ts`, existing libraries, and response/error contracts. Use when adding or refactoring server endpoints, features, middleware, caching, auth, schema, or env config. (file: ./.agents/skills/atlas-server-oop-architecture/SKILL.md)

### How to use skills
- Trigger: If the user explicitly names a skill (for example `$atlas-server-oop-architecture`) or the request clearly matches the skill description, use that skill for the turn.
- Loading: Open the skill's `SKILL.md` and read only what is necessary to complete the task.
- References: Load files in `references/` only when needed.
- Scope: Do not carry skill usage across turns unless the user re-mentions the skill.
