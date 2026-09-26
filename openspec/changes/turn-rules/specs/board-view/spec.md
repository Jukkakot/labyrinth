# Spec Delta

## MODIFIED Requirements

### Requirement: Whose turn is shown
The game screen SHALL always show whose turn it is and which step it is in. On your own turn it MUST say what to do: push a tile ("Sinun vuorosi – työnnä laatta") or move your pawn ("Sinun vuorosi – siirrä nappulaa"). On someone else's turn it MUST name that player, show their pawn shape and colour, and say whether they are pushing or moving ("Pelaaja 2 työntää" / "Pelaaja 2 siirtää"). While the turn clock runs, the turn line MUST show the time left as minutes and seconds (for example `0:42`), emphasised during the last 10 seconds without relying on colour alone, and "Aika loppui" once the time is up. When the current player's connection has dropped, the turn line MUST say so.

#### Scenario: Own turn
- **WHEN** it is the viewer's turn and they have not shifted yet
- **THEN** the turn line says it is their turn and that they should push a tile

#### Scenario: Own move step
- **WHEN** the viewer has shifted
- **THEN** the turn line says it is their turn and that they should move their pawn

#### Scenario: Other player's turn
- **WHEN** it is the turn of the player in seat 2 and the viewer is in seat 1
- **THEN** the turn line names player 2 with their pawn shape and says whether they are pushing or moving, and the shift controls are disabled

#### Scenario: Countdown
- **WHEN** the current turn has 42 seconds left
- **THEN** every player's turn line shows `0:42`, and it keeps counting down

#### Scenario: Time up
- **WHEN** the current player's time is up
- **THEN** the turn line shows "Aika loppui" instead of the countdown

#### Scenario: Current player disconnected
- **WHEN** it is seat 2's turn and seat 2's connection has dropped
- **THEN** the turn line says that player 2's connection is lost

### Requirement: Player progress shown
The game screen SHALL show, for every seated player, their pawn shape and colour and how many treasures they have found out of their card count (for example 2/6). For the viewer it MUST also show their current target's icon with its localized name, or a home marker when heading home. A player whose connection has dropped MUST be marked as disconnected with an icon and a dimmed chip, and the accessible text MUST say so. It MUST fit the reference screen together with the board without scrolling.

#### Scenario: Progress strip
- **WHEN** seats 1 and 2 have found 2 and 0 of their 6 treasures and the viewer is in seat 1 with the dragon as target
- **THEN** the screen shows seat 1 with 2/6 and the dragon, and seat 2 with 0/6 and no target

#### Scenario: Disconnected player
- **WHEN** seat 2's connection has dropped
- **THEN** seat 2's chip is dimmed and shows a disconnected icon, and its accessible text says the connection is lost

## ADDED Requirements

### Requirement: Kick control
When the current player's turn time is up, every other seated player SHALL be offered, in place of the step controls under the board, a "Poista pelaaja N" button that names the slow player. Tapping it MUST ask for confirmation ("Poistetaanko pelaaja N pelistä?" with "Poista" and "Peru") before the kick is sent. The control MUST NOT be offered to the current player, before the time is up, or in a finished game. While the kick waits for the server, the buttons MUST show that it is pending. If the turn passes before the kick is confirmed, the control MUST disappear.

#### Scenario: Offer after the time is up
- **WHEN** seat 1's time is up and the viewer is in seat 2
- **THEN** the viewer sees "Poista pelaaja 1" under the board

#### Scenario: Confirm before kicking
- **WHEN** the viewer taps "Poista pelaaja 1"
- **THEN** nothing is sent until they tap "Poista" in the confirmation, and "Peru" returns to the button

#### Scenario: Not for the slow player
- **WHEN** the viewer is the current player and their time is up
- **THEN** they see their normal step controls and no kick control

#### Scenario: Turn ends meanwhile
- **WHEN** the slow player finishes their turn while the viewer is looking at the confirmation
- **THEN** the kick control disappears and nothing is sent

### Requirement: Departures announced
When another player leaves the running game, for any reason, the game screen SHALL briefly show that they left ("Pelaaja 2 poistui pelistä") in the shared status message area.

#### Scenario: Someone leaves
- **WHEN** the player in seat 2 is kicked while the viewer is in seat 3
- **THEN** the viewer sees "Pelaaja 2 poistui pelistä" and seat 2's pawn and chip are gone
