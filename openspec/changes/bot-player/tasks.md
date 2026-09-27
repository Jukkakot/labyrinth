# Tasks

## 1. Rules and protocol

- [ ] 1.1 Add `packages/rules/src/bot.ts` with the `BotStrategy` / `BotView` / `BotTurn` types and the first strategy `chooseBotTurn(view, rng) → { insertion, rotation, to }` (design decision 5; `BotView` has no other players' targets) and a seed-mixing helper for per-bot rngs; export it. Verify with rules unit tests named after the *Bot turn choice* scenarios (target reachable, out of reach → closest, never the reverse, heading home) and a fast-check property: the chosen shift is never the reverse and `to` is reachable after the shift
- [ ] 1.2 Add a bot simulation test in rules: 2-, 3- and 4-bot games (`setupBoard`, `dealGame`, `shiftBoard`, `settleMove`, `nextSeat`) over at least 20 seeds each end with a winner within a turn cap; the strategy is a parameter. Verify it passes and runs under a few seconds
- [ ] 1.3 In `packages/protocol`: `addBot` / `removeBot` payload types and strict schemas (`{ seat: 1–4 }`), codes `SEAT_TAKEN` and `NOT_A_BOT`, the bot names list, and the server log events `bot.added`, `bot.removed`, `bot.fallback`. Verify with protocol schema tests and `npm run typecheck`

## 2. Server: bot seats in the waiting room

- [ ] 2.1 Change the command wrapper to take an `Actor { sessionId; bot? }` instead of `Client`; bot actors add `bot: true` to the audit line. Verify the existing command tests still pass and a new command test shows `bot: true` on a bot actor's line
- [ ] 2.2 Synced `Player.bot`; `addBot` / `removeBot` commands (checks in spec order, first free name, `bot:<seat>` key, start corner, logs `bot.added` / `bot.removed`), pending-reservation rule for `SEAT_TAKEN`, `maxClients` / lock updates and metadata `seated` (also updated on joins and leaves). Verify with room tests for each *Adding and removing bots* scenario, a pending join vs. add-bot race, and a listing test: count includes bots, a game filled with bots is locked and unlisted, removing a bot lists it again
- [ ] 2.3 Start with bots: the existing `start` counts bots, deals them stacks and targets, and a bot's target never reaches a client view. Verify with room tests for *Host starts against bots* and a decode test that no client state holds a bot's target

## 3. Server: bot turns and game end

- [ ] 3.1 Bot turn driver (design decision 6): the room builds each bot's `BotView` and calls an injectable strategy; per-bot rng from the deal seed, `botTimer` scheduled from `setTurn` and after an accepted bot shift, cleared on turn change, finish, removal and dispose; `botShiftDelayMs` / `botMoveDelayMs` shortened in tests. Verify with room tests: a bot that gets the turn shifts and moves on its own (audit lines with `bot: true`), a bot as the start seat plays first, and a game of the host plus a bot advances turns without the bot stalling
- [ ] 3.2 Fallback: a rejected bot command logs `bot.fallback` and the bot makes an allowed shift and stays. Verify with a room test that forces a bad choice (injected chooser) and sees the turn pass
- [ ] 3.3 Game end without people: `removePlayer` finishes with no winner and reason `noPeople` when no person is left; otherwise the last player standing (bots count) wins or the game goes on. Verify with room tests for each *Game ends without people* scenario and the `game.finished { reason: "noPeople" }` log line

## 4. Client

- [ ] 4.1 View model `SeatView.isBot`; `useOpenGames` shows `metadata.seated` (fallback `clients`) and hides games with 4 seated; session `addBot(seat)` / `removeBot(seat)` through the pending `send`. Verify with view-model, open-games and session unit tests
- [ ] 4.2 Waiting room: "Lisää botti" in free seats and "Poista botti" icon button on bots for the host only (≥ 44 px, pending state), robot icon and "Botti" badge for bots; robot icon in the game's player strip; fi/en strings incl. `errors.SEAT_TAKEN` / `errors.NOT_A_BOT`. Verify with one waiting-room render test (host sees the controls and tapping calls the session; a guest sees neither), the i18n parity test, and a UI check in portrait: host adds a bot, starts, and the bot plays a turn

## 5. Docs and wrap-up

- [ ] 5.1 Update `docs/architecture.md` (bots Planned → Implemented in Game flow, the actor in the command contract, `Player.bot` and metadata `seated` in State sync, `bot` in the rules package) and the log event list in `docs/operations.md` if it names events; mark `bot-player` done in `openspec/context/roadmap.md`. Verify by reading the changed sections against the code
- [ ] 5.2 Run the check chain once (`npm run lint && npm run typecheck && npm test && npm run build && npm run size -w @labyrinth/client`) and commit. Verify it is green
