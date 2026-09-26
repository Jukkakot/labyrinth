# Tasks

## 1. Rules and protocol

- [x] 1.1 Add `dealGame(seed, seats) → { stacks, startSeat }` to `packages/rules/src/treasures.ts` (stacks to seats in ascending order, start seat from the same seeded RNG) and export it. Verify with unit tests named after the treasures deal scenarios (two players 12 each, three/four players, reproducible) and a fast-check property: for any 2–4 seat subset and seed, all 24 once, equal sizes, start seat among the seats
- [x] 1.2 Extend `kickRejection` with a `waiting` input (→ `WRONG_PHASE`) and verify with a rules unit test
- [x] 1.3 In `packages/protocol`: `nicknameSchema` (trim, 2–16 code points, no control characters), `joinOptionsSchema { nickname, pool?, private? }`, `startPayloadSchema` (empty strict object), `waiting` in `TURN_PHASES`, codes `NOT_HOST` and `NOT_ENOUGH_PLAYERS`, `JOIN_ERROR_CODES` (`INVALID_NICKNAME`, `SERVER_FULL`), `CLOSE_CODES.HOST_LEFT = 4101`. Verify with protocol unit tests for the nickname schema (valid, trimmed, too short/long, control characters, whitespace only) and `npm run typecheck`

## 2. Server: waiting room and start

- [x] 2.1 Add a `startedGame(n)` room-test helper (join n players with nicknames, host starts, with the start seat forced for determinism). Migrate every existing server test (game, shift, move, treasures, turnRules, lifecycle, errors) to it. Verify `npm test -w server` passes before any behaviour change is relied on
- [x] 2.2 Synced state: `Player.name`, `GameState.hostSeat`, phase default `waiting`. `onAuth` validates the join options with `joinOptionsSchema` and refuses with `INVALID_NICKNAME` (log `room.refused { reason: "nickname" }`). `onJoin` sets the name and the host (first joiner), and gives no turn, cards or target. `player.joined` logs `name`. Verify with room tests: the waiting phase has no current player or cards, the host is seat 1, an invalid nickname is refused without a seat
- [x] 2.3 The `start` command (checks `NOT_SEATED` → `NOT_HOST` → `WRONG_PHASE` → `NOT_ENOUGH_PLAYERS`; deal with `dealGame`, set cards and targets, lock, metadata `open: false`, `setTurn(startSeat)`, log `game.started`, drop `game.dealt` from the catalogue and from `onCreate`). Verify with room tests for each lobby "Starting the game" scenario, including joinById on a started room being refused
- [x] 2.4 Remove the temporary rules: `restartClock` applies in `shift`/`move` with a turn seat, `contested` goes, and `removePlayer` treats every non-waiting game as under way. Shift, move and kick in the waiting room return `WRONG_PHASE`. Verify with room tests for the modified turns scenarios (no clock in the waiting room, the clock starts with the game, the opponent leaves before anyone shifted → win, before the start → `WRONG_PHASE`)
- [x] 2.5 Waiting-room leaving: a guest's leave frees the seat (reused by the next joiner). When the host leaves, or a dropped host's hold runs out, `closeRoom("hostLeft")` runs (a `closing` flag so `onDrop` holds nothing, close code 4101 to the others, holds rejected, log `room.closed`). Verify with room tests: guest leaves, freed seat reused, host leaves → others closed with 4101, host hold expiry → closed

## 3. Server: listing, private games and the cap

- [x] 3.1 Register the built-in `LobbyRoom` as `lobby` in `app.config.ts`. Game rooms set metadata `{ host, open, pool }` (`pool` "" by default, `host` once the host has joined). Verify with a room test that the listing (matchMaker query) shows metadata `open: true` with the host's nickname before the start and `open: false` or locked after
- [x] 3.2 Private games: the `private` join option → `setPrivate(true)` in `onCreate`. Verify with room tests: quick play (`joinOrCreate`) skips a private waiting room with a free seat, and `joinById` joins it
- [x] 3.3 Game cap: `MAX_OPEN_GAMES = 100`, a static counter (increment after the check, decrement in `onDispose`), `ServerError(SERVER_FULL)` and `room.refused { reason: "cap" }`. Verify with a room test using a lowered cap: creating is refused, joining an existing game still works, and disposing frees a slot

## 4. Client: session, start screen and invite link

