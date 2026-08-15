# Notbook Frontend — Agent Instructions

> This file governs all AI agents working on this codebase.
> Read `ARCHITECTURE.md` first for structural context.

---

## Project Identity

- **App:** Notbook — note-taking, reminders, tags.
- **Stack:** React Native, Expo SDK 52+, Expo Router, TypeScript (strict).
- **Runtime:** Expo Go on physical devices. No custom native modules.
- **Backend:** Go (Fiber + PostgreSQL) REST API at `/api/v1`. Already built.

---

## Code Style

### Functions & Files

- Functions: **4–20 lines**. Split if longer.
- Files: **under 500 lines**. Split by responsibility.
- One thing per function, one responsibility per module (SRP).
- Early returns over nested ifs. **Max 2 levels of indentation.**

### Naming

- Names must be **specific and unique**. Avoid `data`, `handler`, `Manager`.
- Prefer names that return **<5 grep hits** in the codebase.
- Files: `kebab-case.ts(x)`. Components: `PascalCase`. Hooks: `use-*.ts`.
- Constants: `UPPER_SNAKE_CASE`. Zustand stores: `use*Store`.

### Types

- **Explicit types everywhere.** No `any`, no `Record<string, any>`, no untyped functions.
- Every API response is typed through the `ApiResponse<T>` envelope.
- Prefer `interface` for object shapes, `type` for unions and utilities.

### No Duplication

- Extract shared logic into a function or module.
- Common patterns (API calls, query hooks) follow the established templates
  in `api/` and `hooks/`.

---

## Comments

- **Keep existing comments.** Don't strip them on refactor — they carry
  intent and provenance.
- Write **WHY**, not WHAT. Skip `// increment counter` above `i++`.
- Docstrings on exported functions: **intent + one usage example.**
- Reference issue numbers / commit SHAs when a line exists because of a
  specific bug or upstream constraint.

---

## Architecture Rules

### Import Direction

```
app/ (screens) → hooks/, components/, stores/, constants/, types/
hooks/         → api/, stores/, types/
api/           → types/, constants/
components/    → types/, constants/
types/         → (nothing)
```

**Never** import from `app/` into any other layer.

### State Management

| Domain         | Tool                    |
| -------------- | ----------------------- |
| Auth / tokens  | Zustand + SecureStore   |
| Server data    | @tanstack/react-query   |
| Form / local   | React `useState`        |

- Screens **never** call `api/` functions directly. They use hooks.
- Components are **pure UI** — they receive data via props, no API imports.

### API Layer

- One file per backend resource (`api/auth.ts`, `api/pages.ts`).
- Every function unwraps the `ApiResponse<T>` envelope and throws on
  `success: false`.
- The Axios client in `api/client.ts` handles token injection and 401
  refresh automatically via interceptors.

### IDs

- Client generates UUID v4 using `uuid` + `react-native-get-random-values`.
- Always send `id` when creating resources.

---

## Dependencies

- **Inject** dependencies through constructor/parameter, not global/import.
- **Wrap** third-party libs behind a thin interface owned by this project.
  - Example: `api/client.ts` wraps Axios. No file outside `api/` imports
    Axios directly.
  - Example: `stores/auth-store.ts` wraps `expo-secure-store`. No file
    outside `stores/` calls SecureStore directly.

---

## Tests

- Tests run with: `npm test` (Jest via `jest-expo`).
- Every new function gets a test. Bug fixes get a regression test.
- Mock external I/O (API, SecureStore, AsyncStorage) with **named fake
  classes**, not inline stubs.
- Tests must be **F.I.R.S.T**: fast, independent, repeatable,
  self-validating, timely.
- Test files live next to source: `auth-store.test.ts` beside `auth-store.ts`.

---

## Formatting

- Use **Prettier** (default config). Don't discuss style beyond that.
- Run `npx prettier --write .` before committing.

---

## Logging

- **Structured JSON** when logging for debugging/observability
  (`console.log(JSON.stringify({ event, ... }))`).
- Plain text only for user-facing output (toasts, alerts).

---

## Expo Go Constraints

Before installing any package, verify it works in **Expo Go** (managed
workflow). If a library requires a custom dev client or bare RN config:

1. Check if an Expo-compatible alternative exists.
2. If none exists, flag it and do not install.

Packages known to be Expo Go safe:
- `expo-secure-store`, `expo-auth-session`, `expo-web-browser`
- `@tanstack/react-query`, `zustand`, `axios`, `uuid`
- `react-native-get-random-values`

---

## Adding a New Domain (Tags, Reminders, etc.)

Follow this checklist — no existing file should need modification:

1. `types/<domain>.ts` — define the data shapes.
2. `api/<domain>.ts` — one function per endpoint, uses `client.ts`.
3. `hooks/use-<domain>.ts` — react-query hooks wrapping the API functions.
4. `components/` — any domain-specific UI components.
5. `app/` — new screen or tab if needed.
