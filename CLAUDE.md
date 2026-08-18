# Notbook Frontend — Claude Instructions

> Read `ARCHITECTURE.md` for full structural context.
> Read `AGENTS.md` for shared rules — this file adds Claude-specific guidance.

---

## Project Overview

Notbook is a mobile note-taking app (React Native + Expo SDK 52+ + Expo Router).
Backend is a Go REST API already running. This codebase is the frontend only.

**Critical constraint:** everything must run in **Expo Go** on physical devices.
No native modules, no custom dev client, no bare RN configs.

---

## Code Style (Quick Reference)

- Functions: **4–20 lines**. Split longer ones.
- Files: **<500 lines**. One responsibility per file.
- **No `any`**. Every function typed, every return typed.
- Names: specific, unique, **<5 grep hits**. Not `data`, `handler`, `Manager`.
- Early returns. Max 2 levels of indentation.
- Comments: **WHY not WHAT.** Keep existing comments on refactor.
- Docstrings on exported functions with intent + usage example.

---

## Architecture Invariants

1. **Screens → Hooks → API.** Screens never import from `api/` directly.
2. **Components are pure.** Props in, JSX out. No API calls, no store reads.
3. **One import direction:** `app/ → hooks/ → api/ → types/`. Never reverse.
4. **Auth state** in Zustand + SecureStore. **Server data** in react-query.
5. **Axios is wrapped** in `api/client.ts`. No other file imports Axios.
6. **SecureStore is wrapped** in `stores/auth-store.ts`. No other file calls it.
7. **UUIDs** generated on-device for new resources (`uuid` + `react-native-get-random-values`).

---

## When Modifying Code

- Before adding a dependency, confirm Expo Go compatibility.
- Before creating a file, check `ARCHITECTURE.md` for the correct directory.
- Before adding a function, check if the pattern already exists — reuse it.
- When fixing a bug, write a regression test.
- When refactoring, preserve all existing comments.

---

## File Locations (@ = src/)

| Need                   | Location                          |
| ---------------------- | --------------------------------- |
| New API endpoint       | `@/api/<resource>.ts`             |
| New data type          | `@/types/<domain>.ts`             |
| New react-query hook   | `@/hooks/use-<domain>.ts`         |
| New screen             | `@/app/<route>.tsx`               |
| New UI primitive       | `@/components/ui/<name>.tsx`      |
| New domain component   | `@/components/<name>.tsx`         |
| Config / env values    | `@/constants/config.ts`           |
| Color / spacing tokens | `@/constants/theme.ts`            |

---

## Testing

- Command: `npm test`
- Tests beside source: `foo.test.ts` next to `foo.ts`.
- Mock I/O with named fakes, not inline stubs.
- F.I.R.S.T: fast, independent, repeatable, self-validating, timely.

---

## Formatting

Use Prettier (default config). Run `npx prettier --write .` before committing.
Don't bikeshed style — Prettier decides.

---

## API Contract

Backend envelope — every response:

```ts
// Success
{ "success": true, "data": T }

// Error
{ "success": false, "error": { "code": string, "message": string, "details?": [...] } }
```

The `api/client.ts` unwraps this automatically. API functions return `T` directly
and throw on `success: false`.

---

## Don'ts

- Don't install packages requiring custom native builds.
- Don't put business logic in components.
- Don't use `any` or untyped `Record`.
- Don't import from `app/` into `api/`, `hooks/`, or `components/`.
- Don't call SecureStore or Axios outside their wrapper modules.
- Don't strip existing comments during refactors.


---

## Agentic Teaching & Communication

- **Educational Focus:** This project is used for learning. When completing tasks, always provide a "tour" explanation.
- **Tour Content:** Focus on teaching the user about critical decisions, tricky code parts, system design, and the intention behind the code. Maximize the apprenticeship value.
- **Task Granularity:** When executing complex refactors, split the work into smaller modular tasks and commit them individually. Complete ONE task at a time and provide the educational tour after each step.
- **CRITICAL RULE:** NEVER COMMIT OR STAGE ANYTHING EXCEPT WHEN EXPLICITLY INSTRUCTED TO. Just provide the modified files and a suggested commit message.
