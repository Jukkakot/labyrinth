# daily-puzzle Specification

## Purpose
TBD - created by archiving change daily-puzzle. Update Purpose after archive.

## Requirements

### Requirement: Same puzzle for everyone on a day
The daily puzzle SHALL be a solo game with no opponents whose board, spare tile and treasure
stack are derived only from the calendar date (the device's local date). Every player on the same
date gets the same puzzle; the next date gives a different one.

#### Scenario: Two players, same day
- **WHEN** two players open the puzzle on 2026-09-27
- **THEN** both get the same board, spare and treasures in the same order

#### Scenario: Next day
- **WHEN** a player opens the puzzle on 2026-09-28
- **THEN** it differs from the puzzle of 2026-09-27

### Requirement: Goal and score
The player SHALL find 3 treasures in the order dealt and then return to their start corner,
following the normal shift and move rules. The score is the number of turns taken, counting the
turn in which the player reaches home. There is no turn clock.

#### Scenario: Solved
- **WHEN** the player reaches home in turn 9 after finding the third treasure
- **THEN** the puzzle ends as solved with the score 9 turns

#### Scenario: No time limit
- **WHEN** the player waits several minutes on a turn
- **THEN** nothing happens; the turn is still theirs

### Requirement: One attempt per day
Each date SHALL have one scored attempt on the device. An unfinished attempt is saved after every
step and is continued, not restarted, from the start screen, also after leaving the game, a
reload or going offline. Once solved, the start screen shows the result and the puzzle button is
disabled until the next date.

#### Scenario: Leaving midway
- **WHEN** the player leaves the puzzle in turn 4 and taps the puzzle button again
- **THEN** the game continues in turn 4 with the same board

#### Scenario: Already solved
- **WHEN** the player returns to the start screen after solving today's puzzle
- **THEN** the puzzle button is disabled and today's result (turn count) is shown with a share action

#### Scenario: Quick game in between
- **WHEN** the player starts and leaves a quick game against bots while a puzzle is unfinished
- **THEN** the puzzle is still continued where it was left

### Requirement: Puzzle game screen
During the puzzle the game screen SHALL show the current turn number, and SHALL NOT show the hint,
a turn clock or a rematch. At the end it shows the result (turn count), a share action and a way
back to the start screen.

#### Scenario: During the puzzle
- **WHEN** the player is in turn 3 of the puzzle
- **THEN** the screen shows turn 3 and no hint button

#### Scenario: Puzzle end
- **WHEN** the puzzle is solved
- **THEN** the screen says it was solved in N turns and offers share and home, no rematch

### Requirement: Shareable result
The share action SHALL produce a short text with the puzzle's date, the turn count, one mark per
turn in order (a treasure mark on turns where a treasure was found, a home mark on the last turn,
a plain mark otherwise) and the app's link. It uses the device's share sheet where there is one
and otherwise copies the text and confirms the copy.

#### Scenario: Result text
- **WHEN** the player solved the 2026-09-27 puzzle in 6 turns, finding treasures in turns 2, 3 and 5
- **THEN** the text contains the date, "6", the marks ⬜💎💎⬜💎🏠 and the link

#### Scenario: No share sheet
- **WHEN** the device has no share sheet and the player taps share
- **THEN** the text is copied to the clipboard and a confirmation is shown
