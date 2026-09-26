# board-view Specification

## Purpose
Show the game board on a phone: every tile's corridors and treasure readable at a glance, the players' pawns, the spare tile and the game's identifier, all on one portrait screen.

## Requirements

### Requirement: Board fits a phone screen
The whole 7×7 board and the spare tile SHALL be visible without scrolling on a 360×780 CSS px portrait screen (reference device Galaxy S24). The board MUST also be shown whole on desktop browsers.

#### Scenario: Galaxy S24 portrait
- **WHEN** a game is shown on a 360×780 portrait viewport
- **THEN** all 49 squares and the spare tile are fully visible and the page does not scroll horizontally

### Requirement: Tiles show their corridors
Each square SHALL show its tile's corridors, from the tile's centre toward exactly the sides where the tile is open, so paths between neighbouring tiles line up. Fixed tiles MUST look different from movable tiles, without relying on colour alone.

#### Scenario: Corner tile
- **WHEN** a corner tile open to E and S is shown
- **THEN** its corridor runs from the centre to the east and south edges and nowhere else

#### Scenario: Fixed tiles recognisable
- **WHEN** the board is shown
- **THEN** the 16 fixed tiles can be told apart from the movable ones

### Requirement: Treasures shown as icons
A tile carrying a treasure SHALL show that treasure's icon on its corridor. The same treasure MUST always use the same icon, and the 24 treasures MUST use 24 different icons. Each treasure MUST have a localized name for assistive technology.

#### Scenario: Treasure tile
- **WHEN** the tile carrying the dragon is shown
- **THEN** it shows the dragon icon, and its accessible name includes the localized treasure name ("lohikäärme" / "dragon")

### Requirement: Pawns on start corners
Each seated player's pawn SHALL be shown on their start corner. Seats are distinguished by a colour-blind-safe colour and by pawn shape: circle, square, triangle and diamond for seats 1–4. The viewer's own pawn MUST be identifiable as theirs.

#### Scenario: Two players
- **WHEN** players in seats 1 and 2 are in the game
- **THEN** a circle pawn is shown on the top-left corner and a square pawn on the top-right corner, each in its seat colour, and the viewer's own pawn is marked as theirs

### Requirement: Spare tile shown
The spare tile SHALL be shown next to the board in the same style as the board's tiles, including its treasure if it has one.

#### Scenario: Spare with treasure
- **WHEN** the spare tile carries a treasure
- **THEN** the spare is shown with its corridors and treasure icon

### Requirement: Game identifier badge
During a game, the game's readable identifier SHALL be shown small in the top area. Tapping it MUST copy a line with the identifier, the local date and time, and the app version (for example `Peli brave-otters-sing · 26.9.2026 14.32 · v a1b2c3d`) and briefly confirm that it was copied. If copying is not possible, the text MUST be shown selectable instead. The badge MUST be at least 44 px tall to tap.

#### Scenario: Copy for a bug report
- **WHEN** the player taps the game identifier
- **THEN** the identifier, local date and time and version are copied to the clipboard and a short "Kopioitu" / "Copied" confirmation appears

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
