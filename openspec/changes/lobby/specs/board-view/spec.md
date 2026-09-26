# Spec Delta

## MODIFIED Requirements

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

### Requirement: Game result shown
When the game finishes, the turn line SHALL be replaced by the result: "Voitit!" for the winner, and "Maija voitti" (the winner's nickname) with the winner's pawn shape and colour for everyone else. Shift and move controls MUST NOT be offered any more. A "Uusi peli" button MUST leave the finished game and return to the start screen.

#### Scenario: Viewer wins
- **WHEN** the viewer's move wins the game
- **THEN** the screen says "Voitit!", no controls are offered, and "Uusi peli" is shown

#### Scenario: Someone else wins
- **WHEN** Maija in seat 2 wins and the viewer is in seat 1
- **THEN** the screen says "Maija voitti" with her pawn, and "Uusi peli" returns the viewer to the start screen

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
