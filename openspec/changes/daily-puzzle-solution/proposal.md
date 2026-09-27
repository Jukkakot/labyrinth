# Proposal

## Why

User feedback (2026-09-27) on the daily puzzle: after solving, the player wants to see the best
route, and the hint should give the next step of the best route instead of the bots' general
suggestion.

## What Changes

- **Puzzle hint = next step of a best route** from where the player stands: on the shift step it
  previews the shift (and rotation) and rings the square to walk to; on the move step it rings the
  square that keeps the fewest turns. Searched two turns deep; beyond that the usual hint is used.
- **"Näytä paras reitti"** at the puzzle's end: the board replays a best solution from the start,
  step by step (start, each shift, each walk) with "Edellinen" / "Seuraava" and "Sulje"; the push
  marker and the route line show each step.

Workspaces: **rules** (best line and best move), **client** (hint in the puzzle, replay on the end
screen, texts). **server** untouched.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `daily-puzzle`: the puzzle screen's hint gives the next step of a best route; the end offers the
  best route's replay.

## Impact

- `packages/rules/src/dailySolver.ts`: `bestLine`, `bestMove`.
- `client/src/game/hint.ts` (puzzle branch), new `client/src/game/solutionReplay.ts` and
  `ReplayControls.tsx`, `client/src/screens/GameScreen.tsx`, fi/en texts.
- Wiki: architecture's daily puzzle paragraph.
