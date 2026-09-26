# Tasks

## 1. Server

- [x] 1.1 Server `build` writes `build/build-info.json` (`builtAt`, UTC ISO); `app.config.ts` reads it once at startup (missing → `null`); `GET /health` returns `{ status, rulesVersion, version, builtAt }`; verify server tests for both cases (file present → its time, missing → `null`) and that `npm run build -w @labyrinth/server` produces the file

## 2. Client

- [x] 2.1 Add `__BUILD_TIME__` in `vite.config.ts` (`null` in dev serve) and `clientBuiltAt()` in `config.ts`; add `client/src/session/serverWake.ts` (`startServerWake` singleton with injectable fetch/timers, 20 s attempt timeout, 2 s retry, 90 s deadline, loose body parsing of `builtAt`, `slow` after `SLOW_CONNECT_MS`, `useServerWake()` hook, one info/warn log line) and start it from `App`; verify unit tests: awake server → ready after one request with its `builtAt`, 503 then 200 → ready after two, body without `builtAt` → ready with unknown time, never answers → failed at 90 s and no further requests, a second start reuses the first, missing server URL → failed at once
- [x] 2.2 `StartScreen` gets the wake state: Play disabled + `start.waking` / `start.wakingSlow` status line while waking, `start.wakeFailed` note when failed; `BuildInfo` in the footer (client and server lines, waking / no answer / dev / unknown), fi/en strings; verify component tests for the game-session scenarios (woken on open, wakes up, does not answer) and the observability scenarios (build times in local time, server waking, no answer, dev), the existing start screen tests and locale parity
- [x] 2.3 Visual check on Galaxy S24 (light and dark): the waking state (server stopped) and the ready state with both build times (production build via `vite preview` against a built server); verify screenshots, the E2E smoke test and the bundle budget pass

## 3. Wiki

- [x] 3.1 Update `docs/architecture.md` (Quick play: early wake-up, states, retry policy; build time plumbing for client and server; `/health` fields) and `docs/operations.md` (post-deploy check: the start screen shows "Herätetään palvelinta…", then enables Pelaa and shows client and server build times matching the deploys); verify links resolve
