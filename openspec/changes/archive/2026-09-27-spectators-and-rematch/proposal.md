## Why

A game can only be played, never watched, and a finished game is a dead end: everyone goes back to
the start screen and has to find each other again. Roadmap item 12 adds spectators (including games
of bots only, to watch and to compare bot strategies by eye) and "Pelaa uudelleen", which keeps a
group together for the next game.

## What Changes

- **Watch a running game.** The start screen lists running public games under "Käynnissä olevat
  pelit"; tapping one joins it as a spectator. An invite link to a game that has already started
  makes the viewer a spectator instead of failing. A spectator sees the whole game, every player's
  current target included, and can do nothing but watch and leave.
- **Watch bots play.** A new start-screen group "Katso bottien peliä" with "2", "3" and "4" starts
  a private game of that many bots with the viewer as its spectator. While no person is seated,
  a spectator can switch the bots' speed between 1×, 2× and 4×.
- **Players see they are watched.** When a game has spectators, everyone sees an eye icon with
  their count in the top bar.
- **A watched game plays on.** A started game ends without a winner only when no person is seated
  **and** nobody is watching; so bots keep playing for spectators after the last person left, and
  a bot-only game ends when its last spectator leaves.
- **Rematch.** A finished game offers "Pelaa uudelleen": the first player to tap it gets a new
  waiting room with the same settings (public/private, the same bots in the same seats) as its
  host; everyone else who taps it joins that room. A rematch of a quick bot game starts at once,
  like the original. "Uusi peli" becomes "Alkuun" (back to the start screen). Spectators of a
  bot-only game get "Uusi bottipeli" instead.
- New command codes: `setSpeed` (spectator, bot-only game) and `rematch` (seated player, finished
  game), with rejections `NOT_SPECTATOR`, `PEOPLE_PLAYING` and `SERVER_FULL`; a new HTTP route
  for joining a started game as a spectator.

Workspaces: `packages/protocol` (codes, schemas, join options), `server` (spectators, watch route,
speed, rematch, end rule), `client` (start screen, spectator view, rematch). `packages/rules` is
not touched: no game rule changes.

## Capabilities

### New Capabilities
- `spectators`: watching running games and bot-only games, what a spectator sees and may do, bot
  speed, the spectator count shown to players.

### Modified Capabilities
- `bots`: "Game ends without people" becomes "ends when no person is seated and nobody watches".
- `board-view`: "Game result shown" gets "Pelaa uudelleen" and "Alkuun" instead of "Uusi peli".
- `game-session`: new requirement "Rematch".
- `observability`: spectators joining/leaving, speed changes and rematches are logged.

## Impact

- Server: `GameRoom` (spectator set, views, speed, rematch, end rule, `maxClients` after the start),
  `app.config.ts` (watch route), synced state (`spectators`, `botSpeed`, `rematchRoomId`), listing
  metadata (`watchable`).
- Protocol: join options `watch` and `speed`, `bots` 1–4, command and error codes.
- Client: `useGameSession` (watch, watch bots, rematch), view model (spectator), `useOpenGames`
  (running games), start screen, game screen (spectator panel, eye count, finished controls),
  i18n fi/en.
- No new dependencies; no cost.
