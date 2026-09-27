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
A tile carrying a treasure SHALL show that treasure's icon on its corridor while the treasure is still in play. Once any player has collected a treasure, its tile MUST be shown as a plain tile: no icon and no treasure name for assistive technology, on the board and in a shift preview. The tile carrying the viewer's current target MUST always show its treasure. The same treasure MUST always use the same icon, and the 24 treasures MUST use 24 different icons. Each treasure MUST have a localized name for assistive technology.

#### Scenario: Treasure tile
- **WHEN** the tile carrying the dragon is shown
- **THEN** it shows the dragon icon, and its accessible name includes the localized treasure name ("lohikäärme" / "dragon")

#### Scenario: Collected treasure hidden
- **WHEN** another player has collected the dragon
- **THEN** the dragon's tile is shown with its corridors but without the dragon icon or name, for players and spectators alike

#### Scenario: Own target always shown
- **WHEN** the tile carrying the viewer's current target is shown
- **THEN** it shows its treasure icon and the target highlight

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

### Requirement: Spare tile shown
The spare tile SHALL be shown next to the board in the same style as the board's tiles, including its treasure if it has one that is still in play; a collected treasure is left out as on the board.

#### Scenario: Spare with treasure
- **WHEN** the spare tile carries a treasure
- **THEN** the spare is shown with its corridors and treasure icon

#### Scenario: Spare with a collected treasure
- **WHEN** the spare tile carries a treasure that has already been collected
- **THEN** the spare is shown with its corridors but without the treasure icon

### Requirement: Whose turn is shown
The game screen SHALL always show whose turn it is and which step it is in. On your own turn it MUST say what to do: push a tile ("Sinun vuorosi – työnnä laatta") or move your pawn ("Sinun vuorosi – siirrä nappulaa"). On someone else's turn it MUST name that player by their nickname, show their pawn shape and colour, and say whether they are pushing or moving ("Maija työntää" / "Maija siirtää"). While the turn clock runs, the turn line MUST show the time left as minutes and seconds (for example `0:42`), emphasised during the last 10 seconds without relying on colour alone, and "Aika loppui" once the time is up. When the current player's connection has dropped, the turn line MUST say so.

#### Scenario: Own turn
- **WHEN** it is the viewer's turn and they have not shifted yet
- **THEN** the turn line says it is their turn and that they should push a tile

#### Scenario: Own move step
- **WHEN** the viewer has shifted
- **THEN** the turn line says it is their turn and that they should move their pawn

#### Scenario: Other player's turn
- **WHEN** it is the turn of Maija in seat 2 and the viewer is in seat 1
- **THEN** the turn line names Maija with her pawn shape and says whether she is pushing or moving, and the shift controls are disabled

#### Scenario: Countdown
- **WHEN** the current turn has 42 seconds left
- **THEN** every player's turn line shows `0:42`, and it keeps counting down

#### Scenario: Time up
- **WHEN** the current player's time is up
- **THEN** the turn line shows "Aika loppui" instead of the countdown

#### Scenario: Current player disconnected
- **WHEN** it is Maija's turn and her connection has dropped
- **THEN** the turn line says that Maija's connection is lost

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

### Requirement: Move controls
During the viewer's move step, every square their pawn can reach SHALL be highlighted, and tapping a highlighted square MUST send the move at once, without a separate confirmation. A "Stay" button ("Jää paikalleen") MUST send a move to the pawn's own square; tapping the own square does the same. Squares that cannot be reached MUST NOT react. The shift arrows and the rotate button MUST NOT be offered during the move step. While the move waits for the server, the move controls MUST show a waiting state and MUST NOT accept a second move. The highlight MUST NOT rely on colour alone. Every square is a tap target of at least 44 px on the reference device.

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

### Requirement: Pawns walk
When a pawn moves, every player SHALL see it walk square by square along a shortest path through the corridors to its target, quickly enough that a long walk takes at most about a second. A pawn riding a shift MUST slide with its tile; a pawn carried off the board edge onto the inserted tile MUST jump there instead of sliding across the board. With reduced motion requested by the device, pawns MUST move without animation.

#### Scenario: Someone moves
- **WHEN** any player's move arrives
- **THEN** their pawn walks along the corridors to the target square on every player's screen

#### Scenario: Reduced motion
- **WHEN** the device requests reduced motion and a pawn moves
- **THEN** the pawn appears on the target square without animation

### Requirement: Own target highlighted
While the game is running, the tile carrying the viewer's current target SHALL always be highlighted, wherever it is: on the board, in a shift preview, or as the spare tile. When the viewer is heading home, their start corner MUST be highlighted instead. The highlight MUST NOT rely on colour alone and MUST look different from the move highlight. Other players' targets MUST NOT be shown.

#### Scenario: Target on the board
- **WHEN** the viewer's current target is the dragon and the dragon's tile is on (3,5)
- **THEN** (3,5) is shown highlighted as the target

#### Scenario: Target on the spare
- **WHEN** the tile carrying the viewer's target is the spare
- **THEN** the spare is shown highlighted as the target

#### Scenario: Heading home
- **WHEN** the viewer has found all their treasures
- **THEN** their start corner is highlighted as the target

### Requirement: Player progress shown
The game screen SHALL show, for every seated player, their nickname, their pawn shape and colour, and how many treasures they have found out of their card count (for example 2/6). A long nickname MUST be shortened with an ellipsis rather than widening the strip, and its full text MUST stay in the accessible text. Pawns on the board MUST be named by the player's nickname for assistive technology, the viewer's own with "(sinä)". For the viewer it MUST also show their current target's icon with its localized name, or a home marker when heading home. A player whose connection has dropped MUST be marked as disconnected with an icon and a dimmed chip, and the accessible text MUST say so. It MUST fit the reference screen together with the board without scrolling.

