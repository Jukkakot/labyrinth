# Design

## Context

Starting point (commit `033aa38`): the server is a Colyseus 0.18 app (`server/src/app.config.ts`, one `GameRoom` with join/leave/drop/reconnect, `/health`) and logs only through Colyseus's own console output. The client is React 19 + Vite with i18next and no error handling. CI runs lint, typecheck, test and build. Motivation is in proposal.md; required behaviour is in `specs/observability` and `specs/performance-budget`.

Relevant Colyseus 0.18 facilities, confirmed from its type definitions:
- `defineServer({ logger })` accepts a custom logger for framework messages.
- `Room.onUncaughtException(error, methodName)` wraps message handlers, lifecycle hooks and clock timers.
- The client SDK has `room.request(type, payload)`, which resolves with the value the server handler returns.
- `Room.onBeforeShutdown()` and the server's `onBeforeShutdown` run during graceful shutdown.

## Goals / Non-Goals

**Goals:**
- A logging API that later changes use without further setup: `log.info("player.joined", { room, player })`.
- A command wrapper that every future room command goes through, so validation, audit and rejection are consistent by construction.
- All logs, client included, in the one Render stream; readable with Render MCP.

**Non-Goals:**
- Showing players a "server is updating" message on shutdown. The log line is written here; the UI message belongs to `turn-rules`, where the connection banners are built.
- UI messages for rejected commands (toasts). There are no commands yet; they arrive with `tile-shift`.
- Playwright E2E setup. No critical game path exists yet; it starts with `show-board`.
- Log retention or any external log service.

## Decisions

### 1. pino on both sides, with a thin event wrapper
The server uses pino and the client uses pino's browser build. The wrapper exposes `log.<level>(evt, fields?, msg?)` and builds the object `{ evt, room?, player?, ...fields }`.
- Key order: pino writes `level`, then the object's keys, then `msg`. To get `level, evt, …` first:
  - `formatters.level` emits the label (`"info"`), not the number.
  - `base` is disabled, which drops pid and hostname.
  - No pino child bindings are used. Context ids are merged into the object by the wrapper, so they come after `evt`.
- The `evt` parameter is typed as a union from `server/src/logging/events.ts`, which is the catalogue. A misspelled event name is a type error, which enforces the spec's "catalogue first".
- Alternative considered: a hand-written JSON writer. It would be smaller, but pino gives levels, transports, redaction and the browser build ready-made, per the "use established libraries" rule.

### 2. No server timestamp in production
Render stamps every line itself, and omitting the timestamp keeps lines short for human reading and for Render MCP output. In development the wrapper appends `time` as the last key, because `logs/dev.log` has no external timestamp. Client entries always carry `ts` (the client clock), because client time and log-arrival time differ.

### 3. Version identifier
`ver` is the short git commit:
- Server: from `RENDER_GIT_COMMIT` on Render.
- Client: from `VITE_APP_VERSION`, set by the deploy workflow from `GITHUB_SHA`.
- Local runs: `dev`.

Both sides deploy the same commit, so a mismatch between them is visible in the logs. The version handshake NFR (a later change) reuses the same identifier.

### 4. Development output
When `NODE_ENV` is not `production`, pino transports send entries to `pino-pretty` (terminal) and `pino/file` (`logs/dev.log`, `mkdir: true`). In production the output is plain stdout JSON with no worker threads. The level comes from `LOG_LEVEL`, with default `info` in production and `debug` in development.

### 5. Command wrapper and rejection contract
`command(schema, handler)` returns a Colyseus message handler. Commands are sent by the client with `room.request()`.
1. Validate the payload with `schema.safeParse`. On failure, return `INVALID_COMMAND`.
2. Run the handler. A handler signals a rule violation by throwing `CommandRejection(code, stateFacts)`, and it must throw before mutating state. Rules functions in `@labyrinth/rules` are pure, so validating first and applying second is the natural shape.
3. Log once: `cmd.accepted`, `cmd.rejected` (with `code`, `phase`, `turn` and the facts) or `cmd.failed` (with the stack).
4. Always return `{ ok: true }` or `{ ok: false, code }`. The wrapper never throws to Colyseus, so the client receives one uniform, typed result.

