## MODIFIED Requirements

### Requirement: Sounds
With sounds on, a short, quiet sound SHALL play when the viewer's turn begins in a game with other
players, when the viewer collects a treasure, when a shift lands in a game the viewer plays in, and
when the game ends (a rising tune when the viewer wins or solves the daily puzzle, a short lower one
when someone else wins). With sounds off, the app plays no sound. A
spectator and the daily puzzle (always the player's turn) get no turn sound.

#### Scenario: Turn sound
- **WHEN** sounds are on and the turn passes from a bot to Maija
- **THEN** a short sound plays once

#### Scenario: Winning tune
- **WHEN** sounds are on and Maija's move wins the game
- **THEN** a rising three-note tune plays once
