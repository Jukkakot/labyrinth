## Context

The client already previews a shift with `shiftBoard` from `packages/rules` and animates tiles and
pawns. The synced state carries the board, the pawns' squares, `lastInsertion`, the turn seat and
the step; there is no synced "last move". `reachableSquares` and `shortestPath` exist in the rules.

## Goals / Non-Goals

**Goals:** make each turn readable after it happened; show the reach of a previewed shift.

**Non-Goals:** event log, server or protocol changes, marks that survive a reconnect (they are
transient view state).

## Decisions

- **Derive the last turn in the client, no new synced fields.** A pure helper
  `nextTrace(previous, view)` watches the view: a new shift (spare id or `lastInsertion` changed)
  records the pushed-in tile (the tile on the first square of the insertion line) and the mover's
  seat, and clears the route; on the move step it remembers the mover's square; when the move step
  ends it takes the mover's new square and the route from `shortestPath` on the current board.
  Alternative: sync `lastMoveFrom`/`lastPath` from the server — more exact but touches the hot
  schema and room for a purely visual aid. A client that joins mid-turn simply shows no marks.
- **Marks last until the next shift, not a timer.** "For a moment" in turns: an opponent's marks
  stay through the viewer's decision time (useful when they looked away), and disappear when the
  board changes again. A timer would fade them before a slow reader saw them, and is a second
  notion of time next to the turn clock.
- **Shortest path as the drawn route.** The server does not tell which of several equally long
  routes a pawn took; the drawn route is a shortest one, which is what the walk animation also uses.
- **Mover's seat colour** for the pushed-tile outline and the route (links the marks to the pawn);
  the route is a dotted line through tile hubs with a hollow ring at its start, so it does not
  rely on colour alone.
- **Hide last-turn marks during the viewer's own preview**, so the preview's own highlight (the
  inserted spare) is the only outline that means "your shift".
- **Reach marks**: small hollow rings on the hubs (move targets are dashed outlines with filled
  dots), in a non-interactive layer under the pawns; the layer has one accessible label with the
  count ("5 ruutua ulottuvilla"). Computed with `reachableSquares` on the preview board from the
  viewer's previewed pawn square; memoised with the preview.

## Risks / Trade-offs

- [The drawn route may differ from the path the player tapped] → both are shortest; visual only.
- [A kick or timeout ends the move step without a move] → no route (the pawn did not change square,
  or the seat is gone); the pushed tile mark stays until the next shift.
- NFR: no logging (pure view state, no commands); performance is one BFS over 49 squares per
  preview change; tests: unit tests for the trace helper, render tests for the two layers.
