## Why

A turn takes three taps today: the arrow (preview), "Työnnä" (or the arrow again), then the square to
walk to. The confirm tap adds nothing the next tap would not already say. Placing the tile at an arrow
should show at once where the player can walk, keep the tile movable and rotatable, and let one tap on
a reachable square finish the whole turn, so the shift needs no separate confirmation.

## What Changes

- **Push and pick (new default flow).** Tapping an edge arrow places the spare there as a preview and
  marks every square the pawn could reach after that shift as a tappable target. The player can still
  tap another arrow, rotate the spare or cancel. Tapping a reachable square sends the shift and then
  the move to that square; the own square, or "Jää paikalleen" under the board, sends the shift and
  stays. The "Työnnä" confirm button and the "tap the arrow again to push" gesture are gone from this
  flow.
- **Setting "Työnnä erikseen" (off by default)** replaces "Vahvista työntö": on, the turn works as
  today (preview, "Työnnä" or a second tap, then the move step). The old one-tap-shift mode (confirm
  shift off) is dropped: push and pick needs the same number of taps and shows where you can walk.
- "Vahvista siirto" keeps working in both flows: a tapped square is only chosen until tapped again or
  "Kävele tänne".
- Online games send the two existing commands one after the other (shift, then move); opponents see
  the shift only when the player commits. No protocol, server or rules change.
- The hint previews its shift and rings its square as before; in push and pick the ringed square is
  tappable and commits the hinted turn.
- First-game tips: the walk tip also shows while a shift is previewed; the push tip passes once an
  arrow is tapped. The "Näin pelaat" push and walk texts describe the new flow.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `board-view`: shift controls (push and pick, separate-shift flow), reach in the preview (tappable in
  push and pick), hint scenario.
- `settings`: "Työnnä erikseen" replaces the shift confirmation setting; defaults.
- `first-game-tips`: the walk tip's moment includes a previewed shift.

## Impact

- Workspaces: client only (`GameScreen`, `ShiftControls`, settings, tips, i18n, how-to-play texts).
  No rules, server or protocol change.
- E2E and screen tests that confirmed a shift with "Työnnä" change to the new flow.
