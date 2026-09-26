# turns Specification

## Purpose
Say whose turn it is and who may act, so every command can be checked against the turn and every player can see what is happening.

## Requirements

### Requirement: Current player
A game with at least one seated player SHALL always have exactly one current player. Until the waiting room exists, the first player to take a seat becomes the current player. When the current player leaves the game, the turn MUST pass to the next seated player clockwise. A game with no players has no current player.

#### Scenario: First player starts
- **WHEN** the first player joins a new game
- **THEN** that player is the current player

#### Scenario: Current player leaves
- **WHEN** the current player in seat 2 leaves while seats 1 and 3 are taken
- **THEN** the player in seat 3 becomes the current player

### Requirement: Turn passes after the move
A turn SHALL have two steps: first the current player shifts, then the same player moves (or stays). The turn MUST NOT pass after the shift. After the current player's move is accepted, the turn SHALL pass to the next seated player clockwise by seat: 1 → 2 → 3 → 4 → 1, skipping empty seats, and the next turn starts with the shift step. A player who is alone keeps the turn and starts again with a shift. When the current player leaves during either step, the next player's turn starts with the shift step.

#### Scenario: Shift does not end the turn
- **WHEN** the player in seat 1 shifts
- **THEN** the player in seat 1 is still the current player and must now move

#### Scenario: Two players alternate
- **WHEN** seats 1 and 3 are taken and the player in seat 1 shifts and then moves
- **THEN** the player in seat 3 is the current player and must shift

#### Scenario: Dropped player keeps their place
- **WHEN** the next player in turn order has a dropped connection but still holds their seat
- **THEN** the turn still passes to them

#### Scenario: Current player leaves while moving
- **WHEN** seats 1 and 2 are taken and the player in seat 1 leaves after shifting but before moving
- **THEN** the player in seat 2 is the current player and must shift

### Requirement: Only the current player acts
A game action from a player who is not the current player SHALL be rejected with `NOT_YOUR_TURN`. An action from a connection without a seat MUST be rejected with `NOT_SEATED`. A rejected action MUST NOT change the game.

#### Scenario: Out of turn
- **WHEN** the player in seat 2 sends a shift while seat 1 is the current player
- **THEN** it is rejected with `NOT_YOUR_TURN` and the board is unchanged
