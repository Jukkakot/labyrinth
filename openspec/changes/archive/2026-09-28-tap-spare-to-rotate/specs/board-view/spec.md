## MODIFIED Requirements

### Requirement: Push and pick shift controls
On the viewer's turn, each of the 12 insertion points SHALL be marked by an arrow on the board-edge tile where the spare would enter. The whole tile is the tap target. Tapping an arrow MUST preview the shift on the board: the line shown moved, the spare in place, and the tile that would drop out marked. Tapping another arrow MUST switch the preview, and a cancel button ("Peru") MUST return to the unshifted board. A rotate button next to the spare tile MUST turn the spare 90° clockwise, including during a preview. Tapping the spare tile itself MUST do the same on the viewer's shift step; on other players' turns, in the move step and while a command waits it does not react. Nothing is sent while the viewer only previews.

By default (push and pick) the preview has no confirm step: every square the viewer's pawn could reach on the previewed board MUST be offered as a tap target, and tapping one MUST send the shift and then a move to that square; the square where the preview carries the pawn, or "Jää paikalleen" under the board, sends the shift and a stay. Tapping the previewed arrow again does nothing. An arrow whose edge tile is one of the offered squares is left out during the preview, so the whole tile stays the move's tap target; "Peru" brings it back. If the shift is rejected, no move is sent and the preview is dropped.

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

#### Scenario: Offered square on an arrow tile
- **WHEN** the viewer previews W1 and the square carrying the W1 arrow is reachable after it
- **THEN** that arrow is not shown and tapping the square sends the shift and the move there; after "Peru" the arrow is back

#### Scenario: Rejected shift
- **WHEN** the viewer taps a reachable square in the preview and the server rejects the shift
- **THEN** no move is sent and the unshifted board is shown with the rejection message

#### Scenario: Separate shift
- **WHEN** "Työnnä erikseen" is on and the viewer taps the N3 arrow and then presses "Työnnä"
- **THEN** only the shift is sent, and the viewer then walks in the move step

#### Scenario: Rotate the spare
- **WHEN** the viewer presses the rotate button twice
- **THEN** the spare tile is shown turned 180°, and a following shift inserts it with rotation 180° relative to the rotation it had

#### Scenario: Tap the spare to rotate
- **WHEN** on her shift step Maija taps the spare tile under the board
- **THEN** the spare turns a quarter clockwise, and a following shift inserts it with that rotation
