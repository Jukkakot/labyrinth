# Proposal

## Why

User feedback on the first daily puzzle (2026-09-27): a puzzle should be one destination reached in
as few turns as possible, the puzzle should tell the best possible result, a mistake should be
undoable (or the puzzle restartable), and the hint may stay on. Today it is 3 treasures and home,
one attempt, no hint, no best result.

## What Changes

- **One destination:** the puzzle is to reach one treasure; the game ends as soon as the pawn stops
  on its tile. **BREAKING** for the stored daily result shape (old records are simply ignored).
- **Best possible result ("par"):** the rules search every shift and rotation to find the fewest
  turns to each treasure; the day's treasure is one whose best is 2 turns (from the start corner
  every treasure is reachable within 2). The screen, the end and the shared text show it.
- **Undo:** "Peru" takes back the last shift (and the move after it), as often as wanted.
- **Try again:** after solving, "Uudelleen" starts the same puzzle from the start; the day keeps
  the player's best result. The start screen's puzzle button stays usable.
- **Hint on** in the puzzle.
- Share text: date, turns and par (⭐ when equal), marks row, link.

Workspaces: **rules** (solver, puzzle start, puzzle move), **client** (local room undo and restart,
record of the day's best, screens, texts). **server** untouched.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `daily-puzzle`: goal, par, undo and retry, best-of-day result, hint allowed, share text.

## Impact

- `packages/rules/src/dailySolver.ts` (new), `daily.ts`.
- `client/src/session`: `localRoom.ts`, `dailyRecord.ts`, `localGameStore.ts`, `useGameSession.ts`,
  `viewModel.ts`.
- `client/src/game`: `DailyShare.tsx`, `TurnLine.tsx`, `ShiftControls.tsx`, `MoveControls.tsx`;
  `client/src/screens`: `StartScreen.tsx`, `GameScreen.tsx`; fi/en texts.
- Wiki: architecture (daily puzzle), product context.
