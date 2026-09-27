# Design

## Context

- Start screen (`client/src/screens/StartScreen.tsx`): Play, "Luo yksityinen peli", "Pikapeli
  botteja vastaan" 1v1–1v3 (device, `LocalRoom`), daily puzzle with `DailyShare`, "Katso bottien
  peliä" 2/3/4 (server: `createBotWatch` → `GameRoom` with `{ watch, bots, speed, private }`), the
  open and running lists.
- `LocalRoom` (`client/src/session/localRoom.ts`) runs quick games and the daily puzzle behind the
  `GameRoomLike` interface; the player is always seat 1 (`ME`), bots play with fixed delays, every
  step is saved in one quick-game slot (or the daily slot).
- The view model already treats a viewer without a seat as a spectator (`spectating`), computes
  `botOnly`, shows every target it receives, and `SpectatorControls` shows 1×/2×/4× for a
  spectator of a bot-only game. "Uusi bottipeli" calls `watchBots(name, seats, speed)`.
- Server bot speed (`setSpeed`, `PEOPLE_PLAYING`) also serves a public game whose people all left
  while spectators watch; that case stays.

## Goals / Non-Goals

**Goals:** three removals with no dead code, specs, i18n keys or wiki lines left; the watched bot
game on the device.

**Non-Goals:** changing the waiting room, invite links, running-games list, server spectators or
server bot speed; the other refinement items (found treasures, board marks, game link badge).

## Decisions

1. **Watched bot game runs on the device** (the roadmap's open question). It matches quick play:
   no wake-up wait, offline, no server load, and the switch's two sides behave the same. The server
   loses its only reason to create bot-only games. Alternative (keep it on the server) would keep
   `createBotWatch`, the private flag it needs and a wake-up wait behind a switch that otherwise
   starts at once.
2. **`LocalRoom.createWatch(bots, speed)`**: seats 1..n are bots (names as today), nobody is `ME`,
   so the existing view model sees a spectator; the synced state carries every seat's target (as
   the server does for a spectator) and `botSpeed`. The start seat is drawn at random, like the
   server's bot-only start. `setSpeed` is accepted in a watch game (`NOT_SPECTATOR` elsewhere
   stays) and divides both bot delays, like the server. `rematch` is rejected (`NOT_SEATED`): the
   screen's "Uusi bottipeli" starts a new watch game itself.
3. **Not saved**: a watch game never writes to the local game store, so it cannot overwrite a saved
   1v game, and it is not offered for resume; a reload lands on the start screen. Keeping it would
   need its own save slot for something the user only watches.
4. **"Uusi bottipeli" always starts a device game**, also after a server game whose people left
   (the same client call, `watchBots`, now local). No server path remains for it.
5. **Start screen section**: heading "Pikapeli bottien kanssa" / "Quick game with bots" (fits both
   sides of the switch), the switch "Pelaan itse" as a labelled `role="switch"` checkbox styled
   like the settings toggles (reuse the settings switch CSS, or lift the `Toggle` look into `ui/`
   if it cannot be reused without copying), then either 1v1/1v2/1v3 or "2 bottia"/"3 bottia"/
   "4 bottia" (accessible labels "Katso 2 botin peliä" …). The switch state lives in the start
   screen's React state only: on whenever the screen opens.
   Buttons of both sides are disabled only for an invalid nickname (no wake-up wait).
6. **Server pruning**: `joinOptionsSchema` loses `private`, `bots` and `speed`; `GameRoom` loses
   `watchBots`, `settings.private`, `setPrivate`, the `watch` create path and `game.started`'s
   `watch` field; rematch copies only `pool` and `botSeats`. `watch` stays in the options for a
   spectator's join through `/watch`, and creating with `watch` is still refused. An old cached
   client asking for a private game gets an ordinary listed game (unknown keys are stripped); an
   old bot-watch request is refused as `INVALID_OPTIONS` — acceptable, the PWA auto-updates.
7. **Daily puzzle**: `DailyShare` component and its CSS go; `DailyOver` keeps "Alkuun",
   "Uudelleen" and "Näytä paras reitti", with "Uudelleen" as the primary action. The per-turn
   `marks` (only used for the share text) go from the daily record, the saved game and
   `LocalRoom`; old saved records with `marks` still load (the field is just ignored). The "Näin
   pelaat" daily section's ⬜⬜💎 picture is replaced by a simple one without the share marks
   (e.g. the turn/par line).
8. **Removed i18n keys**: `start.createPrivate`, `start.watchBots`, `start.watchBotsLabel`,
   `daily.share`, `daily.shareTitle`, `daily.copied`, `daily.copyFailed`, and any other key that
   becomes unused (checked with a grep over `client/src` at the end). `share.ts` stays (the
   waiting room uses it).

## NFR (openspec/context/nfr.md)

- **Logging**: a watch game logs `client.local.started` with `watch: true` and its bot count, and
  `client.local.finished` like quick games; speed changes need no log line (no audit on the
  device, as for other local commands). Server `game.started` drops `watch`; `game.setup` drops
  `private`. Operations' log catalogue is updated.
- **Tests**: protocol schema (no `private`/`bots`/`speed`; `watch` create still refused), room tests
  (rematch without private, bot-watch creation refused; spectator/speed tests that created
  bot-only games rebuilt on a public game whose people left), `LocalRoom` (watch game: all bots,
  random start, all targets synced, speed scales delays, not saved, rematch rejected), session
  (`watchBots` goes local, no server call), a StartScreen render test for the switch. Removed
  features' tests are deleted with them. E2E smoke is unaffected (uses Play).
- **Limits**: fewer server rooms (no bot-watch rooms); the client bundle shrinks slightly; the size
  budget still runs.

## Risks / Trade-offs

- A watched game is lost on reload or when the phone kills the tab; acceptable for something only
  watched, and "Uusi bottipeli" is one tap away.
- Spectator tests on the server used bot-only games as the easy way to get a running game; they
  need a person who leaves first (or a direct room setup), so those tests get a bit longer.
- An old installed app until it updates: "Katso bottien peliä" fails with the generic join error.
