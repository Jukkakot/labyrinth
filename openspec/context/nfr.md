# Non-functional requirements

Apply to every change. Designs and task lists must show how they are met.

## Budget and hosting
- 0 € forever: GitHub Pages (client), Render free tier (server). Accepted
  consequence: the server sleeps after ~15 min idle and every restart or deploy
  loses in-memory games.
- Scale target: tens of concurrent games on a single instance. No Redis, no
  horizontal scaling.
- No keep-alive pinging; sleeping is accepted.
- Graceful shutdown: on SIGTERM (deploy/restart) the server tells connected
  players "Server is updating, the game ends" before closing.
- A finished game stays open while any human is in it (results, "Play
  again"), and closes when the last human leaves or after 10 minutes.

## Performance (mid-range phone a few years old)
- Usable within 3 s on 4G; JS bundle budget 200 kB gzip, checked in CI.
- Tile slide and pawn move at 60 fps; animate only transform and opacity.
- Every tap gives immediate feedback (pending state); target server response
  under 300 ms.

## Error UX
- Rejected command: short localized message ("You can't push back from the
  same spot").
- Connection lost: banner "Reconnecting…". Crash: "Something went wrong –
  reload" screen.
- Technical details go to the logs only, never to the UI.

## Logging and audit
- All logs, server and client, end up in Render's log stream. No other log
  service.
- Format: one JSON object per line (pino). `level` and `evt` always come first,
  then `room`, `player`, event fields, `src` (`server`/`client`), `ver` (short
  commit) and `msg` last. Server lines carry no timestamp in production (Render
  stamps each line); client entries carry their own `ts`.
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
- Reading production logs: Render dashboard or Render MCP (text and time-range filters
  verified; Render also indexes the JSON `level`). Retention on the free plan is not yet
  verified: the API accepts queries up to 30 days back; check the oldest available lines once
  the service is a week old (after 2026-10-03).
- Privacy: the nickname is the only personal data. Never log IP addresses.

## Testing (required in every change)
- Rules: unit tests; every spec scenario maps to at least one test, named after
  it. Invariants are also covered with fast-check property tests.
- Server: room integration tests with @colyseus/testing.
- E2E: Playwright smoke tests with the Galaxy S24 device profile in CI for critical paths
  (start game, shift, move), extended as those paths are built.
- Further testing practices (bot simulations, a11y checks, coverage limits,
  visual regression) are decided when there is something to test; visual
  regression is out for now.

## Abuse protection
- Nickname 2–16 characters, trimmed, no control characters or whitespace-only.
- Per-connection rate limit on commands.
- Room limits: max open rooms per connection plus a global cap.

## Versioning
- The server reports its version on connect. On an incompatible client the UI
  shows "New version available, reload" instead of playing on a broken client.

## Legal and privacy
- Never use Ravensburger names, logos or artwork in the UI or assets; own name
  ("Labyrintti"/"Labyrinth") and own icons only.
- No license: all rights reserved.
- No analytics, no cookies, no consent banner.

## Development workflow
- Commit directly to main; CI guards it and Render deploys only after green CI.
- No code formatter; oxlint only.
- Dependencies are updated manually (no Renovate/Dependabot).

## Browser support
- Chrome on Android is primary (reference device Galaxy S24); iOS Safari, Firefox
  and Edge must also work. Versions back about two years. No
  legacy polyfills.
