## Context

The board is one SVG (`Board.tsx`, 100 units per tile, viewBox 0..700, `overflow: visible`) sized
`min(100%, 60dvh, 640px)`; the page has a 16 px side gutter. Turn marks live in `TurnMarks.tsx`
(`PushMark` triangle in the gutter, `RouteTrace`, `HintMark`, `ReachMarks`); move targets in
`MoveTargets.tsx` (dashed outline + hub dot); arrows in `ShiftTargets.tsx` (whole entry tile, badge
at the outer edge; the forbidden one ignores taps). The own pawn has a dashed black ring
(`Pawn.tsx`). Push and pick (previous change) made the preview's reach tappable with the move-target
look and hides an arrow whose tile is an offered square.

## Goals / Non-Goals

**Goals:** the five picked marks, each different in kind from the others, accessible (no colour
alone, reduced motion honoured), no tap target under 44 px on the reference phone.

**Non-Goals:** new texts or tips beyond the forbidden-arrow explanation; changing the target mark,
the route trace or the tile look; moving the arrows off the board.

## Decisions

- **A2 geometry.** The pushed-in tile (the tile now on the insertion's entry square, which is the
  one pushed in until the next shift) is drawn with the normal tile renderer at 0.36 scale, centred
  on its line, 10 units outside the board edge, framed in the mover's colour, with a small pointer in
  the gap toward the board. The SVG viewBox gets a 48-unit margin on every side (always, so the board
  does not jump between turns). To keep the board large, the SVG is widened into the page gutter
  (`width: min(100% + 32px, …)` with a negative inline margin): on the S24 a tile stays ~48 px
  (was ~50 px), above the 44 px minimum. Collected treasures stay hidden on the small tile; the
  target mark is not drawn on it. Height grows by the same margin; the page still fits 360×780.
- **B2 ring.** The own pawn's ring is drawn in the pawn's own colour (with a thin surface-coloured
  under-stroke so it reads on any tile). The roadmap said "only on your turn"; a pawn with no mark
  at all off turn would break "the viewer's own pawn must be identifiable", so the ring is always
  there and only the pulse is limited to the viewer's turn (not while autoplayed, not as spectator).
  Reduced motion: still ring.
- **B2 bulb.** A yellow disc with the same Tabler bulb icon as the "Vihje" button sits on the ring's
  upper right; part of the hint mark, not tappable, same text alternative as before.
- **C1.** The forbidden arrow becomes focusable and tappable again but only reports: the game screen
  shows the explanation in the notice line for the usual few seconds, nothing previewed or sent. Its
  label still says "ei sallittu". A tap while a command waits does nothing.
- **D2.** A small idle hook in the game screen: a key made of everything the viewer can change
  (board key, previewed arrow, rotation, chosen square, hint on) restarts a 10 s timer on the
  viewer's own turn; when it fires, the current targets get a nudge class. Arrows move 8 units toward
  the board and back (1.4 s loop); dots grow and shrink. Any change of the key stops it. Not in
  the separate-shift preview (the next step there is the "Työnnä" button, not a board mark), not
  while autoplayed, not for spectators. Reduced motion: no animation.
- **E3 dots.** Tappable target: filled dot r 13 on the hub in the highlight colour with a surface
  outline; chosen (confirm move): r 18 plus a ring r 26; keyboard focus: a ring r 26. Non-tappable
  preview reach: hollow dot r 11 (stroke 5). The dashed square outline and the r 23 rings are gone.
  The whole tile stays the tap target. The hint ring (r 33) surrounds a dot without covering it.

## NFR (openspec/context/nfr.md)

- Logging: none needed (pure rendering; the forbidden tap sends nothing).
- Tests: render tests for the pushed-tile mark (position, rotation, colour, gone in a preview), own
  ring colour and pulse flag, hint bulb, forbidden tap message, dots (filled vs hollow), idle nudge
  with fake timers; UI check on the phone for sizes. No rules or server tests.
- Performance: a few more SVG nodes; CSS animations only while idle. Bundle growth negligible.

## Risks / Trade-offs

- The small tile at 0.36 scale (~17 px on the phone) shows corridors, not details; it is a marker, the
  real tile is on the board.
- Widening into the gutter means the board no longer lines up exactly with the controls below
  (~16 px wider on each side at most); acceptable.

## Found in the UI check

- 360×780 portrait: a tile is ~45 px (was ~47 px), page has no horizontal scroll; a side push's
  small tile sits ~2 px from the screen edge. Landscape (780×360) boards were already capped by
  height (60dvh); the margin makes their tiles ~25 px (was ~31 px); landscape is not the reference.
- The forbidden-arrow notice going away must not restart the idle wait: the idle key counts taps,
  not whether the notice is shown.
