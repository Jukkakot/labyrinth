# Tasks

## 1. Server and protocol: no private or bot-only games at creation

- [x] 1.1 `packages/protocol`: drop `private`, `bots` and `speed` from `JoinOptions` and `joinOptionsSchema` (and their refinements); keep `watch`, `botSeats`, `look`, `pool`. Update `game-schema.test.ts` (old keys refused, strict schema; `watch` alone still valid for a spectator join). Verify: `npm test -w @labyrinth/protocol`.
- [x] 1.2 `GameRoom`: remove `watchBots`, `settings.private`, `setPrivate`, the bot-watch start path and `watch` in `game.started`, `private` in `game.setup`; rematch copies only `pool` and `botSeats`; creating with `watch` still refused. Keep `setSpeed`/`PEOPLE_PLAYING` for games whose people left.
- [x] 1.3 Server tests: delete private and bot-watch creation tests (`lobby`, `rematch`); add "Too many bots"/bot-watch request refused; rebuild `spectators.test.ts` and `autoplay.test.ts` cases that created bot-only games on a game whose people left (or a direct room setup). Verify: `npm test -w server` (workspace name as in package.json).

## 2. Device: watched game of bots

- [x] 2.1 `LocalRoom.createWatch(bots, speed)`: bots in seats 1..n with the usual names, random start seat, no `ME` seat, all targets in the synced state, `botSpeed`; never saved to the local game store; `setSpeed` accepted (delays divided), `rematch` rejected `NOT_SEATED`; logs `client.local.started { watch: true, bots }` and `client.local.finished`. Tests in `localRoom.test.ts` named after the spectators scenarios (Watch three bots, Reload ends it, speed).
- [x] 2.2 `useGameSession`: `watchBots` starts `LocalRoom.createWatch` (no server, no wake-up wait); remove `createPrivate` and the connector's `createPrivate`/`createBotWatch`; `App.tsx` wiring. Session test: `watchBots` makes no server call and shows the game as a spectator.
- [x] 2.3 Check that the view model and `GameScreen` handle the device watch game unchanged (spectating, speed buttons, "Uusi bottipeli" with the same count and speed); fix only what breaks. Verify with the existing GameScreen tests plus one for "Uusi bottipeli" in a device watch game if not covered.

## 3. Start screen

- [x] 3.1 Remove "Luo yksityinen peli" and the "Katso bottien peliä" section; the bot section becomes "Pikapeli bottien kanssa" with the "Pelaan itse" switch (on at every open; styled like the settings switch, shared rather than copied), 1v1–1v3 when on, "2 bottia"–"4 bottia" when off; all disabled only for an invalid nickname. i18n fi/en. Render test: switch off shows the watch buttons and tapping "3 bottia" calls `watchBots` with 3; update `screens.test.tsx` for the removed actions.

## 4. Daily puzzle without share

- [x] 4.1 Remove `DailyShare` and its CSS, the share from the start screen entry and `DailyOver` ("Uudelleen" becomes the primary action); drop `marks`/`marksRow`/`turnMark` from the daily record, saved game and `LocalRoom` (old saved records still load); replace the ⬜⬜💎 picture in "Näin pelaat". Update `daily.test.tsx`, `daily.test.ts`, `localRoom.test.ts`. Verify: `npm test -w @labyrinth/client`.

## 5. Prune, docs and check

- [x] 5.1 Grep `client/src`, `server/src`, `packages` for leftovers (`createPrivate`, `createBotWatch`, `private`, `watchBots` server-side, `speed` option, removed i18n keys, `marks` of the daily); remove unused i18n keys from fi.json and en.json.
- [x] 5.2 Wiki: `docs/architecture.md` (joining options, private rooms, bot-only games now on the device, rematch), `docs/operations.md` (`game.started` without `watch`, `client.local.started` `watch`), `openspec/context/product.md` (lobby line), roadmap item 1 of refinement round 1 marked done. Main spec Purposes of `lobby` and `spectators` updated in `openspec/specs/` (they mention private games / bot-only games on the server).
- [x] 5.3 UI check on `playwright-mobile` portrait: start screen (switch on/off), a watched 3-bot game at 4× to the end and "Uusi bottipeli", daily end without share. Then the check chain once and commit, push.
