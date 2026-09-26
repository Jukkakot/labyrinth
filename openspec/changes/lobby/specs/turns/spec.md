# Spec Delta

## MODIFIED Requirements

### Requirement: Current player
A started game SHALL always have exactly one current player until it finishes. In the waiting room nobody has the turn. When the game starts, the first current player MUST be chosen at random among the seated players, each equally likely. When the current player leaves the game, whether they leave themselves, are kicked or are removed after a long disconnect, and the game goes on, the turn MUST pass to the next seated player clockwise.

#### Scenario: Nobody has the turn before the start
- **WHEN** two players sit in a waiting room
- **THEN** neither of them is the current player

#### Scenario: First player starts
- **WHEN** a game with seats 1, 2 and 3 starts
- **THEN** one of the three seats, chosen at random, is the current player and must shift

#### Scenario: Current player leaves
- **WHEN** the current player in seat 2 leaves while seats 1 and 3 are taken
- **THEN** the player in seat 3 becomes the current player

#### Scenario: Current player is kicked
- **WHEN** the current player in seat 1 is kicked while seats 2 and 3 are taken
- **THEN** the player in seat 2 becomes the current player and must shift

### Requirement: Turn passes after the move
A turn SHALL have two steps: first the current player shifts, then the same player moves (or stays). The turn MUST NOT pass after the shift. After the current player's move is accepted, the turn SHALL pass to the next seated player clockwise by seat: 1 → 2 → 3 → 4 → 1, skipping empty seats, and the next turn starts with the shift step. When the current player leaves during either step and the game goes on, the next player's turn starts with the shift step.

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
- **WHEN** seats 1, 2 and 3 are taken and the player in seat 1 leaves after shifting but before moving
- **THEN** the player in seat 2 is the current player and must shift

### Requirement: Only the current player acts
A game action from a player who is not the current player SHALL be rejected with `NOT_YOUR_TURN`. An action from a connection without a seat MUST be rejected with `NOT_SEATED`. A shift or move sent in the waiting room MUST be rejected with `WRONG_PHASE`. A rejected action MUST NOT change the game.

#### Scenario: Out of turn
- **WHEN** the player in seat 2 sends a shift while seat 1 is the current player
- **THEN** it is rejected with `NOT_YOUR_TURN` and the board is unchanged

#### Scenario: Before the start
- **WHEN** a player sends a shift in the waiting room
- **THEN** it is rejected with `WRONG_PHASE` and the board is unchanged

### Requirement: Turn time limit
Every turn of a started game SHALL have a time limit of 60 seconds for both steps together, counted from the moment the turn starts; the first turn starts when the game starts. Every player MUST be able to see how much of the current turn's time is left. When the time is up nothing happens automatically: the current player MAY still shift and move, and the turn passes as usual. Once the time is up, the turn stays expired until the next turn starts. The waiting room has no clock.

#### Scenario: Clock starts with the turn
- **WHEN** the turn passes from seat 1 to seat 2
- **THEN** seat 2 has 60 seconds, and every player sees the time counting down

#### Scenario: Clock starts with the game
- **WHEN** the host starts the game
- **THEN** the first player's 60 seconds start at once

#### Scenario: Late but allowed
- **WHEN** the player in seat 1 shifts and moves after their 60 seconds are up and nobody has kicked them
- **THEN** both commands are accepted and the turn passes to the next player with a fresh 60 seconds

#### Scenario: Alone in the game
- **WHEN** a player waits alone in the waiting room for more than 60 seconds
- **THEN** no turn time runs out, because the waiting room has no clock

#### Scenario: Second player arrives
- **WHEN** a second player joins the waiting room and they wait there for several minutes
- **THEN** no clock runs and nobody can be kicked until the host starts the game

### Requirement: Last player standing wins
When players leave a started game and exactly one seated player remains, that player SHALL win and the game MUST be finished at once, exactly as if they had returned home.

#### Scenario: Opponent kicked
- **WHEN** seats 1 and 2 are playing and seat 1 kicks seat 2
- **THEN** seat 1 wins and the game is finished

#### Scenario: Two of three leave
- **WHEN** seats 1, 2 and 3 are playing, and seats 2 and 3 leave one after the other
- **THEN** the game continues after the first departure, and seat 1 wins after the second

#### Scenario: Opponent leaves before anyone shifted
- **WHEN** a game with seats 1 and 2 has just started and seat 2 leaves before anyone has shifted
- **THEN** seat 1 wins and the game is finished
