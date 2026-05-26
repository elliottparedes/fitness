# Architecture

This project follows a **layered structure** so routes stay thin and new features (OAuth, PR charts, REST API) can plug in without rewriting pages.

## Layers

```
Routes (+page.server.ts)     ← HTTP: load data, call services, map errors
        ↓
Services                     ← Business rules, orchestration, validation results
        ↓
Repositories                 ← Drizzle queries only (no SvelteKit imports)
        ↓
Database (MySQL + Drizzle schema)
```

**Domain** (`src/lib/domain/`) holds types and constants shared by UI and server — no DB or SvelteKit dependencies.

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Domain | `src/lib/domain/` | `ExerciseCategory`, labels, view models |
| Validation | `src/lib/server/validation/` | Parse `FormData`, reusable field rules |
| Repositories | `src/lib/server/repositories/` | CRUD and queries per aggregate |
| Services | `src/lib/server/services/` | Use-cases: “add workout entry”, “register user” |
| Auth helpers | `src/lib/server/auth/` | `requireSession()` for actions |
| Routes | `src/routes/` | Wire HTTP to services; no raw SQL |

## Adding a feature

### New exercise category (example)

1. Add value to `EXERCISE_CATEGORIES` in `domain/exercise.ts`.
2. Extend `isStrengthCategory()` or add `isCardioCategory()` if logging differs.
3. Add seed rows in `drizzle/seed/exercises.ts`.
4. Update `workoutService.addEntryFromForm` branch for the new logging shape.
5. Adjust UI tabs in `workouts/[id]/+page.svelte`.

### New API endpoint (example)

1. Add `src/routes/api/.../+server.ts`.
2. Call the same **service** methods as form actions — do not duplicate SQL in the route.

### New persistence table

1. Add table in `src/lib/server/db/schema.ts`.
2. Add repository methods.
3. Add service methods that enforce ownership (user id checks).
4. Run `npm run db:push`.

## Conventions

- **Service results**: `{ ok: true, data } | { ok: false, message }` — routes use `failIfError()` from `lib/server/actions/handle-result.ts`.
- **User scope**: Every workout mutation goes through `workoutService.assertOwned()` or `findForUser()`.
- **Forms + SMUI**: Use `HiddenField` so bound SMUI inputs still submit `name`/`value` pairs.
- **Imports**: Prefer `$lib/domain/*` for types; avoid importing `db` from route files.

## What not to do

- Put Drizzle queries in `+page.server.ts`.
- Import `$lib/server/*` from `.svelte` files (server-only).
- Duplicate validation in both UI and server — server validation in `validation/` + `services/` is the source of truth.
