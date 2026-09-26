## ADDED Requirements

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
The game screen SHALL show, for every seated player, their pawn shape and colour and how many treasures they have found out of their card count (for example 2/6). For the viewer it MUST also show their current target's icon with its localized name, or a home marker when heading home. It MUST fit the reference screen together with the board without scrolling.

#### Scenario: Progress strip
- **WHEN** seats 1 and 2 have found 2 and 0 of their 6 treasures and the viewer is in seat 1 with the dragon as target
- **THEN** the screen shows seat 1 with 2/6 and the dragon, and seat 2 with 0/6 and no target

### Requirement: Collected treasure announced
When the viewer collects a treasure, the game screen SHALL briefly show which treasure was found ("Löysit: lohikäärme"). When another player collects one, their found count MUST update.

#### Scenario: Viewer collects
- **WHEN** the viewer's move collects the dragon
- **THEN** a short message names the dragon and the target highlight moves to the next target

### Requirement: Game result shown
When the game finishes, the turn line SHALL be replaced by the result: "Voitit!" for the winner, and "Pelaaja 2 voitti" with the winner's pawn shape and colour for everyone else. Shift and move controls MUST NOT be offered any more. A "Uusi peli" button MUST leave the finished game and return to the start screen.

#### Scenario: Viewer wins
- **WHEN** the viewer's move wins the game
- **THEN** the screen says "Voitit!", no controls are offered, and "Uusi peli" is shown

#### Scenario: Someone else wins
- **WHEN** the player in seat 2 wins and the viewer is in seat 1
- **THEN** the screen says "Pelaaja 2 voitti" with player 2's pawn, and "Uusi peli" returns the viewer to the start screen
