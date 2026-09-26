# Proposal

## Why

Right now a game begins the moment one player sits down. Players have no names, there is no way to
find a particular game or invite friends, and the turn-rules change had to add temporary rules to
work around the missing start: the clock runs only with two or more seated, and a game counts as
"under way" once someone shifts with two seated. Roadmap item 9 adds the real front door: a
nickname, a list of open games, private games joined by invite link, and a waiting room where the
creator starts the game. It also removes those temporary rules and lets players leave a running
game on purpose.

## What Changes

- **Nickname**: the start screen asks for a nickname (2–16 characters, trimmed, no control
  characters). The browser remembers it only to prefill the field. The server rejects a join
  without a valid nickname. Every player sees the other players' nicknames instead of "Pelaaja N".
- **Start screen**: the nickname field, Play (quick play), "Luo yksityinen peli" and a live list of
  open public games (creator's nickname, players n/4). Tapping a game in the list joins it.
- **Private game and invite link**: a private game never appears in the list and quick play never
  puts anyone in it. It is joined only with its invite link (`…/?game=<game id>`). The waiting room
  offers "Kutsu pelaajia", which uses the phone's share sheet or copies the link. Opening the link
  shows the start screen in invite mode: the nickname field and "Liity peliin".
- **Waiting room**: a new phase before the game. It lists the seated players with their pawns and
  marks the creator (host). The host sees "Aloita peli", enabled once at least 2 players are
  seated. Everyone can leave. When the host leaves the waiting room, the game closes for everyone
  and the others are told why. Adding bots in the waiting room comes with `bot-player`.
- **Explicit start** (new `start` command, host only): the 24 treasure cards are dealt to the
  seated players (24/n each), a random seated player starts, and the turn clock begins. After the
  start nobody can join, and the game leaves the list.
- **BREAKING (temporary rules removed)**: the first player to sit down no longer starts. The treasure
  stacks are no longer dealt as four stacks of 6 when the game is created. The clock no longer
  depends on how many players are seated. "Under way" now means "started", so the last player
  standing always wins a started game.
- **Leave during a game**: a leave button in the game's top bar, confirmed first ("Poistutaanko
  pelistä?"). Leaving works like today's removal (pawn, treasures and seat go). The client returns
  to the start screen at once, without waiting for the server's reply. This makes leaving reliable
  through Render's proxy. A production check covers `room.leave()` through the proxy.
- **Game limit**: a global cap on open games. Creating a game beyond it is refused with a calm
  message.

Workspaces: **rules** (dealing for the seated seats and the seeded start seat), **protocol**
(nickname rule and join options, `start` command, new codes and close codes, the `waiting` phase), **server** (waiting
phase, host, start, the listing and its metadata, private rooms, the game cap), **client** (start
screen, game list, invite mode, waiting room, the leave button, nicknames in the UI), **e2e**
(the smoke test goes through the waiting room).

## Capabilities

### New Capabilities
- `lobby`: nickname, the start screen's game list, private games and invite links, the waiting room
  (host, start, leaving and host leaving), the game limit.

### Modified Capabilities
- `game-session`: quick play puts the player in a waiting room, not a running game, and needs a
  nickname. Seats are taken only before the start. Started games are closed to joining. Players can
  leave a running game with the leave button.
- `turns`: the current player is chosen at random when the game starts, and nobody has the turn in
  the waiting room. The clock always runs in a started game. The last player standing wins any
  started game. Game actions are refused before the start.
- `treasures`: the cards are dealt when the game starts, evenly among the seated players.
- `board-view`: players are named by their nicknames (turn line, progress strip, result, kick
  control, departures), and the top bar has a leave button.

## Impact

- `packages/rules`: `dealTreasures` is reused for n seats. New `dealGame(seed, seats)` returns the
  stack for each seated seat and the seeded start seat.
- `packages/protocol`: the nickname rule and join options schema (`nickname`, `pool?`, `private?`),
  join error codes `INVALID_NICKNAME` and `SERVER_FULL`, `start` command,
  codes `NOT_HOST` and `NOT_ENOUGH_PLAYERS`, close code `HOST_LEFT`, and the `waiting` phase.
- `server`: `GameRoom` (waiting phase, host seat, `start`, room metadata for the list, private
  rooms, no joining after the start, the room cap), `app.config.ts` (the built-in lobby listing
  room), and the synced state (`Player.name`, `hostSeat`). The temporary `contested` flag and the
  clock's player-count condition are removed.
- `client`: `useGameSession` (join by id and create private, a nickname in the join options,
  leaving locally first, the `HOST_LEFT` reason), a new game-list hook, `StartScreen` (nickname,
  list, invite mode), a new `WaitingRoomScreen`, and `GameScreen` (the leave button, nicknames).
  New i18n strings in Finnish and English.
- `e2e`: the smoke test uses two browser contexts: a nickname, Play, the waiting room, Start, and
  the board shown.
- Docs: `docs/architecture.md` (lobby, the waiting phase, the Planned lobby turned Implemented) and
  `docs/operations.md` (a production check for leaving through the proxy).
