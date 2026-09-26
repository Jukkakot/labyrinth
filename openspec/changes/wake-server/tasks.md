# Tasks

## 1. Client

- [ ] 1.1 Add `client/src/session/serverWake.ts` (`startServerWake` singleton with injectable fetch/timers, 20 s attempt timeout, 2 s retry, 90 s deadline, `slow` after `SLOW_CONNECT_MS`, `useServerWake()` hook, one info/warn log line) and start it from `App`; verify unit tests: awake server → ready after one request, 503 then 200 → ready after two, never answers → failed at 90 s and no further requests, a second start reuses the first, missing server URL → failed at once
- [ ] 1.2 Pass the wake state to `StartScreen` (Play disabled + `start.waking` / `start.wakingSlow` status line while waking, `start.wakeFailed` note when failed) and add the fi/en strings; verify component tests for the "Sleeping server is woken on open", "Server wakes up" and "Server does not answer" scenarios, the existing start screen tests, and locale parity
- [ ] 1.3 Visual check on Galaxy S24 (light and dark): the waking state (e.g. with the server stopped) and the ready state; verify screenshots, the E2E smoke test and the bundle budget pass

## 2. Wiki

- [ ] 2.1 Update `docs/architecture.md` (Quick play: early wake-up, states, retry policy) and `docs/operations.md` (post-deploy check: the start screen shows "Herätetään palvelinta…" and then enables Pelaa); verify links resolve
