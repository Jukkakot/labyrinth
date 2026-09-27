# Design

## Context

`turn-feedback` added the last-turn marks: `turnTrace.ts` derives a `TurnTrace` (shift key, seat,
pushed tile id, route) from the synced state; `TileView` outlines the pushed tile in the seat
colour; `RouteTrace` draws a dotted polyline through the tile hubs with a hollow start ring. Other
marks on the board: preview highlight (orange outline), reach rings (orange), move targets (orange
dashed outline + dot), hint (pulsing yellow ring), target (purple ring + badge), shift arrows
(badges inside the edge tiles, own turn only).

## Goals / Non-Goals

**Goals:** the last turn reads at a glance; no last-turn mark resembles a ring or tile outline.

**Non-Goals:** changing the other marks, animation of the push, an event log.

## Decisions

1. **Edge marker outside the board, no tile outline.** A filled triangle (chevron) in the seat
   colour with a surface-coloured stroke, centred on the shifted line just outside the board edge,
   pointing inward. The trace keeps the last insertion id instead of the pushed tile id (the
   insertion is already synced as `lastInsertion`). Alternative kept out: both marker and tile
   outline (more marks, the opposite of the aim).
2. **Drawn in the page gutter, the board does not shrink.** The board SVG gets
   `overflow: visible` and the marker is drawn at negative coordinates / beyond 700 units. Its
   depth (18 units ≈ 8–9 px on a phone) fits the content's 16 px side padding and the 16 px gap
   above and below the board. Alternative: widen the viewBox by a margin — shrinks every tile ~5 %
   for a mark that is rarely looked at.
3. **Route: dashed line, hollow start ring, arrowhead end.** Dash `14 9`, round caps, width 6. The
   last segment is shortened so an SVG arrowhead ends at the pawn's edge (~30 units from the hub)
   instead of hiding under the pawn. The start ring is small (r 10) so it does not read as a
   reach ring (r 23) or the hint (r 33).
4. **Colour.** All last-turn marks use `--seat-N` of the player who shifted (unchanged). Shape
   carries meaning without colour: arrow shape and position for the push, dashed line + arrowhead
   for the walk.
5. **The forbidden reverse arrow** on the next player's turn sits at the opposite end of the same
   line as the edge marker; no extra explanation is added.

## Risks / Trade-offs

- A seat-2 (orange) route near orange move targets: different shapes (line vs. dashed tile
  outline) keep them apart.
- Content overflowing the SVG could be clipped if a parent sets `overflow: hidden`; none does
  today, the UI check confirms it on the phone.

## NFR

- Logging: none (pure presentation, no commands).
- Tests: `turnTrace` unit tests for the insertion kept in the trace; one `GameScreen` render test
  for the marker and the route ends; UI check on the phone (portrait).
- Performance: a few SVG elements; bundle size checked by `npm run size`.
