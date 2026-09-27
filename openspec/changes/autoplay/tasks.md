# Tasks

## 1. Protocol and rules

- [ ] 1.1 Protocol: `setAutoplay` payload type and `setAutoplayPayloadSchema` (`{ on: boolean }`, strict), `AUTOPLAYING` in `GAME_ERROR_CODES`; schema test
- [ ] 1.2 Rules: export `botMoveAfterShift(view, rng)` (wraps `lookaheadMove`) from the package entry; unit test that it returns a reachable square and walks onto a reachable target

## 2. Server

- [ ] 2.1 Synced `Player.autoplay` (public), room-private autoplay reasons, `isBotPlayed(seat)`; `setAutoplay` command (`NOT_SEATED`, `WRONG_PHASE`, idempotent), `autoplay.changed` log
- [ ] 2.2 Bot scheduling for auto-played seats: `setTurn` schedules them, turning on mid-turn schedules the current step (move step → `botMoveAfterShift`), turning off clears the timer, `playBotShift`/`playBotMove` re-check; autoplay actor with `bot: true`; `AUTOPLAYING` for the player's own shift/move
- [ ] 2.3 Drop → autoplay (reason `drop`) in a running game; reconnect ends only drop autoplay; rng for auto-played seats
- [ ] 2.4 Room tests (new `server/test/autoplay.test.ts`): rejections, idempotence, spectator, auto-played turn played, on mid-turn at shift and move, off before shift and before move, `AUTOPLAYING`, drop → played, reconnect ends drop autoplay, chosen autoplay survives reconnect, all people auto-played game goes on; fix existing tests that kick a dropped player if the bot now plays first

## 3. Client

- [ ] 3.1 `LocalRoom`: `setAutoplay` (daily → `WRONG_PHASE`), saved `autoplay`, `scheduleBot` treats the person's seat as bot-played (move-only choice when turned on after the shift), synced `autoplay`, own shift/move → `AUTOPLAYING`; tests incl. restore
- [ ] 3.2 Session and view model: `setAutoplay(on)` in `useGameSession`; `SeatView.autoplay`, `GameView.myAutoplay` / `canAutoplay`; view model test
- [ ] 3.3 UI: chip robot icon + accessible text, turn line wording, top-bar hand-over button, take-back panel in place of the controls; fi/en strings incl. `errors.AUTOPLAYING`; one render test for the take-back panel
- [ ] 3.4 UI check (mobile portrait, `/?dev=1v3`): hand over, bot plays own turn, take back mid-turn

## 4. Docs

- [ ] 4.1 Wiki: architecture (bots/autoplay paragraph, synced `autoplay`, command list), roadmap item 20 marked done
