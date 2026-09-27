## ADDED Requirements

### Requirement: Last turn shown
After a shift, the tile that was pushed in SHALL stay marked in the colour of the player who
shifted until the next shift. After a move to another square, the route the pawn walked SHALL stay
drawn from its start square to its end square in the mover's colour until the next shift. The
marks MUST NOT rely on colour alone (outline and route line) and MUST NOT catch taps. While the
viewer previews a shift of their own, the marks are hidden.

#### Scenario: Bot shifts and walks
- **WHEN** a bot pushes a tile in at N3 and then walks three squares
- **THEN** the tile now at the top of column 3 is outlined in the bot's colour and a route line runs from where the bot's pawn stood after the shift to where it stopped

#### Scenario: Staying put
- **WHEN** a player shifts and then stays on their square
- **THEN** only the pushed-in tile is marked, no route is drawn

#### Scenario: Next shift replaces the marks
- **WHEN** the next player's shift arrives
- **THEN** the previous route disappears and the newly pushed-in tile is marked instead

#### Scenario: Own preview
- **WHEN** the viewer taps an arrow to preview their shift
- **THEN** the previous turn's marks are hidden until the preview is cancelled or the shift is sent

### Requirement: Reach shown in the shift preview
While the viewer previews a shift on their own turn, every square their pawn could reach on the
previewed board SHALL be marked, including a pawn carried by the previewed shift. The marks MUST
look different from the tappable move targets and MUST NOT be tappable. Rotating the spare or
choosing another arrow updates them at once; cancelling removes them.

#### Scenario: Preview opens a corridor
- **WHEN** the viewer previews W3 and that shift connects their square to four others
- **THEN** those five squares carry the reach mark

#### Scenario: Rotate the previewed spare
- **WHEN** the viewer rotates the spare while a preview is shown
- **THEN** the reach marks are recomputed for the rotated tile

#### Scenario: Not tappable
- **WHEN** the viewer taps a reach-marked square during the preview
- **THEN** nothing is sent to the server
