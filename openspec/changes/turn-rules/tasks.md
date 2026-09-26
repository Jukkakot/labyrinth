# Tasks

## 1. Rules

- [ ] 1.1 Add `packages/rules/src/turns.ts`: `TURN_TIME_LIMIT_SECONDS = 60`, `DISCONNECT_LIMIT_SECONDS = 300`, `nextSeat(taken, from)` (clockwise, skipping empty seats, same seat when alone, 0 when nobody), `kickRejection({ kicker, target, turnSeat, expired, finished })` → `WRONG_PHASE` / `NOT_KICKABLE` / `TURN_NOT_EXPIRED` / undefined, `soleSurvivor(seats)`; export them; verify unit tests named after the `turns` scenarios (kick after the time is up, too early, turn already passed, kicking yourself, opponent kicked, two of three leave) and a fast-check property that `nextSeat` always returns a taken seat or 0

## 2. Protocol and server

- [ ] 2.1 Protocol: `kick` payload type and zod schema (`seat` 1–4), error codes `TURN_NOT_EXPIRED` and `NOT_KICKABLE`, `CLOSE_CODES.KICKED = 4100`; server log catalogue gets `turn.expired` and `player.removed`; verify protocol tests
- [ ] 2.2 Server state and clock: `turnDeadline` and `turnExpired` in the synced state; the clock starts with each turn while ≥ 2 are seated, starts when the second player sits down, stops when one is left, sets `turnExpired` and logs `turn.expired` on expiry; `passTurn` uses `nextSeat`; limits from instance fields tests can shorten; `turnExpired` added to command state facts; verify room tests for the `Turn time limit` scenarios (clock starts with the turn, late but allowed, alone in the game, second player arrives)
- [ ] 2.3 Server removal and kick: `removePlayer(sessionId, reason)` as the single removal path (`player.removed`, turn pass, last-player win with `game.finished { reason }`, `contested` flag set by a shift with ≥ 2 seated); `kick` command (rejections via `kickRejection`, connected target → removal + `client.leave(4100)`, dropped target → removal + rejected reconnection); seat hold 300 s; `onLeave`/`onDrop` idempotent; verify room tests for every `Kicking a slow player`, `Last player standing wins`, `Leaving the game`, `Dropped connection` and observability scenario, including the kicked client receiving close code 4100 and a disconnect timeout with a shortened limit

## 3. Client

- [ ] 3.1 View model and session: `turnDeadline`, `turnExpired`, `canKick` (seated, not the current player, expired, not finished), current player's `connected`; `kick(seat)` on `useGameSession` (pending + rejection notice like other commands); close code 4100 → `endReason: "kicked"` cleared by `play()`; verify view-model and session tests
- [ ] 3.2 UI: `TurnTimer` in `TurnLine` (m:ss, last 10 s emphasised with icon, "Aika loppui", disconnected current player text), `KickControl` with two-step confirm replacing the step controls, dimmed chip + `wifi-off` icon in `PlayerStrip`, departure `Notice`, kicked message on the start screen; fi/en strings; verify component tests for the `board-view` and `game-session` scenarios (countdown, time up, current player disconnected, disconnected player, offer after the time is up, confirm before kicking, not for the slow player, turn ends meanwhile, someone leaves, kicked) and locale parity
- [ ] 3.3 Visual check on Galaxy S24 with two tabs (light and dark), turn limit shortened only in the local dev server run: countdown, "Aika loppui", kick confirm, kicked start screen, disconnected chip; verify screenshots, the E2E smoke test and the bundle budget pass

## 4. Wiki and roadmap

- [ ] 4.1 Update `docs/architecture.md` (state sync: `turnDeadline`, `turnExpired`; rules API `turns.ts`; game flow: turn clock, `kick` command, removal path, 5-minute hold, last player standing, close code 4100; client components) and `docs/operations.md` if the log events are listed there, and mark `turn-rules` done in `openspec/context/roadmap.md` noting the temporary clock and "under way" rules for `lobby`; verify links resolve
