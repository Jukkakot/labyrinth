# Proposal

## Why

A turn currently ends as soon as the tile is pushed, and pawns never leave their start corners.
Moving through the labyrinth is the second half of every turn in the original game; without it
there is no way to reach treasures, so it is the next step on the roadmap (item 6) and the
prerequisite for `treasures-and-win`.

## What Changes

- Every pawn has a square on the board, starting on its seat's start corner. Pawns ride shifts
  (the rule already exists in `shiftBoard`; the server now applies it).
- A turn has two steps: **shift**, then **move**. After an accepted shift the same player moves:
  to any square reachable along connected corridors, or stays. Only then does the turn pass.
- New `move` command with a target square; the own square means "stay". A target that cannot be
  reached is rejected with `UNREACHABLE`; a move during the shift step (or a shift during the move
  step) is rejected with `WRONG_PHASE`.
- Pawns may share a square (original rules).
- Client: on your move step the reachable squares are highlighted and tapping one moves at once;
  a "Stay" button stays. The turn line says whether the current player is pushing or moving. Pawns
  are drawn on their current squares, walk along their path when they move, and ride shifts.
  Pawns sharing a square are drawn smaller side by side.
- **BREAKING (turn flow):** the turn no longer passes right after the shift.

Workspaces touched: `packages/rules` (reachability and path), `packages/protocol` (move payload,
phase and error code), `server` (pawn squares in state, `move` command, shift applies pawns),
`client` (move UI, pawn positions and animation).

## Capabilities

### New Capabilities
- `pawn-movement`: pawn squares, reachability through connected corridors, the move step and the
  `move` command, staying, shared squares.

### Modified Capabilities
- `turns`: the turn has a shift step and a move step; it passes after the move, not after the
  shift; a player leaving during their move step passes the turn.
- `board-view`: pawns are shown on their current squares (not only start corners), the turn line
  names the step, and new move controls (reachable highlight, tap to move, Stay, walking pawn).

## Impact

- Synced state: `Player` gains `row`/`col`; `phase` takes `"move"`. Old clients would show pawns on
  corners and never offer a move, but client and server are deployed together.
- Protocol: `movePayloadSchema`, `TURN_PHASES = ["shift", "move"]`, `UNREACHABLE` code.
- Tests: rules unit + property tests, server room tests, client component tests. E2E smoke test is
  unchanged (critical path "Play shows the board" is not affected).
- Docs: `docs/architecture.md` (state sync, rules API, game flow), roadmap item 6 done.
