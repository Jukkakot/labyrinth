## ADDED Requirements

### Requirement: No turns after the game ends
When a player wins, their turn SHALL be the last one: the turn MUST NOT pass to anyone after the winning move, and players leaving a finished game MUST NOT start a new turn.

#### Scenario: Winning move
- **WHEN** the player in seat 1 wins with their move while seat 2 is taken
- **THEN** the turn does not pass to seat 2 and nobody can act

#### Scenario: Leaving after the end
- **WHEN** the winner leaves a finished game
- **THEN** the game stays finished and no turn starts
