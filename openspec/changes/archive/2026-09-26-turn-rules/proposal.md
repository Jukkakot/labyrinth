# Proposal

## Why

Today one slow or vanished player stalls a game for everyone: a turn has no time limit, nobody can
remove an idle player, and a dropped connection holds its seat for only 60 s before the player
quietly disappears. Roadmap item 8 gives the game the original product rules for this: a 60 s turn
limit after which the other players may kick the slow player, a visible "disconnected" state, a
five-minute grace period for dropped players, and a winner when only one player is left.

## What Changes

- **Turn time limit (60 s)**: every turn gets a deadline that everyone sees counting down. Nothing
  happens automatically when it passes; the slow player may still finish their turn.
- **Kick**: once the current player's time is up, any other seated player may remove them with a
  new `kick` command (two-step confirm in the UI). The kicked player is taken back to the start
  screen with a short explanation.
- **Leaving removes the player**: leaving, being kicked or being removed after a long disconnect
  all remove the player with their pawn and treasure stack and free their seat; if it was their
  turn, the next player's turn starts.
- **Dropped connections**: a dropped player keeps their seat for 5 minutes (was 60 s) and is shown
  as disconnected to everyone. The turn limit and kick still apply to them. After 5 minutes they
  are removed automatically.
- **Last player standing wins**: when players leave a game that is under way and only one player
  is left, that player wins and the game finishes (it stays locked, as finished games already are).
- **Temporary rules until `lobby`**: the turn clock only runs while at least two players are
  seated, and "under way" means a shift has been made while at least two players were seated.
  `lobby` replaces both with the explicit game start.
- Not in this change: an in-game "leave" button (navigation comes with `lobby`), bots ending a
  game when the only human leaves (`bot-player`), turn notification sounds (`settings`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `turns`: current player on removal, turn time limit, kicking a slow player, last player
  standing wins.
- `game-session`: leaving removes the player with pawn and treasures; dropped connection keeps the
  seat for 5 minutes, is shown as disconnected, and ends in automatic removal; kicked player
  returns to the start screen with a message.
- `board-view`: turn countdown in the turn line, kick control for the other players, disconnected
  players marked in the progress strip, a notice when a player leaves the game.
- `observability`: log events for an expired turn and for a removed player (with the reason).

## Impact

- **rules** (`packages/rules`): turn-limit constants and pure turn helpers (next seat clockwise,
  kick check, last player standing).
- **protocol** (`packages/protocol`): `kick` command payload and schema, error codes
  `TURN_NOT_EXPIRED` and `NOT_KICKABLE`, a close code for "kicked".
- **server** (`server/src/rooms/GameRoom.ts`, `schema/GameState.ts`, logging catalogue): turn
  deadline and expiry flag in the synced state, turn clock, `kick` command, one removal path for
  leave / kick / timeout, 5-minute seat hold, last-player win.
- **client**: turn countdown, kick control, disconnected marker, "player left" notice, kicked
  message on the start screen, fi/en strings.
- Docs: `docs/architecture.md` (game flow, state sync, commands), roadmap item 8.
