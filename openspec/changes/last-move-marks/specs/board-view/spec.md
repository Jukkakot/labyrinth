## MODIFIED Requirements

### Requirement: Last turn shown
After a shift, a marker SHALL stand just outside the board at the edge where the tile was pushed
in, pointing into the shifted row or column, in the colour of the player who shifted, until the
next shift. The pushed-in tile itself is not outlined. After a move to another square, the route
the pawn walked SHALL stay drawn as a dashed line in the mover's colour until the next shift, with
a start mark on the square the walk began and an arrowhead ending at the square where it stopped.
All marks of a turn use that player's colour, MUST NOT rely on colour alone (arrow shape, dashed
line, start and end marks) and MUST NOT catch taps. While the viewer previews a shift of their own,
the marks are hidden.

#### Scenario: Bot shifts and walks
- **WHEN** a bot pushes a tile in at N3 and then walks three squares
- **THEN** a marker in the bot's colour stands above column 3 outside the board, pointing down, and a dashed route runs from a start mark where the bot's pawn stood after the shift to an arrowhead where it stopped

#### Scenario: Staying put
- **WHEN** a player shifts and then stays on their square
- **THEN** only the edge marker is shown, no route is drawn

#### Scenario: Next shift replaces the marks
- **WHEN** the next player's shift arrives
- **THEN** the previous route disappears and the edge marker moves to where the new tile was pushed in, in the new player's colour

#### Scenario: Own preview
- **WHEN** the viewer taps an arrow to preview their shift
- **THEN** the previous turn's marks are hidden until the preview is cancelled or the shift is sent

#### Scenario: Marks look unlike the other board marks
- **WHEN** the viewer's move step shows move targets and the hint while the last shift's marker is shown
- **THEN** the edge marker sits outside the board and no last-turn mark is a ring or outline around a tile
