# Design

## Context

- `server/src/logging/logger.ts`: pino, one JSON line per event; production writes to stdout
  without timestamps (Render stamps lines), development to a pretty console plus `logs/dev.log`,
  tests to an injected destination. Client entries arrive through `POST /client-logs` and are
  written by `log.client()`, so they share the destination.
- Render free plan: logs only in the dashboard/MCP, text filters, short retention. Render log
  streams need a syslog receiver, which Axiom does not offer directly.
- Axiom: the user's account (free, 30-day retention) already hosts another project's dataset; the
  Axiom MCP can query but not create datasets or tokens.

## Decisions

### 1. Ship from the server with the official pino transport
In production, when `AXIOM_TOKEN` and `AXIOM_DATASET` are set, the destination becomes
`pino.multistream([stdout, pino.transport({ target: "@axiomhq/pino", options: { dataset, token } })])`.
The transport runs in a worker thread and batches HTTP requests, so the event loop never waits on
Axiom; errors stay inside the worker. Stdout stays, so Render's view keeps working as a fallback.
Pino ends the transport on exit, flushing the last batch.
*Alternative:* Render log stream → syslog → Axiom. Rejected: needs an extra relay service and
possibly a paid plan.

### 2. Timestamp when shipping
Shipped lines carry `time` (ISO), which the transport maps to Axiom's `_time`. Stdout gets the same
field then (one duplicate timestamp in Render's view; harmless). Without shipping, production stays
as today.

### 3. Production only, one dataset
Development never ships, even with the variables set, so the dataset holds only real games. The
dataset is `labyrinth` (`AXIOM_DATASET` in `render.yaml`); the token is a dashboard secret
(`sync: false`).

### 4. Seat on player lines
`GameRoom.logCtx()` adds `seat` when the actor (person or bot) is seated. Lines that already pass
`seat` explicitly (removals) keep theirs.

### 5. Runbook with APL
`docs/operations.md` → Logs and "Investigating a reported bug" get ready queries, e.g.
`['labyrinth'] | where room == "brave-otters-sing" | sort by _time asc`. Claude uses the Axiom MCP
(`queryApl`) for bug reports and falls back to Render MCP when Axiom has no data.

### One-time setup (user, in the services' web UIs — Claude cannot do these)
1. Axiom → Datasets → New dataset `labyrinth`.
2. Axiom → Settings → API tokens → new token with **ingest** permission for `labyrinth` only.
3. Render → `labyrinth-server` → Environment → add `AXIOM_TOKEN` = that token (redeploys).
4. Recommended: Axiom → Monitors → a threshold monitor `['labyrinth'] | where level == "error"`,
   count > 0 per 5 min → email. Catches crashes, `bot.fallback` and client errors.

### NFRs
- **Logging:** this is the logging change; the event catalogue is unchanged.
- **Tests:** a logger unit test that production with both variables builds the multistream with
  the transport target and `time`, and without them writes as before (destination inspection via
  an injectable transport factory, no network); a room test for `seat` on a bot's `cmd.accepted`.
  After the setup, a production check: an Axiom query returns the lines of a new game.
- **Limits:** batching keeps request count low; volume is far below the free tier.
- **Privacy:** unchanged fields (no IPs, no personal data besides nicknames already logged).

## Risks / Trade-offs

- [Token leaks] → ingest-only token scoped to one dataset; kept only in Render's dashboard.
- [Transport cannot load in the worker (module resolution)] → covered by the production check; the
  stdout fallback keeps logs meanwhile.
- [Lines lost when the process is killed hard] → accepted; Render's stdout still has them.

## Migration Plan

Deploy; logs start flowing once the user has set `AXIOM_TOKEN`. Rollback: remove the variable.
