# Proposal

## Why

The board model can represent any layout, but a game needs the specific starting board of the original game: its tile set, the fixed tiles in their places, the treasures on their tiles, and a shuffled, randomly rotated set of movable tiles. The setup must also be reproducible from a seed, so any game and any bug can be recreated exactly.

## What Changes

- The original **tile set** of 50 tiles, identical in every game:
  - 16 fixed tiles: 4 start corners and 12 T-junctions.
  - 34 movable tiles: 12 straight, 16 corner and 6 T-junction.
- **24 treasures**, each on exactly one tile:
  - the 12 fixed T-junctions,
  - the 6 movable T-junctions,
  - 6 of the movable corners.
- The **fixed layout** of the original board: each fixed tile's square and rotation, with the start corners opening into the board.
- **Initial board from a seed:** the 34 movable tiles are shuffled onto the 33 movable squares plus the spare, each with a random rotation. The same seed always gives the same board.
- A readable **text rendering** of a board for tests and debugging.
- Workspaces touched: rules only. The server starts using it in `show-board`.

Out of scope:
- Dealing treasure cards to players and targets (`treasures-and-win`).
- Pawns and players (`show-board` / `pawn-movement`).
- Treasure artwork and icons (`show-board`).

## Capabilities

### New Capabilities
- `board-setup`: the tile set and its treasures, the fixed layout of the original board, and the seeded initial placement of the movable tiles.

### Modified Capabilities
<!-- none: the board spec already accepts any valid layout -->

## Impact

- **packages/rules**: new `tileSet`, `rng` and `setup` modules. New dependency `pure-rand` (seeded PRNG). Text renderer added to `@labyrinth/rules/testing`.
- Because tile kinds and treasures are fixed per tile id in every game, a game's static data is the same everywhere. Only positions and rotations change, which keeps the later state sync small (`docs/architecture.md` → State sync principle).
