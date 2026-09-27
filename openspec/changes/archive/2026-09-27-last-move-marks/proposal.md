# Proposal

## Why

The board carries many look-alike highlight marks at once: the pushed-in tile's outline, the
route's dots and start ring, the reach rings, the move targets' dashed outlines, the hint ring and
the target ring. The user (2026-09-27) finds the last turn hard to read among them. Each kind of
mark should look different, and the last turn's marks should need no ring on the board at all.

## What Changes

- The pushed-in tile is no longer outlined. Instead a marker **outside the board**, at the edge
  where the tile was pushed in, points into the shifted row or column, in the colour of the player
  who shifted. It also explains why the opposite arrow is forbidden on the next turn.
- The walked route becomes a **dashed line** with a distinct start (a small hollow ring) and end
  (an arrowhead that stops at the pawn), in the mover's colour, instead of a dotted line.
- All of a turn's marks keep the colour of the player who made it; the lifetime rules stay (until
  the next shift, hidden during the viewer's own shift preview).

Workspaces: **client** only. No rules or server change; the marks are derived from the synced
state as today.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `board-view`: "Last turn shown" marks the push at the board edge instead of outlining the tile,
  and draws the route as a dashed line with distinct start and end.

## Impact

- `client/src/game`: `Board.tsx` (edge marker layer, board overflow), `TurnMarks.tsx` and its CSS
  (route look, new edge marker), `TileView.tsx` and its CSS (pushed outline removed),
  `turnTrace.ts` (keeps the last insertion instead of the pushed tile id).
- Tests: `turnTrace.test.ts`, the last-turn test in `GameScreen.test.tsx`.
- Wiki: `docs/architecture.md` if it names the pushed-tile outline; roadmap backlog item marked done.
