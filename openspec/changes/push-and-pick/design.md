## Context

The game screen keeps the shift preview locally (`selected` arrow, local rotation) and computes the
previewed board and the viewer's reach with `packages/rules` (`shiftBoard`, `reachableSquares`), the
same rules the server and the device game use. Today the reach is drawn as non-tappable rings; the
shift is sent with "Työnnä" or a second tap on the arrow, and the move step then offers tappable
squares. Settings hold `confirmShift` (default on; off = one tap sends the shift) and `confirmMove`.

## Goals / Non-Goals

**Goals:** one tap on a square after placing the tile finishes the turn; the tile stays movable and
rotatable until then; a setting brings back today's separate shift; no protocol or server change.

**Non-Goals:** the E3 dot look of `clearer-board-marks` (this change reuses today's move-target look
for the tappable squares; E3 restyles them later); a combined server command.

## Decisions

- **Two existing commands, sent back to back.** Committing sends `shift` and, once it is accepted,
  `move` to the tapped square. The preview uses the same rule as the server, so the tapped square is
  reachable on the real board. Opponents see nothing until the commit, then the shift and the walk as
  usual. A combined command would change the protocol, the server, the device game and the audit log
  for no visible gain. If the shift is rejected, the preview is dropped (as today) and no move is
  sent; if the move is rejected (not expected), the player is left in the normal move step.
- **Tappable squares in the preview replace the reach rings** in push and pick. The spec said reach
  marks must look unlike move targets because they were not tappable; now they are, so they use the
  move-target look (outline + hub dot). In the separate-shift flow the rings stay as today.
- **Staying:** the own square (where the preview carries the pawn) is a target, and "Jää paikalleen"
  under the board sends the shift and stays. The controls of a preview are "Peru" (drop the preview)
  and "Jää paikalleen", with the line "Napauta ruutua, jonne kävelet". "Työnnä" is not shown.
- **Tapping the selected arrow again does nothing** in push and pick (no hidden confirm gesture); a
  different arrow moves the preview, the rotate button turns the tile.
- **Setting "Työnnä erikseen" (`separateShift`, default off) replaces `confirmShift`.** On = today's
  flow with confirm. The one-tap shift of `confirmShift: false` is dropped: push and pick takes the
  same two taps and shows the reach first. A new key is used because saved settings store every field,
  so most players have `confirmShift: true` saved as a default, not as a choice; they get the new flow.
  The old key is ignored when read.
- **"Vahvista siirto" in the preview:** the first tap chooses the square (marked, pressed), a second
  tap or "Kävele tänne" commits shift + move, "Peru" drops the choice. Moving the tile, rotating it or
  a new board drops the choice.
- **Hint:** unchanged logic; in push and pick its ringed square is a tappable target, so tapping it
  commits the hinted turn.
- **Tips:** the walk tip's moment is the move step or a previewed shift of the viewer; the push tip
  passes once a shift is previewed (its moment was the untouched shift step).
- **Daily puzzle undo** already returns to the state before the last shift, i.e. before the whole
  committed turn; unchanged.

## NFR (openspec/context/nfr.md)

- Logging: no new events; both commands keep their existing server/device audit and rejection logs.
- Tests: client unit/render tests for the new flow (commit sends shift then move, stay, rejected
  shift sends no move, other arrow/rotation keeps nothing sent, confirm move in the preview, separate
  shift setting), settings load (new key, old key ignored), tips relevance. No rules/server tests
  (no change there). E2E does not drive a shift today; unchanged.
- Limits: two commands per turn as before; no new load. Bundle growth negligible.

## Risks / Trade-offs

- Between the accepted shift and the move reply the screen briefly shows the move step with a waiting
  "Jää paikalleen"; acceptable, it is the true state.
- Players used to "Työnnä" find it gone; the push tip, the preview's line and the how-to-play text say
  what to do, and the setting restores it.
