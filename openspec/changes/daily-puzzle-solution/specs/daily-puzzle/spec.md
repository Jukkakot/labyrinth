## MODIFIED Requirements

### Requirement: Puzzle game screen with par
During the puzzle the game screen SHALL show the turn number and the best possible result, the
hint and "Peru", and no turn clock or rematch. At the end it shows the turns taken against the best
possible, a share action, "Uudelleen", "Näytä paras reitti" and a way back to the start screen.
Leaving midway needs no confirmation and keeps the puzzle to continue.

#### Scenario: During the puzzle
- **WHEN** the player is in turn 3 of a puzzle whose best is 2
- **THEN** the screen shows turn 3 and best 2, the hint and "Peru"

#### Scenario: Puzzle end
- **WHEN** the puzzle is solved in 3 turns with a best of 2
- **THEN** the screen says it was solved in 3 turns, best possible 2, and offers share, "Uudelleen", "Näytä paras reitti" and home, no rematch

## ADDED Requirements

### Requirement: Puzzle hint follows a best route
In the puzzle the hint SHALL give the next step of a route that reaches the destination in the
fewest turns from the current position: on the shift step the shift and rotation (previewed) and
the square to walk to after it; on the move step the square to walk to. When no route within two
turns exists from the current position, the ordinary hint is given instead.

#### Scenario: Hint at the start
- **WHEN** the player asks for a hint at the start of a puzzle whose best is 2
- **THEN** the hinted shift is previewed and the ringed square is one from which the destination can be reached in the next turn

#### Scenario: Following the hint solves at par
- **WHEN** the player follows the hint on every step of a puzzle whose best is 2
- **THEN** the puzzle is solved in 2 turns

#### Scenario: Hint on the move step
- **WHEN** the player has shifted without a hint and then asks for one
- **THEN** the ringed square is one from which the destination can be reached in the fewest further turns

### Requirement: Best route replay
After solving, "Näytä paras reitti" SHALL show on the board a solution in the best possible number
of turns from the puzzle's start, one step at a time: the start, then each turn's shift (with the
push marker) and walk (with the route line). The player steps forward and back and closes the
replay to return to the end screen. The replay changes no result.

#### Scenario: Replay of a two-turn best
- **WHEN** the player opens the best route of a puzzle whose best is 2
- **THEN** it has five steps (start, shift 1, walk 1, shift 2, walk 2) and the last step ends on the destination

#### Scenario: Closing the replay
- **WHEN** the player closes the replay
- **THEN** the board shows the player's own finished game again with the end screen's actions
