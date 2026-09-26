# Proposal

## Why

Every later change (board, shifting, lobby, bots) will need to answer "what happened and why was this rejected?" in production, where the only access is Render's log stream. Setting up structured logging, command auditing and client error capture now, before any game logic exists, means each feature gets observability from its first commit instead of retrofitting it.

## What Changes

- Server writes one JSON object per line to stdout. It uses a fixed event catalogue (`evt`) and carries context ids (`room`, `player`), `src` and `ver` on each line.
- Every room gets a human-readable identifier (e.g. `brave-otters-sing`). It is used as `room` in the logs, and a later change shows it in the game UI, so a player can report "around 14:30 in game brave-otters-sing, X happened" and the matching log lines can be found directly.
- Every inbound HTTP request and every inbound room command is audited with exactly one line: outcome, error code and duration. A rejected command also records the state that caused the rejection.
- A shared command-handling convention: commands are schema-validated, and a rule violation is rejected with a stable error code that is returned to the sender and never changes state.
- Room lifecycle events (created, disposed, joined, left, dropped, reconnected) and uncaught server errors are logged as single lines.
- Client logs (warnings, errors, uncaught exceptions, key events) are batched and shipped to a new server endpoint. The server logs them with `src=client`, so all logs end up in the one Render stream. `?debug=1` raises one client to debug level.
- The client shows a localized "Something went wrong – reload" screen when it crashes.
- In development, logs are pretty-printed to the terminal and also written to `logs/dev.log`.
- CI enforces a 200 kB gzip JS budget for the client bundle.
- Workspaces touched: server and client. The rules package is not touched.

## Capabilities

### New Capabilities
- `observability`: structured log format, readable game identifier, event catalogue, audit of HTTP requests and room commands, command rejection contract, error capture, and client log shipping.
- `performance-budget`: client bundle size limit enforced in CI.

### Modified Capabilities
<!-- none: no specs exist yet -->

## Impact

- **server**: new logger module, HTTP audit middleware, `POST /client-logs` endpoint (CORS, rate limit, validation), command wrapper used by all future room commands, graceful-shutdown log. New dependencies: pino, pino-pretty (dev), zod, express-rate-limit, human-id.
- **client**: logger with batching and shipping, global error handlers, crash screen (fi/en strings). New dependencies: pino (browser build), react-error-boundary, size-limit.
- **CI**: new bundle size step. Version identifiers come from the git commit on Render and in GitHub Actions.
- No change to game behaviour, and no persistent storage.