Payload schemas use zod.
- Why not rely on Colyseus's built-in Standard Schema validation: an invalid payload must produce the `INVALID_COMMAND` reply and the audit line, and custom validation inside the wrapper guarantees that.
- Alternative considered: separate `commandRejected` server messages. They would need correlation ids. `request()` already correlates replies.

### 6. Lifecycle and uncaught errors
- A `LoggedRoom` base class implements the lifecycle log lines (`room.created`, `room.disposed`, `player.joined/left/dropped/reconnected`) and `onUncaughtException`. `GameRoom` extends it.
- Process-level handlers log `process.uncaughtException` and `process.unhandledRejection`.
- The Colyseus `logger` option routes framework messages through the wrapper as `framework.log`, so no stray plain-text lines appear.
- Shutdown writes `server.shutdown`.

### 7. HTTP audit
Express middleware records the start time and logs `http.request` on `res.on("finish")`, with `/health` at `debug`. The implementation must confirm that Colyseus's matchmaking HTTP routes pass through the Express app. If they do not, those routes are audited at their Colyseus hook (see tasks).

### 8. Client log shipping
- **Endpoint:** `POST /client-logs`.
  - The body is JSON sent as `text/plain`, which avoids a CORS preflight and works with `fetch(..., { keepalive: true })` on page hide.
  - Validated with zod: at most 50 entries per batch, `msg` at most 2 000 characters, `stack` at most 8 000 characters, known level, and `evt` from the client part of the catalogue.
  - CORS comes from the allow-list set up in setup-infrastructure (Colyseus CORS hook), so no extra middleware.
  - `express-rate-limit` allows 30 requests per minute per IP. The IP is used only in memory; the limiter's key is never logged.
- **Client logger:** pino browser with `transmit.send` pushes entries into a buffer. The buffer is flushed every 5 s, immediately on `error`, and on `visibilitychange: hidden` / `pagehide`.
  - Levels shipped: `warn`+, plus the key events (logged at `info` with an allow-list).
  - With `?debug=1`, all levels are shipped.
  - A failed send keeps at most 200 buffered entries (oldest dropped) and retries on the next flush.
- **Global capture:** `window` `error` and `unhandledrejection` listeners, plus a `react-error-boundary` crash screen (i18n keys `crash.title`, `crash.reload`) whose `onError` logs `client.error`.

### 9. Readable room identifier
`LoggedRoom.onCreate` replaces `this.roomId` (Colyseus allows this only during `onCreate`) with an id generated by `human-id` (`separator: "-"`, `capitalize: false`, e.g. `brave-otters-sing`). It checks the running rooms with `matchMaker.query({ roomId })` and regenerates on collision. The same string is the log `room` field, the id a later change shows in the UI, and the invite-link id. There is no separate mapping table.
- Alternative considered: a short code like `K7M-Q2P`. It is shorter and language-neutral, but the user preferred words, which are easier to remember and say.
- Reported times are matched against Render's own line timestamps (the dashboard and Render MCP both filter by time range), so no timestamp is added to production lines (decision 2 stands).

### 10. Bundle budget
`size-limit` with `@size-limit/file` measures `client/dist/assets/*.js` (gzip) with a 200 kB limit. It runs as `npm run size -w @labyrinth/client` in CI after build. The current bundle is about 87 kB gzip.

## Risks / Trade-offs

- [pino transports use worker threads in development] → Production uses direct stdout, so there is no worker-thread risk on Render.
- [Render may not render JSON prettily] → Key order puts the meaning first. If reading in the dashboard turns out painful, add a small `npm run logs` formatter later. The format itself does not change.
- [Client can spam logs through a buggy loop] → Batch caps, buffer cap and server rate limit bound the volume.
- [Omitting server timestamps] → Render's timestamp is authoritative in production. Local lines keep `time`.
- [Colyseus logger interface is loosely typed (`any`)] → The adapter formats arbitrary arguments into `msg` and never throws.
