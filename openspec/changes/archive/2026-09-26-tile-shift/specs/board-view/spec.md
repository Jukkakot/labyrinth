# Spec Delta

## ADDED Requirements

### Requirement: Whose turn is shown
The game screen SHALL always show whose turn it is. On your own turn it MUST say what to do ("Sinun vuorosi – työnnä laatta"). On someone else's turn it MUST name that player and show their pawn shape and colour ("Pelaaja 2 työntää").

#### Scenario: Own turn
- **WHEN** it is the viewer's turn
- **THEN** the turn line says it is their turn and that they should push a tile

#### Scenario: Other player's turn
- **WHEN** it is the turn of the player in seat 2 and the viewer is in seat 1
- **THEN** the turn line names player 2 with their pawn shape, and the shift controls are disabled

### Requirement: Shift controls
On the viewer's turn, each of the 12 insertion points SHALL be marked by an arrow on the board-edge tile where the spare would enter. The whole tile is the tap target. Tapping an arrow MUST preview the shift on the board: the line shown moved, the spare in place, and the tile that would drop out marked. Confirming the preview, by tapping the same arrow again or pressing the confirm button, MUST send the shift. Tapping another arrow MUST switch the preview, and a cancel button MUST return to the unshifted board. A rotate button next to the spare tile MUST turn the spare 90° clockwise, including during a preview. All controls MUST be at least 44 px to tap.

#### Scenario: Preview then confirm
- **WHEN** the viewer taps the N3 arrow and then presses "Työnnä"
- **THEN** the board first shows column 3 moved down with the spare on (0,3), and after confirming the shift is sent once

#### Scenario: Change of mind
- **WHEN** the viewer taps the N3 arrow and then the W1 arrow
- **THEN** the preview shows the W1 shift instead, and nothing has been sent

#### Scenario: Rotate the spare
- **WHEN** the viewer presses the rotate button twice
- **THEN** the spare tile is shown turned 180°, and a following shift inserts it with rotation 180° relative to the rotation it had

### Requirement: Forbidden reverse shown
The insertion point that would push straight back the previous shift SHALL be shown disabled and MUST NOT be selectable.

#### Scenario: After N1
- **WHEN** the previous shift was N1
- **THEN** the S1 arrow is shown disabled and tapping it does nothing

### Requirement: Tiles slide
When the board changes by a shift, the moving tiles SHALL slide to their new squares (about 200 ms) instead of jumping. With reduced motion requested by the device, they MUST move without animation.

#### Scenario: Someone shifts
- **WHEN** any player's shift arrives
- **THEN** the tiles of that line slide one square on every player's screen

### Requirement: Rejected command message
When the server rejects the viewer's command, the game screen SHALL show a short localized message explaining the reason (for example "Et voi työntää laattaa takaisin samasta kohdasta"). The message MUST disappear by itself after a few seconds, and technical details MUST NOT be shown. While a command is waiting for the server, the controls MUST show a waiting state and MUST NOT accept a second command.

#### Scenario: Server says not your turn
- **WHEN** the server rejects a shift with `NOT_YOUR_TURN`
- **THEN** the viewer sees "Ei ole sinun vuorosi" for a few seconds and the board is unchanged
