# Proposal

## Why

Right now a game needs at least two people. Bots let one person play solo, fill empty seats in a
small game, and let us test long games without four phones. The lobby left a gap for this: the
waiting room has free seats that only people can fill.

## What Changes

- The host can **add a bot** to any free seat in the waiting room and **remove** it again. A bot
  counts as a seated player: the host alone plus one bot can start a game.
- Bots have a fixed, language-neutral name (Robo, Pixel, Byte, Nova) and are marked as bots
  (robot icon) wherever players are listed.
- **Bots play their turn** on their own: after a short delay so people can follow, they shift, and
  after another short delay they move. They follow the same rules and go through the same command
  checks and audit as people. There is one difficulty level: reach the target this turn if any
  shift allows it, otherwise get as close as possible.
- **A bot always finishes its turn.** If its chosen action were somehow rejected, it falls back to
  a legal one (a shift that is allowed, then staying).
- **A game ends when no person is left in it.** Bots never keep a game alive alone. While at least
  one person remains, the game goes on, and the last player standing (person or bot) wins as before.
- Bots never kick and are never disconnected. People can still kick a bot whose turn time is up
  (it never should be).
- New log lines for adding and removing bots. Bot commands are audited like anyone else's, marked
  as bot commands.

Workspaces: **rules** (the bot's turn choice as a pure function), **protocol** (new commands,
codes, bot flag), **server** (bot seats, bot turns, game end without people), **client** (waiting
room bot controls, bot marks).

## Capabilities

### New Capabilities
- `bots`: bot seats (adding, removing, names), how a bot plays its turn (timing, choice,
  always finishing), and the game ending when no person is left.

### Modified Capabilities
- `lobby`: the waiting room gains the host's add/remove bot controls and bot marks; starting counts
  bots as seated players.
- `observability`: bot seat changes and bot commands are logged.

## Impact

- `packages/rules`: new `bot` module (turn choice, deterministic with a seed) and a whole-game bot
  simulation test.
- `packages/protocol`: `addBot` / `removeBot` payloads and schemas, codes `SEAT_TAKEN`,
  `NOT_A_BOT`, the synced bot flag.
- `server`: `GameRoom` seats bots without a connection, drives their turns with timers, and ends
  the game when the last person leaves; the command wrapper accepts a bot actor instead of a
  connection.
- `client`: view model `isBot`, waiting room controls, robot icon in the waiting room and the
  player strip, fi/en strings.
- No new dependencies. No change to hosting or configuration.
