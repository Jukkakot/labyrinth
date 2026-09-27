# daily-puzzle Specification

## Purpose
TBD - created by archiving change daily-puzzle. Update Purpose after archive.

## Requirements

### Requirement: Same puzzle for everyone on a day
The daily puzzle SHALL be a solo game with no opponents whose board, spare tile and destination
treasure are derived only from the calendar date (the device's local date). Every player on the
same date gets the same puzzle; the next date gives a different one.

#### Scenario: Two players, same day
- **WHEN** two players open the puzzle on 2026-09-27
- **THEN** both get the same board, spare and destination treasure

#### Scenario: Next day
- **WHEN** a player opens the puzzle on 2026-09-28
- **THEN** it differs from the puzzle of 2026-09-27

### Requirement: Goal and score
The player SHALL reach one destination treasure from their start corner, following the normal
shift and move rules; the puzzle is solved as soon as the pawn ends a move on the treasure's tile.
The score is the number of turns taken, the solving turn included. There is no turn clock.

#### Scenario: Solved
- **WHEN** the player ends their move on the treasure's tile in turn 3
- **THEN** the puzzle ends as solved with the score 3 turns

#### Scenario: No time limit
- **WHEN** the player waits several minutes on a turn
- **THEN** nothing happens; the turn is still theirs

### Requirement: Shareable result
The share action SHALL produce a short text with the puzzle's date, the turn count with the best
possible result (and a star when they are equal), one mark per turn in order (a treasure mark on
the solving turn, a plain mark otherwise) and the app's link. It uses the device's share sheet
where there is one and otherwise copies the text and confirms the copy.

#### Scenario: Result text
- **WHEN** the player solved the 2026-09-27 puzzle in 3 turns and the best possible is 2
- **THEN** the text contains the date, "3", "2", the marks ⬜⬜💎 and the link

#### Scenario: No share sheet
- **WHEN** the device has no share sheet and the player taps share
- **THEN** the text is copied to the clipboard and a confirmation is shown

### Requirement: Best possible result
Each puzzle SHALL know its best possible result: the fewest turns in which any sequence of shifts,
rotations and moves reaches the destination. The day's destination is chosen so that this best is
more than one turn whenever the board allows. The best is shown during the puzzle, at its end, on
the start screen with the day's result, and in the shared text.

#### Scenario: Best shown
- **WHEN** the day's puzzle can be solved in 2 turns at best
- **THEN** the game screen shows "paras mahdollinen 2" next to the turn number

#### Scenario: Best reached
- **WHEN** the player solves it in 2 turns
- **THEN** the end says the best possible result was reached

### Requirement: Undo and try again
During the puzzle the player SHALL be able to take back their last shift (with the move after it)
as many times as they like, back to the start; the turn count goes back with it. After solving,
the player can start the same puzzle again from the start. The day's result is the player's best
(fewest turns) solve.

#### Scenario: Undo a move
- **WHEN** the player is in turn 3 before shifting and taps "Peru"
- **THEN** the board, the pawn and the turn count are as they were before the shift of turn 2

#### Scenario: Nothing to undo
- **WHEN** the puzzle has just started
- **THEN** "Peru" is shown disabled

#### Scenario: Try again keeps the best
- **WHEN** the player solved in 4 turns, tries again and solves in 3, then tries again and solves in 5
- **THEN** the day's result is 3 turns

### Requirement: Puzzle game screen with par
During the puzzle the game screen SHALL show the turn number and the best possible result, the
hint and "Peru", and no turn clock or rematch. At the end it shows the turns taken against the best
possible, a share action, "Uudelleen" and a way back to the start screen. Leaving midway needs no
confirmation and keeps the puzzle to continue.

#### Scenario: During the puzzle
- **WHEN** the player is in turn 3 of a puzzle whose best is 2
- **THEN** the screen shows turn 3 and best 2, the hint and "Peru"

#### Scenario: Puzzle end
- **WHEN** the puzzle is solved in 3 turns with a best of 2
- **THEN** the screen says it was solved in 3 turns, best possible 2, and offers share, "Uudelleen" and home, no rematch

### Requirement: Start screen puzzle entry
The start screen SHALL offer the daily puzzle: start it, continue an unfinished one, or, once
solved today, show the day's best result against the best possible with share, and play it again.

#### Scenario: Solved today
- **WHEN** the player returns to the start screen after solving today's puzzle in 3 turns (best 2)
- **THEN** it shows the result 3 and the best 2, a share action, and the puzzle button plays it again
