# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Turn passes after a shift`
- TO: `### Requirement: Turn passes after the move`

## MODIFIED Requirements

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
