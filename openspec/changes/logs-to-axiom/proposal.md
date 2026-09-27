# Proposal

## Why

All logs live only in Render's log view: short retention on the free plan, text search only, no
aggregation, no alerts. Investigating a reported bug means paging through lines by hand, and an
error at night goes unnoticed. The user already has an Axiom account (free tier, 30-day retention)
and Claude has an Axiom MCP server, so logs can become queryable (APL) at 0 €.

## What Changes

- The production server ships every log line (its own and the ones clients send it) to an Axiom
  dataset as well as to standard output, when `AXIOM_TOKEN` and `AXIOM_DATASET` are set. Without
  them nothing changes (local development, tests, a missing token).
- Shipped lines get a timestamp (`time`), so events are ordered by when they happened.
- Shipping never affects the game: it runs off the main thread in batches, and a failing or slow
  Axiom only loses log lines.
- Player-related server lines get the player's `seat`, so a game can be read by seat without
  mapping session ids.
- Runbook: ready APL queries (one game's timeline, errors of the last day, bot fallbacks, rejected
  commands by code) in `docs/operations.md`; bug investigation starts from Axiom.
- One-time setup by the user in Axiom and Render (dataset, ingest token, error alert), listed in
  the design.

Workspaces: **server** (logger destination, seat field), **docs**, `render.yaml`. No client, rules or
protocol change.

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- `observability`: a central log store requirement and the seat on player lines.

## Impact

- New dependency `@axiomhq/pino` (server, runtime) — the official pino transport.
- `render.yaml`: `AXIOM_DATASET` value and `AXIOM_TOKEN` as a dashboard secret (`sync: false`).
- 0 €: Axiom free tier (500 GB/month ingest; this game logs a few MB).
