## MODIFIED Requirements

### Requirement: Game result shown
When the game finishes, the turn line SHALL be replaced by the result: "Voitit!" for the winner, and "Maija voitti" (the winner's nickname) with the winner's pawn shape and colour for everyone else. Shift and move controls MUST NOT be offered any more. A seated player MUST be offered "Pelaa uudelleen" as the primary action (see the rematch requirement of game-session) and "Alkuun", which leaves the finished game and returns to the start screen.

#### Scenario: Viewer wins
- **WHEN** the viewer's move wins the game
- **THEN** the screen says "Voitit!", no step controls are offered, and "Pelaa uudelleen" and "Alkuun" are shown

#### Scenario: Someone else wins
- **WHEN** Maija in seat 2 wins and the viewer is in seat 1
- **THEN** the screen says "Maija voitti" with her pawn, and "Alkuun" returns the viewer to the start screen
