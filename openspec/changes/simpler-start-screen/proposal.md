# Proposal

## Why

The start screen offers seven ways in (Play, a private game, three bot games, the daily puzzle
with its share, four bot counts to watch, two lists). Refinement round 1 trims it to what a single
player actually uses: fewer choices, one clear bot section, and no paths nobody reaches any more.

## What Changes

- **Remove "Luo yksityinen peli".** Nothing creates private games any more: the client action, the
  server's `private` join option, private rooms and "private stays private" in the rematch go.
  Friends still join through the waiting room's invite link ("Kutsu pelaajia"), which works for
  every (public) game as today.
- **Merge "Katso bottien peliä" into the bot quick play.** The section gets a "Pelaan itse"
  switch, on by default. On: "1v1", "1v2", "1v3" as today. Off: "2 bottia", "3 bottia",
  "4 bottia" start a game of bots only that the player watches, with the speed choice (1×/2×/4×)
  in the game as today.
- **Watched bot games run on the device**, like quick play: no server wake-up, works offline, never
  listed. "Uusi bottipeli" after it starts another one on the device. It is not saved: leaving or
  reloading ends it.
- **The server no longer creates bot-only games** (`watch` + `bots` + `speed` create options are
  removed; **BREAKING** for old clients, which only matters for a stale cached app, handled by the
  existing auto-update). Watching running public games and bot speed for spectators when every
  person has left stay on the server.
- **Remove "Jaa tulos" from the daily puzzle** (start screen and puzzle end), with the result text,
  the per-turn marks it was built from, and the ⬜⬜💎 picture in "Näin pelaat".
- Prune the specs, i18n keys, code, tests and wiki of everything removed.

Workspaces: **client** (start screen, session, device game engine, game screen, daily puzzle,
how-to-play, i18n), **server** (join options, room creation, rematch), **packages/protocol**
(join options schema). No change in `packages/rules`.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `lobby`: no "Luo yksityinen peli" and no private games; the invite link requirement stays for
  every game.
- `bots`: the quick bot game section gets the "Pelaan itse" switch; the server refuses any bot
  count at creation.
- `spectators`: a game of bots to watch starts from the switch and runs on the device; private
  games are gone from the listing rules.
- `game-session`: rematch no longer keeps a private flag.
- `daily-puzzle`: the shareable result and the share actions are removed.

## Impact

- Client: `StartScreen`, `useGameSession` (connector `createPrivate`/`createBotWatch` removed,
  `watchBots` goes to the device), `LocalRoom` (spectated bot-only game, speed), `GameScreen`
  ("Uusi bottipeli"), `DailyShare` (only the end controls remain), `dailyRecord` (marks),
  `HowToPlay`, fi/en locales, tests.
- Server: `GameRoom.onCreate` (no private/watch-bots), rematch settings, tests
  (`lobby`, `rematch`, spectator tests that create bot-only games).
- Protocol: `joinOptionsSchema` without `private`, `bots`, `speed`.
- Docs: architecture (joining, spectators, rematch), operations (`game.started` `watch`), product
  context (lobby line), roadmap.
