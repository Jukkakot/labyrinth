# Design

## Context

`daily-puzzle` built a solo game on the device (3 treasures and home, one attempt, no hint).
User feedback asks for one destination, a known best result, undo or restart, and the hint on.
Measured on the dev machine: from the start corner **every treasure is reachable within 2 turns**
on the five seeds tried (a 2-turn full search takes 35–75 ms, 3 turns 1.5–3 s).

## Goals / Non-Goals

**Goals:** a puzzle with a known best (par), undo, retry, best-of-day result, hint on.

**Non-Goals:** an optimal hint (the existing look-ahead hint is used as is), counting hints in the
score, puzzles needing 3+ turns (the search would be too slow on a phone), statistics or streaks.

## Decisions

1. **Solver = breadth-first over shifts only.** The pawn's move never changes the board, so a
   search node is a board plus the set of squares the pawn could stand on (union of the reach).
   Each turn expands every allowed insertion × distinct spare rotation (reverse push forbidden),
   carries the square set with the shift, floods the reach, and notes the first turn each treasure's
   tile is inside it. Depth 2: ≤ 48 + 48² boards. Lives in `dailySolver.ts` (`fewestTurns`).
2. **Choosing the destination.** `startDailyPuzzle(date)` runs the depth-2 search from the start
   corner, shuffles the treasures with the date's seed and takes the first whose best is 2 (else
   the first with the highest best found). The best is the puzzle's **par**. Deterministic, so
   every device computes the same puzzle; computed once at start and saved with the game.
3. **Winning on the treasure.** The stack holds just the destination card; `applyPuzzleMove`
   applies the normal move and, once the card is found, finishes the game with the current turn
   (no return home).
4. **Undo.** The local room keeps a history of game states taken before each shift (with the marks
   row then). "Peru" restores the last one: in the move step it takes back this turn's shift, at a
   turn start it takes back the whole previous turn. Disabled with an empty history. Saved with the
   game, so it survives a reload. A client-only `undo` command; the server never sees it.
5. **Try again and best of day.** "Uudelleen" (end screen) and the start screen's button after a
   solve start a fresh attempt of the same puzzle (new room id, same date). The record keeps
   `best` (fewest turns and its marks) across attempts; `par` is stored in the record too.
   Old-format records (with `result`) are ignored.
6. **Hint on.** The existing hint works in the puzzle unchanged (it plays toward the viewer's target).
7. **Turn line** in the puzzle: "Vuoro N · paras mahdollinen P" instead of "Sinun vuorosi – …";
   the controls below already say what to do. End: "Ratkaisit pulman N vuorossa (paras P)" or,
   when N = P, "… – paras mahdollinen! ⭐".
8. **Controls.** "Peru siirto" is an icon button (undo arrow) next to the rotate/hint buttons in
   both steps (disabled during a shift preview and with nothing to undo). The end: Alkuun and
   Uudelleen in a row, "Jaa tulos" (primary) full width under them: three in one row squeezed
   the share label onto two lines on a phone.
9. **Share text:** `… päivän pulma 27.9.2026`, `3 vuoroa (paras 2)` or `2 vuoroa (paras 2) ⭐`,
   marks row (⬜ per turn, 💎 on the solving turn), link.

## Risks / Trade-offs

- Par is almost always 2; the challenge is finding the 2-turn line. If that proves too easy, a
  later change can add a second destination or a start square away from the corner.
- The search runs on the main thread at puzzle start (~50–300 ms on a phone); acceptable once per
  attempt; the saved game stores par so a resume does not search again.
- Undo and hints make the score self-policed; fine for a casual shared result.

## NFR

- Logging: `client.daily.started` gains `par`; `client.daily.finished` has turns and par. No new events.
- Tests: rules (solver finds a known 1-turn and 2-turn case on a fixture board, puzzle determinism,
  par, finishing on the treasure); client (undo, retry keeps best, record, share text, screens).
- Performance: solver time asserted loosely in a rules test (depth 2 under 1 s); bundle size checked.
