# Design

## Context

`packages/rules` has the board model (`docs/architecture.md` → Board model):
- tiles are `{ id, kind, rotation }`;
- `createBoard()` validates a layout;
- fixedness comes from the square;
- the board keeps no treasures.

Requirements are in `specs/board-setup/spec.md`, and the tile counts come from `openspec/context/product.md`.

## Goals / Non-Goals

**Goals:**
- One static tile catalogue shared by server and client, so per-game data is only placement, rotation and seed.
- Deterministic setup from a 32-bit seed.
- A text rendering good enough to read a board in a failing test or a log.

**Non-Goals:**
- Card dealing, pawns, icons.
- Guaranteeing any path property of the random board (the original game guarantees none).

## Decisions

### 1. Static tile catalogue with fixed ids
`TILE_SET: readonly TileSpec[]` with `TileSpec = { id, kind, fixed, treasure? }`. Ids are assigned by catalogue order:

| Ids | Tiles | Treasures |
|---|---|---|
| 0–15 | fixed tiles, in row-major order of the fixed squares (0, 3, 12, 15 are the start corners) | on the 12 fixed T-junctions |
| 16–27 | movable straight tiles | none |
| 28–43 | movable corners | 28–33 carry treasures, 34–43 don't |
| 44–49 | movable T-junctions | all six |

Kind and treasure are functions of the id, identical in every game. The client can hold the catalogue statically, and the server only needs to send ids and rotations per square (State sync principle).
- Alternative considered: storing treasure on `Tile`. That would change the board spec and duplicate static data in every board.

### 2. Treasure identifiers
`TreasureId` is a union of 24 lowercase English names, chosen to map onto common line-icon sets:
- On fixed tiles, "objects": `crown`, `key`, `gem`, `coins`, `sword`, `shield`, `book`, `map`, `scroll`, `ring`, `lamp`, `chest`.
- On movable tiles, "creatures": `dragon`, `owl`, `bat`, `spider`, `beetle`, `mouse`, `lizard`, `moth`, `ghost`, `fairy`, `wizard`, `troll`.

These are our own names, not the original game's artwork or labels (NFR legal). Icons are chosen in `show-board`. `TREASURES` is the ordered list, and the order is part of the catalogue.

### 3. Fixed layout as data
`FIXED_LAYOUT: Record<fixedIndex, { kind, rotation }>` is written out explicitly from the spec diagram, not computed. The rotations follow from the base shapes:
- tee 0° closed N, 90° closed E, 180° closed S, 270° closed W;
- corner 0° N,E / 90° E,S / 180° S,W / 270° W,N.

So the start corners are (0,0) 90°, (0,6) 180°, (6,6) 270° and (6,0) 0°. Tests assert the openings named in the spec, not the rotation numbers, so the table can be checked against the spec's wording.

### 4. Seeded RNG with pure-rand
`createRng(seed)` wraps `xoroshiro128plus(seed)` from `pure-rand` and exposes `int(min, max)` (`uniformInt`, which advances the generator). The seed is validated as an integer in [0, 2^32 − 1]. A Fisher–Yates shuffle over the movable tile ids is followed by one rotation draw per tile, in id order after the shuffle.
- The exact draw sequence is part of the reproducibility contract, so a golden test pins the board for one seed. Changing the algorithm is a deliberate, visible change.
- Alternative considered: `Math.random` with a seedable shim, or hand-written mulberry32. `pure-rand` is established, typed and platform-independent.

### 5. `setupBoard(seed): Board`
1. Place the fixed tiles.
2. Shuffle the movable ids.
3. Fill the 33 movable squares in row-major order.
4. The last shuffled tile becomes the spare.
5. Assign rotations.
6. Return through `createBoard()`, so the result is validated like any other board.

`treasureOf(tileId)` and `tileSpec(tileId)` read the catalogue.

### 6. Text rendering (`@labyrinth/rules/testing`)
`boardToText(board)` draws each square as a box-drawing glyph of its openings (`│ ─ └ ┌ ┐ ┘ ├ ┤ ┬ ┴`) in a 7×7 grid plus the spare, with fixed squares marked. It is used in golden tests and pasted into bug reports.

## Risks / Trade-offs

- [The fixed layout comes from our reading of the original game; the inner T-junctions in particular] → The spec shows it as a diagram for the user to check against the physical game before implementation. The data table is the single place to fix it.
- [Golden test ties the implementation to one draw order] → Intended: reproducibility is a requirement. Any change to it must update the golden test consciously.
- [pure-rand major versions changed its API before] → Pinned to `^8`. The RNG sits behind `createRng`, so a swap touches one file and the golden test.

## Implementation notes

- The golden board of seed 1 was checked against the spec diagram: fixed squares read
  row 0 `┌ ┬ ┬ ┐`, row 2 `├ ├ ┬ ┤`, row 4 `├ ┴ ┤ ┤`, row 6 `└ ┴ ┴ ┘`; the user confirmed the
  inner four T-junctions against the physical game before implementation.
- Extra exports used by tests and later changes: `MOVABLE_TILE_IDS`, `fixedSquareOf(id)`,
  `FIXED_TILE_COUNT`, `TILE_COUNT`, `isValidSeed`, `MAX_SEED`, `tileGlyph`.
- Tree-shaking keeps the new rules code out of the client bundle until the client uses it
  (bundle unchanged at 90.9 kB gzip).
