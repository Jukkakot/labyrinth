# tile-shift Specification

## Purpose
Define the shift: inserting the spare tile into a movable row or column, what moves, what becomes the new spare, what happens to pawns on the line, and which shift is forbidden.

## Requirements

### Requirement: Insertion points
There SHALL be exactly 12 insertion points: each end of rows 1, 3 and 5 and of columns 1, 3 and 5. An insertion point is named by the side the spare enters from and the line index: `N1`, `N3`, `N5` push a column down from the top; `S1`, `S3`, `S5` push it up from the bottom; `W1`, `W3`, `W5` push a row right from the left; `E1`, `E3`, `E5` push it left from the right. No other insertion MUST be accepted.

#### Scenario: Twelve points
- **WHEN** the insertion points are listed
- **THEN** there are 12: N1, N3, N5, E1, E3, E5, S1, S3, S5, W1, W3, W5

#### Scenario: Fixed line cannot be pushed
- **WHEN** an insertion into column 2 is requested
- **THEN** it is rejected as not an insertion point

### Requirement: Shifting a line
Inserting the spare at an insertion point SHALL move every tile of that line one square away from the entry side. The spare MUST take the square at the entry side with the rotation chosen for it, and the tile pushed off the opposite end MUST become the new spare, keeping its rotation. No other square changes. Every tile keeps its id.

#### Scenario: Push a column down
- **WHEN** the spare is inserted at N1 with rotation 90°
- **THEN** the spare is at (0,1) with rotation 90°, the tile that was at (r,1) is now at (r+1,1) for r = 0…5, the tile that was at (6,1) is the new spare, and all other squares are unchanged

#### Scenario: Push a row left
- **WHEN** the spare is inserted at E3
- **THEN** the spare is at (3,6), the tile that was at (3,c) is now at (3,c−1) for c = 1…6, and the tile that was at (3,0) is the new spare

#### Scenario: Fixed tiles never move
- **WHEN** any shift is made
- **THEN** every fixed square holds the same tile as before

### Requirement: Pawns ride the shift
A pawn standing on a shifted line SHALL move with its tile. A pawn whose tile is pushed off the board MUST be placed on the newly inserted tile at the entry side.

#### Scenario: Pawn moves with its tile
- **WHEN** a pawn stands on (2,3) and the spare is inserted at N3
- **THEN** the pawn is on (3,3)

#### Scenario: Pawn wraps around
- **WHEN** a pawn stands on (6,3) and the spare is inserted at N3
- **THEN** the pawn is on (0,3), on the inserted tile

### Requirement: No pushing straight back
A shift SHALL be rejected when it is the exact reverse of the previous shift in the game: same line index, opposite side. For example, S1 directly after N1 would push the same tile straight back. The first shift of a game has no restriction.

#### Scenario: Reverse forbidden
- **WHEN** the previous shift was N1 and the next shift requested is S1
- **THEN** it is rejected with `REVERSE_PUSH_FORBIDDEN` and nothing changes

#### Scenario: Other shifts allowed
- **WHEN** the previous shift was N1 and the next shift requested is N1, N3 or W1
- **THEN** it is allowed
