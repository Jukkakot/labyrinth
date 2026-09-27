# Proposal

## Why

Playing against bots now takes five taps: create a private game, add bots one by one, start. A
player who just wants a quick game alone should get one straight from the start screen, and a
sleeping-server start (up to a minute) already costs enough patience.

## What Changes

- The start screen gets a **"Pikapeli botteja vastaan"** group with three buttons, **1v1**, **1v2**
  and **1v3**: the player against 1, 2 or 3 bots.
- Tapping one creates a new game that is never listed, seats the bots in the next seats, deals
  and starts at once: the player goes straight to the board, with no waiting room. The start seat
  is drawn at random as in every game, so a bot may begin.
- The buttons follow the same rules as Play: disabled while the nickname is invalid or the server
  is still waking up, the same connecting state and join-error flow.
- From then on it is an ordinary bot game (spec `bots`): leaving ends it, a reload rejoins it.
- Logs: `game.started` records that it was a quick bot game; the bots get `bot.added` lines.

Workspaces: **protocol** (join option `bots`), **server** (creating and starting a quick bot game),
**client** (start screen buttons, session action, fi/en strings). No rules change.

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- `bots`: a new requirement for the quick game against bots from the start screen.

## Impact

- `packages/protocol`: `JoinOptions.bots` (1–3) and its schema.
- `server`: `GameRoom` reads `bots` on creation, makes the room private, seats the bots and starts
  when the creator joins; the start logic is shared with the host's `start` command.
- `client`: start screen group with three buttons, `useGameSession.playBots(nickname, bots)` and a
  connector method, fi/en strings.
- No new dependencies, no hosting or configuration change. Counts against the existing game cap.
