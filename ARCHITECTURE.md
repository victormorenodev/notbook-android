# Notbook Frontend — Architecture

> React Native · Expo SDK 52+ · Expo Router · TypeScript  
> Runs on physical devices via **Expo Go** — no custom native builds.

---

## 1. Directory Layout

```
notbook_frontend/
├── app.json                    # Expo configuration
├── tsconfig.json               # TypeScript (strict, @/ path alias → ./src/)
├── assets/                     # Static images, fonts, icons
└── src/
    ├── global.css              # Global stylesheet
    │
    ├── app/                    # Expo Router file-based routes
    │   ├── _layout.tsx         #   Root layout — auth gate, providers
    │   ├── (auth)/
    │   │   ├── _layout.tsx     #   Auth group layout (no header)
    │   │   └── login.tsx       #   Google Sign-In screen
    │   ├── (tabs)/
    │   │   ├── _layout.tsx     #   Tab navigator layout
    │   │   ├── index.tsx       #   Notes list (home)
    │   │   └── profile.tsx     #   User profile / settings
    │   └── note/
    │       └── [id].tsx        #   Note editor (dynamic route)
    │
    ├── api/                    # HTTP layer — one file per resource
    │   ├── client.ts           #   Axios instance, interceptors, token refresh
    │   ├── auth.ts             #   POST /auth/google, /auth/refresh, /auth/logout
    │   └── pages.ts            #   CRUD + reorder for /pages
    │
    ├── stores/                 # Zustand stores — one file per domain
    │   └── auth-store.ts       #   Tokens, user object, login/logout actions
    │
    ├── types/                  # Shared TypeScript types
    │   ├── api.ts              #   ApiResponse<T>, ApiError, ValidationDetail
    │   ├── auth.ts             #   User, AuthTokens, GoogleAuthPayload
    │   └── note.ts             #   Page, PageContent (Tiptap JSON), ReorderItem
    │
    ├── hooks/                  # React hooks — thin wrappers
    │   ├── use-auth.ts         #   Google sign-in orchestration
    │   ├── use-pages.ts        #   react-query hooks for pages CRUD
    │   └── use-theme.ts        #   Light/dark theme (from scaffold)
    │
    ├── components/             # Reusable UI components
    │   ├── ui/                 #   Primitives (button, input, card, etc.)
    │   └── ...                 #   Domain components (note-card, empty-state)
    │
    └── constants/
        ├── config.ts           #   API_BASE_URL, GOOGLE_CLIENT_ID
        └── theme.ts            #   Color palette, spacing, typography tokens
```

### Naming conventions

| Kind        | Pattern              | Example                  |
| ----------- | -------------------- | ------------------------ |
| Files       | `kebab-case.ts(x)`   | `auth-store.ts`          |
| Components  | `PascalCase`         | `NoteCard`               |
| Hooks       | `use-*.ts`           | `use-pages.ts`           |
| Types       | `PascalCase`         | `PageContent`            |
| Constants   | `UPPER_SNAKE`        | `API_BASE_URL`           |
| Stores      | `use*Store` (zustand)| `useAuthStore`           |

---

## 2. Dependency Map

```
┌──────────────────────────────────────────────────────────┐
│                    Expo Router (app/)                     │
│   Screens consume hooks & components, never call API     │
│   directly.                                              │
├──────────┬───────────────────────┬───────────────────────┤
│  hooks/  │     components/       │      stores/          │
│          │                       │                       │
│  Wraps   │  Pure UI.             │  Zustand.             │
│  react-  │  Receives data via    │  Auth state only.     │
│  query   │  props.               │  Server state lives   │
│  calls.  │  No API imports.      │  in react-query.      │
├──────────┴───────────────────────┴───────────────────────┤
│                       api/                               │
│  Axios client with interceptors.                         │
│  One function per endpoint. Returns typed data.          │
├──────────────────────────────────────────────────────────┤
│                     types/                               │
│  Shared across all layers. No runtime logic.             │
└──────────────────────────────────────────────────────────┘
```

