# Spec Delta

## MODIFIED Requirements

### Requirement: Current player
A game with at least one seated player SHALL always have exactly one current player. Until the waiting room exists, the first player to take a seat becomes the current player. When the current player leaves the game, whether they leave themselves, are kicked or are removed after a long disconnect, the turn MUST pass to the next seated player clockwise. A game with no players has no current player.

#### Scenario: First player starts
- **WHEN** the first player joins a new game
- **THEN** that player is the current player

#### Scenario: Current player leaves
- **WHEN** the current player in seat 2 leaves while seats 1 and 3 are taken
- **THEN** the player in seat 3 becomes the current player

#### Scenario: Current player is kicked
- **WHEN** the current player in seat 1 is kicked while seats 2 and 3 are taken
- **THEN** the player in seat 2 becomes the current player and must shift

### Requirement: Turn passes after the move
A turn SHALL have two steps: first the current player shifts, then the same player moves (or stays). The turn MUST NOT pass after the shift. After the current player's move is accepted, the turn SHALL pass to the next seated player clockwise by seat: 1 → 2 → 3 → 4 → 1, skipping empty seats, and the next turn starts with the shift step. A player who is alone keeps the turn and starts again with a shift. When the current player leaves during either step and the game goes on, the next player's turn starts with the shift step.

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

## ADDED Requirements

### Requirement: Turn time limit
Every turn SHALL have a time limit of 60 seconds for both steps together, counted from the moment the turn starts. Every player MUST be able to see how much of the current turn's time is left. When the time is up nothing happens automatically: the current player MAY still shift and move, and the turn passes as usual. Once the time is up, the turn stays expired until the next turn starts. Until the waiting room exists, the clock MUST only run while at least two players are seated: a lone player's turn has no time limit, and when a second player sits down, the current turn gets its full 60 seconds from that moment.

#### Scenario: Clock starts with the turn
- **WHEN** the turn passes from seat 1 to seat 2
- **THEN** seat 2 has 60 seconds, and every player sees the time counting down

#### Scenario: Late but allowed
- **WHEN** the player in seat 1 shifts and moves after their 60 seconds are up and nobody has kicked them
- **THEN** both commands are accepted and the turn passes to the next player with a fresh 60 seconds

#### Scenario: Alone in the game
- **WHEN** a player is alone in the game for more than 60 seconds
- **THEN** their turn does not expire

#### Scenario: Second player arrives
- **WHEN** a second player sits down while the first player's turn is running
- **THEN** the first player's turn gets 60 seconds from that moment

### Requirement: Kicking a slow player
Once the current player's turn time is up, any other seated player SHALL be able to kick the current player out of the game. A kick names the seat to kick and MUST be rejected, without changing the game, when:
- the sender has no seat: `NOT_SEATED`;
- the game has finished: `WRONG_PHASE`;
- the named seat is not the current player, or is the sender's own seat: `NOT_KICKABLE`;
- the current player's time is not up yet: `TURN_NOT_EXPIRED`.

An accepted kick MUST remove the kicked player from the game exactly like leaving, and the kicked player MUST be told that they were removed because their turn time ran out. A player whose connection has dropped can be kicked in the same way.

#### Scenario: Kick after the time is up
- **WHEN** seat 1's turn time is up and the player in seat 2 kicks seat 1
- **THEN** seat 1 is removed from the game with their pawn and treasures, and the next player's turn starts

#### Scenario: Too early
- **WHEN** the player in seat 2 kicks seat 1 while seat 1 still has time left
- **THEN** the kick is rejected with `TURN_NOT_EXPIRED` and nothing changes

#### Scenario: Turn already passed
- **WHEN** the player in seat 2 kicks seat 1 just after seat 1 finished their turn and seat 3 became the current player
- **THEN** the kick is rejected with `NOT_KICKABLE` and nothing changes

#### Scenario: Kicking yourself
- **WHEN** the current player, whose time is up, kicks their own seat
- **THEN** the kick is rejected with `NOT_KICKABLE`

#### Scenario: Kicking a disconnected player
- **WHEN** the current player's connection has dropped, their time is up, and another player kicks them
- **THEN** they are removed at once, without waiting for the five-minute disconnect limit

### Requirement: Last player standing wins
When players leave a game that is under way and exactly one seated player remains, that player SHALL win and the game MUST be finished at once, exactly as if they had returned home. Until the waiting room exists, a game is under way once a shift has been made while at least two players were seated; a lone player whose only opponent leaves before that keeps playing alone.

#### Scenario: Opponent kicked
- **WHEN** seats 1 and 2 have both played a turn and seat 1 kicks seat 2
- **THEN** seat 1 wins and the game is finished

#### Scenario: Two of three leave
- **WHEN** seats 1, 2 and 3 are playing, and seats 2 and 3 leave one after the other
- **THEN** the game continues after the first departure, and seat 1 wins after the second

#### Scenario: Opponent leaves before anyone shifted
- **WHEN** a second player joins a lone player and leaves again before anyone has shifted
- **THEN** the first player keeps playing and nobody wins