- [x] 4.1 `useGameSession`:
  - nickname in the join options; `play()` (joinOrCreate), `createPrivate()` and `joinById(id)`;
  - join errors mapped to `notOpen` / `serverFull` / generic;
  - the `hostLeft` end reason for close code 4101;
  - local-first `leave()` (idle at once, token cleared, listeners removed, then `room.leave()`);
  - a `start()` command through the pending `send`.

  Verify with session unit tests for each path, including that a late `onLeave` after `leave()` changes nothing
- [x] 4.2 The nickname store (`localStorage` `labyrinth.nickname`, try/catch) and the field with its hint, using `nicknameSchema`. Verify with unit tests: prefill, disabled actions and hint for an invalid name, saved after a successful join
- [x] 4.3 `useOpenGames(pool)`: join `lobby` with the name, `open` and `pool` filter once the wake-up is ready or failed. Keep the list from `rooms` / `+` / `-`, filter locked and full rooms, order oldest first, and leave on unmount. Verify with unit tests against a fake lobby room (appear, update to full, disappear)
- [x] 4.4 `StartScreen`: the nickname field, Play, "Luo yksityinen peli", the "Avoimet pelit" list (44 px rows "Maija · 2/4", empty text), and the kicked, host-left, not-open and server-full messages in the status line. Verify with screen tests for each lobby scenario on the start screen
- [x] 4.5 Invite mode:
  - `App` reads `?game=` once; a stored token wins;
  - the invite message, the nickname field, "Liity peliin" and "Muut pelit";
  - after the attempt, `replaceState` drops `game` and keeps `pool`.

  Verify with unit tests: joining by invite, a stale invite → not-open message and the normal start screen, and the URL cleaned
- [x] 4.6 Add the Finnish and English strings for all new texts. Verify with the existing locale-parity test

## 5. Client: waiting room, names and leaving the game

- [x] 5.1 `SeatView.name`, `GameView.phase` (`waiting`) and `hostSeat` in `viewModel`. `App` routes `waiting` to `WaitingRoomScreen`. Verify with view-model unit tests
- [x] 5.2 `WaitingRoomScreen`: four seat rows (pawn, name, "(sinä)" and "isäntä" badges, disconnected mark, "Vapaa paikka"), "Kutsu pelaajia" (`navigator.share` → clipboard fallback with "Linkki kopioitu"), host "Aloita peli" (disabled with the hint under 2 players, pending state), the guest waiting text, and "Poistu" (confirmed for the host when others are seated). Verify with screen tests for each lobby "Waiting room" and "Leaving the waiting room" scenario
- [x] 5.3 Nicknames in the game UI: the turn line, the strip chip (ellipsis, full name in the accessible text), the result, the kick control, departures (remember the seat → name of departed players), and the pawn labels. Verify by updating TurnLine, PlayerStrip, PawnLayer and GameScreen tests to the modified board-view scenarios, including four 16-character names fitting 360 px (CSS max-width plus an assertion that ellipsis is set)
- [x] 5.4 The leave action in the game top bar (a `door-exit` icon button, 44 px, "Poistu pelistä"). In a running game it shows a confirmation in place of the controls ("Poistutaanko pelistä? …", "Peru" / "Poistu"); in a finished game it leaves directly. Verify with GameScreen tests: confirm, cancel, and a finished game with no confirmation
- [x] 5.5 UI check with Playwright MCP `playwright-mobile` (Galaxy S24) against the local dev server, using two tabs: the start screen with the list, the waiting room as host and guest, start, the board with names, the leave confirmation, and host leaving. Also check landscape and a narrow desktop. Fix any clipping or tap-target issues found

## 6. E2E, docs and roadmap

- [x] 6.1 Update the E2E smoke test and its helpers: two browser contexts in one pool, both enter nicknames and tap Play, the host sees two players and taps "Aloita peli", and both see the board (49 tiles, fits 360×780). Verify with `npm run e2e` locally
- [x] 6.2 Run `npm run lint && npm run typecheck && npm test && npm run build && npm run size -w @labyrinth/client` and fix any failures
- [x] 6.3 Update `docs/architecture.md`:
  - the lobby, the waiting phase, host, start, the listing, private rooms, the cap and local-first leave move from Planned to Implemented;
  - remove the temporary "until lobby" notes;
  - update the state sync and command tables and the log event list.

  Update `docs/operations.md`: add a production check "leave through the Render proxy" (what to look for in the logs: `player.left` code 4000 vs `player.dropped` then `player.removed` timeout) and the new log events. Verify that the wiki links resolve
- [x] 6.4 Mark roadmap item 9 done in `openspec/context/roadmap.md` (note that bots in the waiting room come with `bot-player`), and list the production checks for the user in the summary
