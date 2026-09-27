## ADDED Requirements

### Requirement: Idle guide
When the viewer has done nothing for 10 seconds on their own turn (no arrow, rotation, square,
hint or other step control used), the board SHALL gently nudge what to tap next: the arrows on the
shift step, or the offered squares in a push-and-pick preview and on the move step. There is no
text. Any action stops the nudge and restarts the wait. Spectators, an auto-played seat and the
preview with "Työnnä erikseen" on get no nudge. When the viewer prefers reduced motion nothing
moves.

#### Scenario: Waiting on the shift step
- **WHEN** it is Maija's shift step and she does nothing for 10 seconds
- **THEN** the arrows nudge gently toward the board until she taps something

#### Scenario: Waiting in the preview
- **WHEN** Maija has placed the tile at an arrow and does nothing for 10 seconds
- **THEN** the offered squares' dots nudge gently

#### Scenario: Reduced motion
- **WHEN** the viewer prefers reduced motion and waits 10 seconds
- **THEN** nothing on the board moves

## MODIFIED Requirements

### Requirement: Pawns on their squares
Each seated player's pawn SHALL be shown on the square where it currently stands; a new player's pawn stands on their start corner. Players are distinguished by their pawn (see pawn-looks): a colour-blind-safe colour always paired with a shape (circle, square, triangle, diamond). Everything that shows a player's pawn or colour (board, player strip, turn line, result, waiting room, last-move marks) uses that player's pawn. The viewer's own pawn MUST be identifiable as theirs: it carries a ring in its own colour, which pulses slowly while it is the viewer's turn (still when the viewer prefers reduced motion). When several pawns share a square, all of them MUST stay visible, drawn smaller side by side. In a shift preview, pawns on the previewed line MUST be shown where the shift would carry them.

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

#### Scenario: Own pawn on the viewer's turn
- **WHEN** it becomes Maija's turn and her pawn is the blue circle
- **THEN** a blue ring around her pawn pulses slowly; on another player's turn the ring stays still

### Requirement: Forbidden reverse shown
The insertion point that would push straight back the previous shift SHALL be shown faded and MUST NOT preview or send a shift. Tapping it MUST explain why in the notice line ("Tästä ei voi työntää: laatta palaisi juuri sinne, mistä edellinen tippui."), which disappears by itself after a few seconds.

#### Scenario: After N1
- **WHEN** the previous shift was N1
- **THEN** the S1 arrow is shown faded, and tapping it previews and sends nothing and shows the explanation

### Requirement: Move controls
During the viewer's move step, every square their pawn can reach SHALL be highlighted, and tapping a highlighted square MUST send the move at once, without a separate confirmation. A "Stay" button ("Jää paikalleen") MUST send a move to the pawn's own square; tapping the own square does the same. Squares that cannot be reached MUST NOT react. The shift arrows and the rotate button MUST NOT be offered during the move step. While the move waits for the server, the move controls MUST show a waiting state and MUST NOT accept a second move. Each reachable square is marked by a filled dot on its corridor hub (not by colour alone); the whole square is the tap target. Every square is a tap target of at least 44 px on the reference device.

#### Scenario: Tap to move
- **WHEN** the viewer has shifted and taps a highlighted square
- **THEN** the move to that square is sent once, and the highlight disappears when the turn passes

#### Scenario: Stay
- **WHEN** the viewer has shifted and presses "Jää paikalleen"
- **THEN** a move to the pawn's own square is sent

#### Scenario: Unreachable square
- **WHEN** the viewer taps a square that is not highlighted
- **THEN** nothing is sent

#### Scenario: Not during the shift
- **WHEN** it is the viewer's turn and they have not shifted yet
- **THEN** no squares are highlighted for moving

#### Scenario: Dots mark where to walk
- **WHEN** the viewer's move step offers five squares
- **THEN** each of them shows a filled dot on its hub, and no square is outlined

### Requirement: Last turn shown
After a shift, the pushed-in tile SHALL be drawn small just outside the board at the edge where it
was pushed in, centred on the shifted row or column, in the rotation it has on the board, framed in
the colour of the player who shifted and with a pointer toward the board, until the next shift. The
tile on the board itself is not outlined. The board keeps room for this mark on every side, and it
MUST still fit the reference phone. After a move to another square, the route
the pawn walked SHALL stay drawn as a dashed line in the mover's colour until the next shift, with
a start mark on the square the walk began and an arrowhead ending at the square where it stopped.
All marks of a turn use that player's colour, MUST NOT rely on colour alone (small tile with a pointer,
dashed line, start and end marks) and MUST NOT catch taps. While the viewer previews a shift of their own,
the marks are hidden.

#### Scenario: Bot shifts and walks
- **WHEN** a bot pushes a tile in at N3 and then walks three squares
- **THEN** a small copy of the pushed-in tile, framed in the bot's colour, stands above column 3 outside the board with a pointer down, and a dashed route runs from a start mark where the bot's pawn stood after the shift to an arrowhead where it stopped

#### Scenario: Staying put
- **WHEN** a player shifts and then stays on their square
- **THEN** only the pushed-tile mark is shown, no route is drawn

#### Scenario: Next shift replaces the marks
- **WHEN** the next player's shift arrives
- **THEN** the previous route disappears and the pushed-tile mark shows the new tile where it was pushed in, in the new player's colour

#### Scenario: Own preview
- **WHEN** the viewer taps an arrow to preview their shift
- **THEN** the previous turn's marks are hidden until the preview is cancelled or the shift is sent

#### Scenario: Marks look unlike the other board marks
- **WHEN** the viewer's move step shows move targets and the hint while the last shift's mark is shown
- **THEN** the pushed-tile mark sits outside the board and no last-turn mark is a ring or outline around a tile

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
gentle pulse that stays still when the viewer prefers reduced motion. The ring carries a small badge
with the same bulb icon as the "Vihje" button.

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
- **WHEN** the hint ring is shown next to reach or move dots
- **THEN** it has a different colour from them, pulses gently and carries the bulb badge

#### Scenario: Reduced motion
- **WHEN** the viewer prefers reduced motion and the hint ring is shown
- **THEN** the ring does not pulse

### Requirement: Reach offered in the shift preview
While the viewer previews a shift on their own turn, every square their pawn could reach on the
previewed board SHALL be marked, including a pawn carried by the previewed shift. In push and pick
the marks are the tap targets of the move, filled dots like the move step's. With "Työnnä erikseen"
on, they are hollow dots on the hubs and MUST NOT be tappable.
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
