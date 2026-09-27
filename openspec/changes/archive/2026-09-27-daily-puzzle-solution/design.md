# Design

## Context

`fewestTurns` (daily-puzzle-par) searches shifts breadth-first with a board plus the set of squares
the pawn could stand on per node; it tells the depth per treasure but not the route. The hint
(`client/src/game/hint.ts`) asks the look-ahead bot for a shift step turn (`shiftHint`) and a
move step square (`moveHint`); GameScreen previews the hinted shift and rings the square.

## Decisions

1. **Route reconstruction in two stages.** `findShifts` runs the same set search toward one
   treasure and keeps each node's shift path; the first node whose reach covers the destination
   gives the shortest shift sequence. The walks are then chosen forward: after shift *i* the pawn
   walks to the first reachable square from which the remaining shifts still reach the destination
   (checked with the same set flood along the fixed shifts), and on the last shift to the
   destination's square. Exported: `bestLine(board, pawn, target, last, maxTurns)` → steps
   `{ insertion, rotation, to }`, and `bestMove(board, reach, target, last, maxTurns)` → square.
2. **Depth 2 for hints.** From the corner every treasure is within 2 turns; mid-puzzle the same
   is true in the boards tried. Depth 3 would take seconds on a phone, so beyond 2 the ordinary
   (bot) hint is used. The search runs when the player taps "Vihje" (~50–300 ms).
3. **Hint state per turn.** A solo player is always on turn, so the "hint stays on for the rest of
   the turn" state now also resets when the turn number changes (server games report no turn
   number, so nothing changes there).
4. **Replay is view state only.** `solutionFrames(date, name)` rebuilds the puzzle
   (`startDailyPuzzle`), takes `bestLine` from the start and turns it into frames: start, then per
   turn a shift frame (board after the shift, pawn carried, push marker) and a walk frame (pawn
   on `to`, route by `shortestPath`). GameScreen, on a finished puzzle with the replay open, draws
   the frame's board, pawn, marks and destination instead of the game, and `ReplayControls`
   replace the end row: "Paras reitti · vaihe n/N", a one-line description, Edellinen, Seuraava,
   Sulje. Nothing is sent to the room.
5. **Texts** (fi): "Näytä paras reitti", "Paras reitti · vaihe {{n}}/{{count}}", "Lähtötilanne",
   "Vuoro {{turn}}: työnnä", "Vuoro {{turn}}: kävele", "Edellinen", "Seuraava", "Sulje".

## Risks / Trade-offs

- The replay shows one best route; others may exist. Fine: "a" best route.
- Rebuilding the puzzle for the replay repeats the ~0.1 s search; only on tap.

## NFR

- Logging: none new (UI only).
- Tests: rules (`bestLine` from the puzzle start has `par` steps and ends on the destination;
  following it with the engine solves at par; `bestMove` from a move step picks a square that
  solves in one more turn); client (puzzle hint previews the best line's first shift; replay frames
  count and last square; a render test for opening and closing the replay).
- Performance: search only on tap; bundle unchanged apart from a small component.
