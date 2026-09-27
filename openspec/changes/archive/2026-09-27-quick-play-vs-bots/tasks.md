# Tasks

## 1. Protocol and server

- [x] 1.1 In `packages/protocol`: `JoinOptions.bots?: number` and `bots: z.int().min(1).max(3).optional()` in `joinOptionsSchema`; join code `INVALID_OPTIONS`. Verify with protocol schema tests (1 and 3 accepted; 0, 4 and 1.5 refused)
- [x] 1.2 In `GameRoom`: extract `startGame()` from the `start` command (deal, bot rngs, lock, metadata, `game.started`, first turn) and a `seatBot(seat)` helper from `addBot`; `onCreate` refuses non-nickname option failures with `INVALID_OPTIONS` (`room.refused { reason: "options" }`) and remembers `bots`; the creator's `onJoin` seats bots 2…n+1 and calls `startGame()` with `quick: true` in the log. Verify with room tests: *One against one* and *One against three* (seats, names, cards, phase, `game.started { quick: true }`), the room is private and locked, *Too many bots* creates no room, and the existing lobby/bot tests still pass

## 2. Client

- [x] 2.1 Connector `createBotGame({ nickname, bots })` (`create("game", { nickname, bots, private: true, pool })`) and `useGameSession.playBots(nickname, bots)` through `connect()` so `retry()` repeats it. Verify with a session test (connector called with the bot count; retry repeats it)
- [x] 2.2 Start screen group "Pikapeli botteja vastaan" with "1v1", "1v2", "1v3" (secondary, one row, ≥ 44 px, accessible names), disabled like Play and hidden for invite links; fi/en strings. Verify with one render test (disabled with an invalid nickname; tapping "1v2" calls `playBots(name, 2)`), the i18n parity test, and a UI check in portrait: tap "1v3" and land on the board with three bots playing

## 3. Docs and wrap-up

- [x] 3.1 Update `docs/architecture.md` (Game flow: quick bot games and the `bots` join option; `INVALID_OPTIONS`), `docs/operations.md` log list (`game.started.quick`, `room.refused` reason `options`) and mark `quick-play-vs-bots` done in `openspec/context/roadmap.md`. Verify by reading the changed sections against the code
- [x] 3.2 Run the check chain once (`npm run lint && npm run typecheck && npm test && npm run build && npm run size -w @labyrinth/client`) and commit. Verify it is green
