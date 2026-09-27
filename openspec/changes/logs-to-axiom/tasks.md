# Tasks

## 1. Server

- [x] 1.1 Add `@axiomhq/pino` to the server; in `logger.ts` production with `AXIOM_TOKEN` and `AXIOM_DATASET` writes to stdout plus the Axiom transport and adds `time`; otherwise unchanged. The transport factory is injectable for tests. Verify with logger unit tests (configured → multistream with the transport target, dataset and token, and lines with `time`; not configured or development → as before)
- [x] 1.2 `GameRoom.logCtx()` adds `seat` for seated actors. Verify with a room test: a bot's `cmd.accepted` shift line has `seat` = 2, and the existing log tests pass

## 2. Config and docs

- [x] 2.1 `render.yaml`: `AXIOM_DATASET=labyrinth`, `AXIOM_TOKEN` with `sync: false`. `docs/operations.md`: Logs section (Axiom as the main store, Render as fallback), configuration table, ready APL queries, bug runbook starting from Axiom MCP, the one-time setup steps. Verify by reading against the code
- [x] 2.2 Run the check chain once and commit. Verify it is green
- [ ] 2.3 After the user's setup and a deploy: query Axiom for the lines of a new production game. Verify one query returns the game's server and client lines in order
