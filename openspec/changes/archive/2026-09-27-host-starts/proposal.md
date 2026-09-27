# Proposal

## Why

A new player who taps "1v3" often sees the bots move first and wonders what is happening. The
person who starts a game should play at once, especially in their first game (decided by the
user, 2026-09-27).

## What Changes

- The host always has the first turn: in a waiting-room game the host who taps "Aloita peli", in
  a rematch the player who asked for it, and in a quick game against bots the player.
- A game without a seated host (bots only, watched by its creator) keeps the random first player.
- The deal itself stays drawn from the seed; only the choice of the first seat changes.

## Capabilities

### New Capabilities

### Modified Capabilities
- `turns`: "Current player" — the host starts instead of a random seat.
- `lobby`: "Starting the game" — the host gets the first turn.
- `bots`: "Quick game against bots" — the player starts.

## Impact

- Workspaces: **rules** (the engine's `startGame` takes the first seat), **server** (`GameRoom`
  start seat; test helper), **client** (local game passes the player's seat). Protocol: none.
- Logs: `game.started` / `client.local.started` keep `startSeat`, now the actual first seat.
