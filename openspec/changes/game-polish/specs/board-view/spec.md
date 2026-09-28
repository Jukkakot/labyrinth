## ADDED Requirements

### Requirement: Treasure pickup effect
When any player collects a treasure, every viewer SHALL see a short effect on that square: the
treasure's icon rises and fades while a ring in the collector's colour widens and fades, within a
second. It MUST NOT catch taps or be announced to screen readers (the progress already says it).
With reduced motion the effect is not shown.

#### Scenario: A bot collects
- **WHEN** a bot stops on the dragon's tile and collects it
- **THEN** the dragon icon rises from that square and a ring in the bot's colour widens, and both are gone within a second

### Requirement: Win celebration
When a game ends with a winner while it is being watched or played, the winner's pawn SHALL hop a
few times and small pieces in the players' colours SHALL burst once from its square, within about a
second. The daily puzzle's solving celebrates the player's pawn the same way. Opening an already
finished game shows no celebration. With reduced motion nothing hops or flies.

#### Scenario: Someone wins
- **WHEN** Pekka's move wins the game while Maija watches the board
- **THEN** Pekka's pawn hops and pieces burst from his square once

#### Scenario: Reduced motion
- **WHEN** the viewer prefers reduced motion and the game ends
- **THEN** no pawn hops and no pieces fly

### Requirement: Spare turns smoothly
Pressing the rotate button SHALL turn the spare tile a quarter turn clockwise with a short rotation
instead of a jump, always clockwise (also from three quarters to a full turn). With reduced motion
it turns at once.

#### Scenario: Four turns
- **WHEN** the viewer presses the rotate button four times
- **THEN** the spare turns clockwise each time and ends as it started, without spinning back
