## REMOVED Requirements

### Requirement: Shareable result
**Reason**: Refinement round 1 trims the start screen and the puzzle end; nobody used the share.
**Migration**: None. The day's result stays visible on the start screen and at the puzzle's end.

## MODIFIED Requirements

### Requirement: Best possible result
Each puzzle SHALL know its best possible result: the fewest turns in which any sequence of shifts,
rotations and moves reaches the destination. The day's destination is chosen so that this best is
more than one turn whenever the board allows. The best is shown during the puzzle, at its end, and
on the start screen with the day's result.

#### Scenario: Best shown
- **WHEN** the day's puzzle can be solved in 2 turns at best
- **THEN** the game screen shows "paras mahdollinen 2" next to the turn number

#### Scenario: Best reached
- **WHEN** the player solves it in 2 turns
- **THEN** the end says the best possible result was reached

### Requirement: Puzzle game screen with par
During the puzzle the game screen SHALL show the turn number and the best possible result, the
hint and "Peru", and no turn clock or rematch. At the end it shows the turns taken against the best
possible, "Uudelleen", "Näytä paras reitti" and a way back to the start screen, and no share
action. Leaving midway needs no confirmation and keeps the puzzle to continue.

#### Scenario: During the puzzle
- **WHEN** the player is in turn 3 of a puzzle whose best is 2
- **THEN** the screen shows turn 3 and best 2, the hint and "Peru"

#### Scenario: Puzzle end
- **WHEN** the puzzle is solved in 3 turns with a best of 2
- **THEN** the screen says it was solved in 3 turns, best possible 2, and offers "Uudelleen", "Näytä paras reitti" and home, no share and no rematch

### Requirement: Start screen puzzle entry
The start screen SHALL offer the daily puzzle: start it, continue an unfinished one, or, once
solved today, show the day's best result against the best possible and play it again. It MUST NOT
offer a share action.

#### Scenario: Solved today
- **WHEN** the player returns to the start screen after solving today's puzzle in 3 turns (best 2)
- **THEN** it shows the result 3 and the best 2, no share action, and the puzzle button plays it again
