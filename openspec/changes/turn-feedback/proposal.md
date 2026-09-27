## Why

An opponent's or bot's turn is over in a second: a row slides and a pawn walks, and the player
cannot tell afterwards what happened. And while previewing a shift, the player has to imagine
where they could walk after it. Roadmap item 13 (single player vs bots first).

## What Changes

- After each shift, the tile that was pushed in stays marked in the mover's colour until the next
  shift, so it is clear which line moved.
- After each move, the pawn's walked route (from square to end square) stays drawn on the board
  in the mover's colour until the next shift. Staying put draws nothing.
- While a shift is previewed (arrow tapped, not yet confirmed), the squares the player could reach
  after that shift are marked (not tappable), computed in the client with the shared rules.
- No event log (decided: nobody reads it).

Workspaces: **client** only (uses existing `packages/rules` functions; no server or protocol change).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `board-view`: new requirements "Last turn shown" and "Reach shown in the shift preview".

## Impact

`client/src/game` (board marks, a pure trace helper), `client/src/screens/GameScreen.tsx`
(wiring), i18n strings, `docs/architecture.md` (client section) if it lists board overlays.
