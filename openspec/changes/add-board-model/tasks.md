# Tasks

## 1. Directions, tiles and rotation

- [x] 1.1 Create `packages/rules/src/geometry.ts` with `Direction`, `BOARD_SIZE`, `Square`, `square(row, col)` (RangeError outside 0–6), `neighbour(sq, dir)` (undefined beyond edge), `opposite(dir)`, `rotateDirection(dir, steps)`; verify Vitest tests for the geometry scenarios (neighbour toward E, none beyond N edge, `(7,0)` rejected)
- [x] 1.2 Create `packages/rules/src/tile.ts` with `TileKind`, `Rotation`, `Tile`, `openings(tile)` (base I/L/T shapes rotated clockwise) and `rotate(tile, steps)`; add fast-check as a dev dependency; verify tests for every rotation scenario (corner 0→90 opens E,S; tee at 270 opens N,E,S; straight 0 = 180) and fast-check properties: four rotations are the identity for any tile, rotation preserves id, kind and number of openings

## 2. Board

- [x] 2.1 Create `packages/rules/src/board.ts` with `Board`, `createBoard(layout)` validating 49 squares + spare, unique ids, valid kinds/rotations, and `tileAt(board, sq)`; verify tests: valid layout places each tile, duplicate id rejected with the id in the message, 48 squares rejected, JSON round trip yields an equal board, 50 distinct ids on a valid board
- [x] 2.2 Add `isFixed(sq)`, `FIXED_SQUARES`, `START_CORNERS`; verify tests: `(2,4)` fixed, `(2,3)` movable, 16 fixed / 33 movable, corners fixed
- [x] 2.3 Add `isConnected(board, a, b)` and `connectedNeighbours(board, sq)`; verify tests: both open → connected, one side walled → not, open toward the edge → no connection, non-neighbours → not connected, connected neighbours equal the set satisfying the rule

## 3. Public API

- [x] 3.1 Export the board model from `packages/rules/src/index.ts` and add a test-fixture helper for building layouts from compact strings; verify `npm run typecheck` and `npm test` pass in all workspaces and `npm run build -w @labyrinth/rules` emits the new declarations

## 4. Wiki

- [x] 4.1 Update `docs/architecture.md` Board geometry to Implemented (module locations, plain-data model, tile ids) and the rules row in `docs/development.md` testing table; mark `add-board-model` done in `openspec/context/roadmap.md`; verify the documented conventions match the code and tests
