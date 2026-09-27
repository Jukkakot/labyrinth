## MODIFIED Requirements

### Requirement: Pawns on their squares
Each seated player's pawn SHALL be shown on the square where it currently stands; a new player's pawn stands on their start corner. Players are distinguished by their pawn (see pawn-looks): a colour-blind-safe colour always paired with a shape (circle, square, triangle, diamond). Everything that shows a player's pawn or colour (board, player strip, turn line, result, waiting room, last-move marks) uses that player's pawn. The viewer's own pawn MUST be identifiable as theirs. When several pawns share a square, all of them MUST stay visible, drawn smaller side by side. In a shift preview, pawns on the previewed line MUST be shown where the shift would carry them.

#### Scenario: Two players
- **WHEN** players in seats 1 and 2 without a pawn choice have just joined a game
- **THEN** a circle pawn is shown on the top-left corner and a square pawn on the top-right corner, each in its colour, and the viewer's own pawn is marked as theirs

#### Scenario: Chosen pawn
- **WHEN** the player in seat 1 has the green triangle
- **THEN** a green triangle stands on the top-left corner, and the player strip and turn line show the green triangle for that player

#### Scenario: Shared square
- **WHEN** the pawns of seats 1 and 2 stand on the same square
- **THEN** both pawns are visible on that square

#### Scenario: Preview carries a pawn
- **WHEN** a pawn stands on (2,3) and the viewer previews the N3 shift
- **THEN** the pawn is shown on (3,3) in the preview
