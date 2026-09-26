# Proposal

## Why

Every game rule (shifting, pawn movement, reachability, bots) operates on the board, and none of them can be specified or tested until the board itself has a precise, shared definition. This change sets down that foundation: squares, tiles, openings, rotation and connections. It is written as pure logic, so the server and the client use the same definition.

## What Changes

- A 7×7 board addressed by `(row, col)`, plus one spare tile outside the board, for 50 tiles in total, each with a unique id.
- Three tile kinds (straight, corner, T-junction) with defined openings, and clockwise rotation in 90° steps.
- Fixed and movable squares: the 16 squares where both row and column are even hold fixed tiles; every other square holds a movable tile.
- Path connection between adjacent squares: two neighbouring squares are connected only when both tiles are open towards each other. The board edge is never a connection.
- Constructing a board from an explicit layout, which rejects invalid layouts.
- Workspaces touched: rules only. The server and client do not use the model yet; `show-board` wires it in.

Out of scope, each in its own later change:
- The original tile distribution and shuffling (`add-board-setup`).
- Treasures on tiles (`add-board-setup` / `treasures-and-win`).
- Shifting lines (`tile-shift`).
- Reachability and pawn movement (`pawn-movement`).

## Capabilities

### New Capabilities
- `board`: board geometry, tile kinds, openings, rotation, fixed/movable squares, connections between squares, and board construction.

### Modified Capabilities
<!-- none -->

## Impact

- **packages/rules**: new board and tile modules, exported from `@labyrinth/rules`, with Vitest tests. No new dependencies.
- **server / client**: no changes.
