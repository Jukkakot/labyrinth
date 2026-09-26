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
