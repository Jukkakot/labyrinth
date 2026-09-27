## Context

Tiles draw their treasure from the static tile set (`TILE_SET[id].treasure`). Every player's `found`
list is synced to everyone (players, spectators) and is already in the view model as
`SeatView.found`; device games (`LocalRoom`) expose the same state shape. `Board` already receives the
seats; the spare controls (`ShiftControls`, `MoveControls` → `SpareTile`) do not.

## Goals / Non-Goals

**Goals:** collected treasures disappear from board, preview and spare tiles, for every viewer and game
kind, with no protocol change.

**Non-Goals:** fading or a "collected" marker (the point is a cleaner board); changing hint or bots
(they already skip collected treasures); how-to-play pictures.

## Decisions

- **Hidden, not faded.** A collected treasure's tile is drawn as a plain tile and loses its accessible
  name (it becomes decorative like any plain tile). A faded icon would keep the clutter the change
  removes. The player strip still shows how many each player has found.
- **Collected = union of all seats' `found`** (`collectedTreasures(seats)` in `client/src/game`).
  Computed in the client from props, so no new view-model field and no server change. Spectators see
  every seat's `found`, so they get the same board as players.
- **Target always wins.** A tile marked as the viewer's target never hides its treasure. In normal play
  a target is never collected (each treasure is on exactly one stack), but the daily-puzzle replay
  shows frames from a finished game where the replayed target is already in `found`; the target rule
  keeps it visible there.
- **Replay frames use the final collected set.** The daily puzzle has one treasure (the target), so
  this changes nothing there. Should a multi-treasure replay ever come, a frame would need its own
  collected set; not needed now.
- **Board computes, controls take a prop.** `Board` derives the set from its `seats` prop. `SpareTile`,
  `ShiftControls` and `MoveControls` take an optional `collected` set (default empty = today's
  behaviour); the game screen passes it. That wiring is in `GameScreen.tsx`, outside this job's files,
  so it is handed to the coordinator.
- **TileView prop `treasureHidden`.** A boolean keeps `TileView` free of game state; callers decide.

## Risks / Trade-offs

- Until the game screen passes `collected` to the spare controls, a collected treasure on the spare
  still shows its icon (harmless, just inconsistent) → coordinator wiring.

## NFR

- Logging: none (pure rendering, no new events).
- Tests: unit test for the collected-set helper and render tests in `Board.test.tsx` for board, spare
  and target. No E2E change (smoke test path unchanged).
- Limits/performance: one small set per render; no bundle-size impact worth noting.
