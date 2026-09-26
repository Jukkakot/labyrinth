# Design

## Context

`packages/rules` currently exports only `RULES_VERSION`. It compiles with `module: nodenext`, so internal imports use `.js` extensions. Tests run with Vitest. Server and client consume the TypeScript source directly through the `source` export condition, so no build step is needed during development. Requirements are in `specs/board/spec.md`, and geometry conventions come from `docs/architecture.md` (Board geometry).

## Goals / Non-Goals

**Goals:**
- A small, pure, fully typed board model that later changes (`tile-shift`, `pawn-movement`, bots) extend without reshaping.
- Plain-data values that can go straight into logs, test fixtures and (later) Colyseus state.

**Non-Goals:**
- Tile distribution, shuffling, treasures and start markers on tiles.
- Shift and reachability operations.
- Any rendering concerns.

## Decisions

### 1. Plain readonly data plus pure functions, no classes
```ts
type Direction = "N" | "E" | "S" | "W";
type TileKind = "straight" | "corner" | "tee";
type Rotation = 0 | 90 | 180 | 270;
interface Tile { readonly id: number; readonly kind: TileKind; readonly rotation: Rotation }
interface Square { readonly row: number; readonly col: number }
interface Board { readonly squares: readonly Tile[] /* 49, row-major */; readonly spare: Tile }
```
- Functions such as `openings(tile)`, `rotate(tile, steps)`, `tileAt(board, sq)`, `neighbour(sq, dir)`, `isFixed(sq)`, `isConnected(board, a, b)`, `connectedNeighbours(board, sq)` and `createBoard(layout)` return new values and never mutate.
- Why: plain objects serialize to JSON unchanged, which satisfies the spec's round trip. They are trivial to log and to build in tests, and they carry no prototype that could be lost across Colyseus sync.
- Alternative considered: `Tile`/`Board` classes with methods. Methods read nicely, but serialization needs hydration code.

### 2. Openings are computed, not stored
A tile stores `kind` + `rotation`. `openings` looks up the kind's base set (straight `N,S`, corner `N,E`, tee `E,S,W`) and rotates each direction by `rotation/90` clockwise steps along the cycle `N→E→S→W`. A single source of truth means the stored rotation and the stored openings can never disagree. The base shapes read like the letters I, L and T.

### 3. Fixedness derives from position
`isFixed(sq)` is `row % 2 === 0 && col % 2 === 0`. The board does not store a fixed flag, because fixed tiles never move (shifting only moves odd rows and columns), so the square alone decides.

### 4. Row-major array with bounds-checked access
`squares[row * 7 + col]`. `square(row, col)` validates the 0–6 range and throws `RangeError` for invalid coordinates. `neighbour(sq, dir)` returns `undefined` beyond the edge rather than throwing, because walking off the edge is a normal query when computing connections.

### 5. Construction validates, everything else trusts
`createBoard(layout)` checks the square count (49), the presence of the spare tile, unique ids across all 50 tiles, valid kinds and valid rotations. It throws an `Error` naming the problem, for example the duplicate id. All other functions assume a valid board, which keeps them simple. The server only ever builds boards through `createBoard` (or later through setup, which calls it).

### 6. Board size as a named constant
`BOARD_SIZE = 7`, `FIXED` positions, and so on are exported. The rules are specific to 7×7, but tests and the renderer read the size from one place.

## Risks / Trade-offs

- [Kind name `tee` in code vs "T-junction" in the spec] → The spec describes behaviour. `tee` is a valid identifier, and a comment maps the two.
- [Throwing on invalid coordinates inside rules] → Only reachable through programmer error or unvalidated input. Commands are validated by the server wrapper (add-logging) before they reach rules, so a throw here surfaces as `INTERNAL_ERROR` with a stack, which is the right signal for a bug.
