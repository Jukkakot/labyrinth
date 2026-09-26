# Tasks

## 1. Seeded randomness

- [x] 1.1 Add `pure-rand@^8` to `@labyrinth/rules`; create `src/rng.ts` with `createRng(seed)` (validates integer 0…2^32−1, exposes `int(min, max)`) and `shuffle(rng, items)` (Fisher–Yates); verify tests: same seed → same sequence, different seeds differ, invalid seeds (−1, 2^32, 1.5, NaN) rejected, fast-check: shuffle is a permutation

## 2. Tile set and fixed layout

- [x] 2.1 Create `src/tileSet.ts` with `TreasureId`/`TREASURES` (24 names), `TILE_SET` catalogue (ids 0–49 per design), `tileSpec(id)`, `treasureOf(id)`; verify spec scenarios "Tile counts" and "Treasure placement" (counts per kind, fixed/movable, 24 distinct treasures on the specified tiles, none on start corners or straights)
- [x] 2.2 Add `FIXED_LAYOUT` (kind + rotation per fixed square); verify spec scenarios "Start corners open inward", "Edge T-junctions closed toward the edge", "Inner T-junctions" by asserting openings

## 3. Board setup

- [x] 3.1 Create `src/setup.ts` with `setupBoard(seed)`; verify spec scenarios "Valid board" (fast-check over random seeds: valid, all 50 ids once, fixed tiles on fixed squares with their layout, spare is movable), "Reproducible" (seed 12345 twice), "Different seeds" (1 vs 2), "Invalid seed", "Same tiles every game" and "Fixed layout is the same every game"
- [x] 3.2 Add `boardToText(board)` to `@labyrinth/rules/testing` and a golden test pinning the text of `setupBoard(1)`; verify the golden text by eye against the spec's fixed layout diagram and record it in the test
- [x] 3.3 Export the new API from `src/index.ts`; verify typecheck, tests and `npm run build -w @labyrinth/rules` across workspaces, and the client bundle budget still passes

## 4. Wiki

- [x] 4.1 Update `docs/architecture.md` (tile catalogue and ids, treasures, fixed layout, seeded setup, `boardToText`) and mark `add-board-setup` done in `openspec/context/roadmap.md`; verify links resolve and documented ids match `TILE_SET`