#### Scenario: Progress strip
- **WHEN** Maija in seat 1 and Pekka in seat 2 have found 2 and 0 of their 12 treasures and the viewer is Maija with the dragon as target
- **THEN** the screen shows Maija with 2/12 and the dragon, and Pekka with 0/12 and no target

#### Scenario: Long nickname
- **WHEN** four players with 16-character nicknames are seated on the reference screen
- **THEN** the strip fits the screen width, the names are shortened with an ellipsis, and the accessible text holds the full names

#### Scenario: Disconnected player
- **WHEN** seat 2's connection has dropped
- **THEN** seat 2's chip is dimmed and shows a disconnected icon, and its accessible text says the connection is lost

### Requirement: Collected treasure announced
When the viewer collects a treasure, the game screen SHALL briefly show which treasure was found ("Löysit: lohikäärme"). When another player collects one, their found count MUST update.

#### Scenario: Viewer collects
- **WHEN** the viewer's move collects the dragon
- **THEN** a short message names the dragon and the target highlight moves to the next target

### Requirement: Game result shown
When the game finishes, the turn line SHALL be replaced by the result: "Voitit!" for the winner, and "Maija voitti" (the winner's nickname) with the winner's pawn shape and colour for everyone else. Shift and move controls MUST NOT be offered any more. A seated player MUST be offered "Pelaa uudelleen" as the primary action (see the rematch requirement of game-session) and "Alkuun", which leaves the finished game and returns to the start screen.

#### Scenario: Viewer wins
- **WHEN** the viewer's move wins the game
- **THEN** the screen says "Voitit!", no step controls are offered, and "Pelaa uudelleen" and "Alkuun" are shown

#### Scenario: Someone else wins
- **WHEN** Maija in seat 2 wins and the viewer is in seat 1
- **THEN** the screen says "Maija voitti" with her pawn, and "Alkuun" returns the viewer to the start screen

### Requirement: Kick control
When the current player's turn time is up, every other seated player SHALL be offered, in place of the step controls under the board, a button that names the slow player by nickname ("Poista Maija"). Tapping it MUST ask for confirmation ("Poistetaanko Maija pelistä?" with "Poista" and "Peru") before the kick is sent. The control MUST NOT be offered to the current player, before the time is up, or in a finished game. While the kick waits for the server, the buttons MUST show that it is pending. If the turn passes before the kick is confirmed, the control MUST disappear.

#### Scenario: Offer after the time is up
- **WHEN** Maija's time is up and the viewer is another seated player
- **THEN** the viewer sees "Poista Maija" under the board

#### Scenario: Confirm before kicking
- **WHEN** the viewer taps "Poista Maija"
- **THEN** nothing is sent until they tap "Poista" in the confirmation, and "Peru" returns to the button

#### Scenario: Not for the slow player
- **WHEN** the viewer is the current player and their time is up
- **THEN** they see their normal step controls and no kick control

#### Scenario: Turn ends meanwhile
- **WHEN** the slow player finishes their turn while the viewer is looking at the confirmation
- **THEN** the kick control disappears and nothing is sent

### Requirement: Departures announced
When another player leaves the running game, for any reason, the game screen SHALL briefly show who left by nickname ("Maija poistui pelistä") in the shared status message area.

#### Scenario: Someone leaves
- **WHEN** Maija in seat 2 is kicked while the viewer is in seat 3
- **THEN** the viewer sees "Maija poistui pelistä" and Maija's pawn and chip are gone

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
- **WHEN** the viewer confirms the hinted shift
- **THEN** in the move step the ring still marks the hinted square until the viewer moves

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

### Requirement: Game link badge
In the waiting room and during a game, the game's readable identifier SHALL be shown small in the top area. Tapping the identifier of a server game MUST hand out the game's link (the invite link that contains the game id): through the device's share sheet where there is one, otherwise by copying the link and briefly confirming "Linkki kopioitu" / "Link copied". In the waiting room the shared text MUST invite the friend to join ("Liity Labyrintti-peliini"); once the game runs it MUST invite them to watch ("Katso Labyrintti-peliäni"). The link is the same in both cases: an invite link seats a friend in the waiting room or, once the game has started, lets them watch it. If neither sharing nor copying is possible, the link MUST be shown selectable instead. A game played on the device has no link: it MUST show a short label instead of its identifier, "Päivän pulma" / "Daily puzzle" for the daily puzzle and "Oma peli" / "Own game" for any other game on the device, and the label MUST NOT react to a tap. The badge MUST be at least 44 px tall to tap and its text MUST stay on one line on a phone in portrait.

#### Scenario: Share a running game
- **WHEN** Maija taps the game identifier `brave-otters-sing` during a game on a phone with a share sheet
- **THEN** the share sheet opens with the text "Katso Labyrintti-peliäni" and the game's link, which contains `game=brave-otters-sing`

#### Scenario: Share from the waiting room
- **WHEN** the host taps the game identifier in the waiting room
- **THEN** the shared text is "Liity Labyrintti-peliini" with the same game link

#### Scenario: No share sheet
- **WHEN** the player taps the game identifier on a device without a share sheet
- **THEN** the game's link is copied to the clipboard and "Linkki kopioitu" appears briefly

#### Scenario: Neither share nor copy works
- **WHEN** sharing is not available and copying fails
- **THEN** the link is shown in a selectable field

#### Scenario: Daily puzzle label
- **WHEN** the player is in the daily puzzle
- **THEN** the badge reads "Päivän pulma" instead of the `local-daily-…` identifier and tapping it does nothing

#### Scenario: Other game on the device
- **WHEN** the player is in a quick game against bots on the device
- **THEN** the badge reads "Oma peli" instead of the `local-…` identifier