**Import rule:** arrows point downward only. A screen may import from
`hooks/`, `components/`, `stores/`, `constants/`, and `types/`. A hook
may import from `api/`, `stores/`, and `types/`. The `api/` layer imports
only from `types/` and `constants/`. Nothing imports from `app/`.

---

## 3. State Management Strategy

| Domain         | Tool             | Why                                        |
| -------------- | ---------------- | ------------------------------------------ |
| Auth / tokens  | Zustand + SecureStore | Synchronous reads, persisted across restarts |
| Server data    | @tanstack/react-query | Caching, refetching, optimistic updates     |
| Form / local   | React `useState` | Ephemeral, component-scoped                |

### Zustand store shape (auth)

```ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
}
```

---

## 4. API Client Architecture

### Axios instance (`api/client.ts`)

- Base URL from `constants/config.ts`.
- **Request interceptor:** reads `accessToken` from the auth store and
  attaches `Authorization: Bearer <token>`.
- **Response interceptor (401 handler):**
  1. Calls `POST /auth/refresh` with the stored `refreshToken`.
  2. On success → updates both tokens in SecureStore + Zustand, retries
     the original request.
  3. On failure → clears session, redirects to login.
- All functions return the unwrapped `data` field from the API envelope
  (`ApiResponse<T>`), throwing on `success: false`.

### API response envelope (typed)

```ts
// Every backend response follows this shape.
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

interface ApiError {
  code: string;
  message: string;
  details?: ValidationDetail[];
}
```

---

## 5. Authentication Flow

```
┌─────────────┐    id_token    ┌─────────────┐   access_token   ┌─────────┐
│  Google      │ ─────────────▶│  Backend     │ ───────────────▶ │ Secure  │
│  (expo-auth- │               │  POST /auth/ │   refresh_token  │ Store   │
│   session)   │               │  google      │ ───────────────▶ │         │
└─────────────┘               └─────────────┘                  └─────────┘
```

1. `expo-auth-session/providers/google` opens Google consent in a WebBrowser.
2. On success, extract `id_token` from the response.
3. Send `id_token` to `POST /api/v1/auth/google`.
4. Store `access_token` + `refresh_token` in `expo-secure-store`.
5. Populate Zustand auth store → triggers navigation to `(tabs)`.

**Expo Go constraint:** uses WebBrowser-based OAuth redirect, not native
Google Sign-In SDK. Requires `scheme` in `app.json` (already set to
`notbookfrontend`).

---

## 6. Note Content Model

Notes use a **Tiptap/ProseMirror JSON** structure stored as a string in the
backend's `content` JSONB column. The frontend owns the schema:

```ts
interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface PageContent {
  type: "doc";
  content: TiptapNode[];
}
```

The backend stores and returns this blob unchanged.

---

## 7. ID Strategy

- **UUID v4** generated on-device using `uuid` + `react-native-get-random-values`.
- Client passes `id` when creating pages via `POST /api/v1/pages`.
- Enables future offline-first: notes created offline won't collide on sync.

---

## 8. Navigation Map

```
Root _layout.tsx (auth gate)
│
├── (auth)/             ← shown when !isAuthenticated
│   └── login.tsx
│
├── (tabs)/             ← shown when isAuthenticated
│   ├── index.tsx       ← notes list
│   └── profile.tsx     ← user info, logout
│
└── note/[id].tsx       ← full-screen note editor (stack push)
```

The root layout reads `useAuthStore().isAuthenticated` and conditionally
renders the `(auth)` or `(tabs)` group. No manual redirects.

---

## 9. Future Modules (Plug-in Ready)

The architecture is designed so each new domain follows the same pattern:

| Module      | Files to add                                              |
| ----------- | --------------------------------------------------------- |
| Tags        | `types/tag.ts`, `api/tags.ts`, `hooks/use-tags.ts`       |
| Reminders   | `types/reminder.ts`, `api/reminders.ts`, `hooks/use-reminders.ts` |
| Push (FCM)  | `api/devices.ts`, `hooks/use-push-token.ts`               |
| Offline Sync| `api/sync.ts`, `stores/sync-store.ts`, local DB adapter   |

No existing file needs modification to add a new domain — just drop new
files into the correct directories and wire them into the relevant screen.
