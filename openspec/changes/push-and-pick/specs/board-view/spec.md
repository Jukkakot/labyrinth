## ADDED Requirements

### Requirement: Push and pick shift controls
On the viewer's turn, each of the 12 insertion points SHALL be marked by an arrow on the board-edge tile where the spare would enter. The whole tile is the tap target. Tapping an arrow MUST preview the shift on the board: the line shown moved, the spare in place, and the tile that would drop out marked. Tapping another arrow MUST switch the preview, and a cancel button ("Peru") MUST return to the unshifted board. A rotate button next to the spare tile MUST turn the spare 90° clockwise, including during a preview. Nothing is sent while the viewer only previews.

By default (push and pick) the preview has no confirm step: every square the viewer's pawn could reach on the previewed board MUST be offered as a tap target, and tapping one MUST send the shift and then a move to that square; the square where the preview carries the pawn, or "Jää paikalleen" under the board, sends the shift and a stay. Tapping the previewed arrow again does nothing. If the shift is rejected, no move is sent and the preview is dropped.

With the setting "Työnnä erikseen" on, the preview is confirmed by tapping the same arrow again or pressing "Työnnä", which sends the shift, and the move follows in the move step. All controls MUST be at least 44 px to tap.

#### Scenario: Push and pick
- **WHEN** the viewer taps the N3 arrow and then a square their pawn could reach after that shift
- **THEN** the board first shows column 3 moved down with the spare on (0,3) and the reachable squares as targets, and the tap sends the N3 shift once and then the move to that square

#### Scenario: Shift and stay
- **WHEN** the viewer taps the N3 arrow and then "Jää paikalleen"
- **THEN** the N3 shift is sent, followed by a move to the square where the shift left the pawn

#### Scenario: Change of mind
- **WHEN** the viewer taps the N3 arrow and then the W1 arrow
- **THEN** the preview shows the W1 shift with its reachable squares instead, and nothing has been sent

#### Scenario: Rejected shift
- **WHEN** the viewer taps a reachable square in the preview and the server rejects the shift
- **THEN** no move is sent and the unshifted board is shown with the rejection message

#### Scenario: Separate shift
- **WHEN** "Työnnä erikseen" is on and the viewer taps the N3 arrow and then presses "Työnnä"
- **THEN** only the shift is sent, and the viewer then walks in the move step

#### Scenario: Rotate the spare
- **WHEN** the viewer presses the rotate button twice
- **THEN** the spare tile is shown turned 180°, and a following shift inserts it with rotation 180° relative to the rotation it had

### Requirement: Reach offered in the shift preview
While the viewer previews a shift on their own turn, every square their pawn could reach on the
previewed board SHALL be marked, including a pawn carried by the previewed shift. In push and pick
the marks are the tap targets of the move (same look as the move step's targets). With "Työnnä
erikseen" on, the marks MUST look different from the tappable move targets and MUST NOT be tappable.
Rotating the spare or choosing another arrow updates them at once; cancelling removes them.

#### Scenario: Preview opens a corridor
- **WHEN** the viewer previews W3 and that shift connects their square to four others
- **THEN** those five squares carry the reach mark

#### Scenario: Rotate the previewed spare
- **WHEN** the viewer rotates the spare while a preview is shown
- **THEN** the reach marks are recomputed for the rotated tile

#### Scenario: Not tappable with a separate shift
- **WHEN** "Työnnä erikseen" is on and the viewer taps a reach-marked square during the preview
- **THEN** nothing is sent to the server

## MODIFIED Requirements

### Requirement: Hint
Next to the spare tile, in both the shift and the move step, a "Vihje" button SHALL show the turn
the bots' own strategy would choose for the viewer, without doing any of it. The hint MUST be
worked out on the viewer's device from what the viewer may know: the board, the spare tile, every
pawn, every player's found treasures and cards left, the last insertion, and the viewer's own
target; never another player's target. In the shift step it MUST preview the hinted shift like a
tapped arrow (that arrow selected, the spare turned to the hinted rotation) and mark the square to
walk to after it; the mark disappears while another shift or rotation is previewed. In the move
step it MUST mark the square to walk to. The same position MUST always give the same hint. The
button MUST be enabled only on the viewer's own turn while no command waits for the server, and
shown but disabled otherwise. Hints are not limited. The marked square MUST be told apart from the
reach and move marks by more than colour and MUST have a text alternative. It MUST also have a
colour of its own, not the colour of the reach and move marks, and it MUST draw the eye with a
gentle pulse that stays still when the viewer prefers reduced motion.

#### Scenario: Hint for the shift
- **WHEN** it is the viewer's shift step and they press "Vihje"
- **THEN** the board previews the hinted shift with its arrow selected and the spare turned, a ring marks the square to walk to, and nothing has been sent

#### Scenario: Following the hint
- **WHEN** after a hint for the shift the viewer taps the ringed square
- **THEN** the hinted shift is sent and the pawn walks to that square

#### Scenario: Hint for the move
- **WHEN** it is the viewer's move step after their own shift and they press "Vihje"
- **THEN** a ring marks a reachable square to walk to, and the pawn has not moved

#### Scenario: Another shift previewed
- **WHEN** after a hint the viewer taps a different arrow
- **THEN** the preview shows that shift and the ring is gone

#### Scenario: Not your turn
- **WHEN** another player is taking their turn
- **THEN** the "Vihje" button is shown disabled

#### Scenario: Same position, same hint
- **WHEN** the viewer presses "Vihje" twice in the same position
- **THEN** both show the same shift and square

#### Scenario: Ring stands out
- **WHEN** the hint ring is shown next to reach rings or move outlines
- **THEN** it has a different colour from them and pulses gently

#### Scenario: Reduced motion
- **WHEN** the viewer prefers reduced motion and the hint ring is shown
- **THEN** the ring does not pulse

## REMOVED Requirements

### Requirement: Shift controls
**Reason**: The preview no longer needs a confirm step by default; push and pick commits shift and move with one tap on a square.
**Migration**: See "Push and pick shift controls"; the old confirm flow lives on behind the setting "Työnnä erikseen".

### Requirement: Reach shown in the shift preview
**Reason**: In push and pick the reach marks are the tappable move targets.
**Migration**: See "Reach offered in the shift preview"; the non-tappable rings remain with "Työnnä erikseen" on.
