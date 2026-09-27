## Why

A first-time player must understand every mark on the board. Today several marks look alike (rings,
dashed outlines, a small push triangle), the reach looks different in the preview and in the move
step, a tapped forbidden arrow just does nothing, and a player who does not know what to do gets no
nudge. The user compared variants in the "Laudan merkit" mock-ups and picked A2, B2, C1, D2 and E3.

## What Changes

- **A2 last push:** the tile pushed in last is drawn small just outside the board edge where it came
  in, in its rotation, framed in the mover's colour, with a small pointer toward the board. It
  replaces the push triangle; the walked route stays. The board gets a margin for it on every side,
  partly taken from the page gutter, so it shrinks only a little.
- **B2 own pawn and hint:** the viewer's pawn gets a ring in its own colour (replaces the dashed black
  ring) that pulses slowly on the viewer's turn; the hint ring gets a bulb badge, the same icon as
  the "Vihje" button.
- **C1 forbidden arrow:** looks as today (faded), but tapping it explains why in the notice line
  ("Tästä ei voi työntää: laatta palaisi juuri sinne, mistä edellinen tippui."); nothing is sent.
- **D2 idle guide:** after 10 s without any action on the viewer's turn, the arrows (shift step) or
  the reachable squares (a push-and-pick preview or the move step) nudge gently; no text. With
  reduced motion nothing moves.
- **E3 reachable squares:** a dot on the corridor hub, filled where it can be tapped (move step and
  push-and-pick preview), hollow where it only informs (preview with "Työnnä erikseen"). Replaces the
  preview's rings and the move step's dashed squares; the whole tile stays the tap target.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `board-view`: Last turn shown (A2), Pawns on their squares and Hint (B2), Forbidden reverse shown
  (C1), Move controls and Reach offered in the shift preview (E3), a new Idle guide requirement (D2).

## Impact

- Workspaces: client only (`client/src/game`: board, turn marks, pawn, move and shift targets; game
  screen wiring; fi/en texts). No rules, server or protocol change.
- Board size: the SVG gains a margin for the pushed-tile mark; checked on the reference phone.
