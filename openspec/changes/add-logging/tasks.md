# Tasks

## 1. Server logging core

- [ ] 1.1 Add pino, pino-pretty, zod, express-rate-limit (+ types) to `@labyrinth/server`; verify `npm install` and `npm run typecheck` succeed
- [ ] 1.2 Create `server/src/logging/events.ts` event catalogue (server and client event unions) and `logger.ts` wrapper (`log.<level>(evt, fields?, msg?)`, label levels, no base, `ver` from `RENDER_GIT_COMMIT`/`dev`, `LOG_LEVEL`, dev transports to pino-pretty + `logs/dev.log`, dev-only trailing `time`); verify with Vitest capturing a destination stream: each entry is one JSON line, `level` and `evt` are the first two keys, a multi-line stack stays on one line, production output has no `time`

## 2. Room lifecycle and uncaught errors

- [ ] 2.1 Add `LoggedRoom` base class logging `room.created`, `room.disposed`, `player.joined/left/dropped/reconnected` and implementing `onUncaughtException`; make `GameRoom` extend it; verify with @colyseus/testing that join, leave, and drop + reconnect each produce the expected lines
- [ ] 2.2 Add human-id and set a readable room id in `LoggedRoom.onCreate` (lowercase words joined by hyphens, ≤32 chars, regenerate on collision with a running room); verify by test that a created room's id matches the pattern and equals `room` in its `room.created` line, and that a forced collision yields a different id
- [ ] 2.3 Pass a Colyseus `logger` adapter (`framework.log`) in `defineServer`, add process `uncaughtException`/`unhandledRejection` handlers and a `server.shutdown` log in `onBeforeShutdown`; verify with a test room whose clock timer throws that one `error` line with room id and stack is written and the server keeps serving

## 3. Command wrapper and rejection contract

- [ ] 3.1 Implement `CommandRejection(code, facts)` and `command(schema, handler)` returning `{ ok: true } | { ok: false, code }` and logging `cmd.accepted` / `cmd.rejected` / `cmd.failed`; verify with a test-only room and a client using `room.request()`: accepted, rule rejection (state unchanged, code returned), malformed payload → `INVALID_COMMAND`, throwing handler → `INTERNAL_ERROR` with the room still usable, exactly one audit line each

## 4. HTTP audit

- [ ] 4.1 Add Express middleware logging `http.request` (method, path, status, durMs; `/health` at debug); verify by test that a normal request yields one `info` line and `/health` yields a `debug` line
- [ ] 4.2 Check whether Colyseus matchmaking HTTP requests pass through the middleware; if not, audit them at the matchmaking hook; verify by test that joining a room via the SDK produces an `http.request` line for the matchmake call

## 5. Client log endpoint

- [ ] 5.1 Add `POST /client-logs` (text/plain JSON body, zod schema: ≤50 entries, msg ≤2000, stack ≤8000, known level, client evt catalogue), CORS via the allow-list configured in setup-infrastructure (Colyseus CORS hook), 30 req/min rate limit; each entry logged with `src: "client"`, client `ver`, `ts`; verify by tests: valid batch → 204 and one line per entry, oversized batch → 400 and no entries logged, 31st request in a minute → 429, no written line contains an IP address

## 6. Client logger

- [ ] 6.1 Add pino to `@labyrinth/client`; create `client/src/logging/` with pino browser logger, buffered transmit (flush every 5 s, immediately on error, on `visibilitychange: hidden`/`pagehide` with `keepalive`), 200-entry cap, key-event allow-list, `?debug=1` debug mode, `ver` from `VITE_APP_VERSION`/`dev`; verify with Vitest and mocked `fetch`: warn is shipped, plain info is not, key event is, debug mode ships debug, failed send retries and caps the buffer
- [ ] 6.2 Install `window` `error` and `unhandledrejection` listeners in `main.tsx` logging `client.error`; verify by unit test that dispatching an ErrorEvent ships a `client.error` entry with a stack

## 7. Crash screen

- [ ] 7.1 Add react-error-boundary (plus jsdom and @testing-library/react as dev dependencies) and a crash fallback with i18n keys `crash.title` / `crash.reload` in fi and en, logging `client.error` in `onError`; verify by component test that a throwing child renders the Finnish message and reload button and ships one `client.error`, and that the locales key-parity test still passes

## 8. Version and bundle budget in CI

- [ ] 8.1 Set `VITE_APP_VERSION` from the short `GITHUB_SHA` in `deploy-client.yml` (and in CI build); verify the built bundle contains the commit id
- [ ] 8.2 Add size-limit + @size-limit/file config (client `dist/assets/*.js`, gzip, 200 kB) and `npm run size` step in `ci.yml` after build; verify it passes at the current size and fails when the limit is temporarily set below it

## 9. Integration check

- [ ] 9.1 Run `npm run dev`, join a room from the Colyseus playground and open the client with `?debug=1` and a forced error; verify `logs/dev.log` contains server `player.joined`, an `http.request`, and a `src:"client"` `client.error` line, and the terminal shows them pretty-printed
- [ ] 9.2 Update `openspec/context/nfr.md` key-order wording to match the spec (`level`, `evt` first; no server timestamp in production); verify lint, typecheck, test, build and size all pass
- [ ] 9.3 Once the Render service exists, check Render's log retention on the free tier and that Render MCP can filter logs by text (`"room":"<id>"`) and time range; record retention in `openspec/context/nfr.md` and adjust the bug runbook in `.claude/CLAUDE.md` if the query shape differs
- [ ] 9.4 Update the wiki: `docs/operations.md` Logs section to Implemented (format, key order, event catalogue location, `/client-logs`, `?debug=1`, `logs/dev.log`), `docs/architecture.md` (command wrapper and rejection contract, readable room ids, LoggedRoom — Implemented), `docs/development.md` (reading dev logs); mark `add-logging` done in `openspec/context/roadmap.md`; verify every link in the touched pages resolves
