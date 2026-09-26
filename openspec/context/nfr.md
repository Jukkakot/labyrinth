# Non-functional requirements

Apply to every change. Designs and task lists must show how they are met.

## Budget and hosting
- 0 € forever: GitHub Pages (client), Render free tier (server). Accepted
  consequence: the server sleeps after ~15 min idle and every restart or deploy
  loses in-memory games.
- Scale target: tens of concurrent games on a single instance. No Redis, no
  horizontal scaling.

## Logging and audit
- All logs, server and client, end up in Render's log stream. No other log
  service.
- Format: one JSON object per line (pino). Fixed key order, most useful first:
  `level, evt, room, player, msg`, then event fields. `src` is `server` or
  `client`; `ver` is the app version.
- `evt` comes from a fixed catalogue (`room.created`, `player.joined`,
  `cmd.accepted`, `cmd.rejected`, `phase.changed`, `http.request`,
  `client.error`, `conn.lost`, …) so logs can be filtered by name.
- Audit: every inbound command and HTTP request logs exactly one line with
  outcome, error code and duration. A rejection also logs the relevant state
  (phase, whose turn, and the fact that caused the rejection).
- Errors are a single line with the stack in a field, never multi-line output.
- Client: warn/error, uncaught errors (global handlers + React error boundary)
  and key events (connection lost/restored, command rejected) are shipped to the
  server, which logs them with `src=client` and the client timestamp.
  `?debug=1` raises one client to debug level.
- Development: pretty-printed in the terminal and also written to
  `logs/dev.log` (git-ignored) so they can be read directly.
- Reading production logs: Render dashboard or Render MCP.
- Privacy: the nickname is the only personal data. Never log IP addresses.

## Testing (required in every change)
- Rules: unit tests; every spec scenario maps to at least one test.
- Server: room integration tests with @colyseus/testing.
- E2E: Playwright smoke tests at a mobile viewport in CI for critical paths
  (start game, shift, move), extended as those paths are built.

## Abuse protection
- Nickname 2–16 characters, trimmed, no control characters or whitespace-only.
- Per-connection rate limit on commands.
- Room limits: max open rooms per connection plus a global cap.

## Versioning
- The server reports its version on connect. On an incompatible client the UI
  shows "New version available, reload" instead of playing on a broken client.

## Browser support
- Current iOS Safari, Chrome/Android, Firefox and Edge, back about two years. No
  legacy polyfills.
