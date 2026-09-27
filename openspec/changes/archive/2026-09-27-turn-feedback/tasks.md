## 1. Last turn trace

- [x] 1.1 Pure helper `nextTrace(previous, view)` in `client/src/game/turnTrace.ts`: pushed-in tile and mover on a shift, route at the end of the move step, nothing for staying or a seat that left; unit tests cover shift, move, stay, next shift replacing, move step ending without a move
- [x] 1.2 `TurnTrace` board layer (pushed tile outline + dotted route with a start ring in the mover's colour, no pointer events) wired in `GameScreen`, hidden during the own preview; render test: outline and route shown

## 2. Reach in the shift preview

- [x] 2.1 `ReachMarks` layer: hollow hub rings for `reachableSquares(preview board, previewed own square)`, one accessible label with the count (fi + en), not tappable; wired only while previewing on the own turn; render test: marks shown and they are not buttons

## 3. Docs and check

- [x] 3.1 Update `docs/architecture.md` client section if it lists board overlays; mark roadmap item 13 done; full check chain; UI check with `/?dev=1v3` (bot turn trace, own preview reach)
