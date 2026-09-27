## MODIFIED Requirements

### Requirement: Starting the game
Only the host SHALL be able to start the game, only in the waiting room, and only with at least 2
players seated, counting bots. A start MUST be rejected, without changing the game, when:
- the sender has no seat: `NOT_SEATED`;
- the sender is not the host: `NOT_HOST`;
- the game is no longer in its waiting room: `WRONG_PHASE`;
- fewer than 2 players are seated: `NOT_ENOUGH_PLAYERS`.

An accepted start MUST deal the treasure cards to the seated players, bots included, give the
first turn to the host, and take every player from the waiting room to the board at
once. From then on the game MUST NOT accept new players and MUST NOT be listed.

#### Scenario: Host starts
- **WHEN** the host starts with 3 players seated
- **THEN** every player sees the board, each has 8 treasure cards, and the host has the turn with a running clock

#### Scenario: Host starts against bots
- **WHEN** the host starts with two bots seated and no other people
- **THEN** the host and each bot have 8 treasure cards, and the game begins

#### Scenario: Guest tries to start
- **WHEN** a player who is not the host sends a start
- **THEN** it is rejected with `NOT_HOST` and the waiting room is unchanged

#### Scenario: Host alone tries to start
- **WHEN** the host sends a start while alone
- **THEN** it is rejected with `NOT_ENOUGH_PLAYERS`

#### Scenario: Start twice
- **WHEN** the host sends a start after the game has started
- **THEN** it is rejected with `WRONG_PHASE` and nothing changes

#### Scenario: No joining after the start
- **WHEN** someone tries to join a started game by its invite link
- **THEN** they are not seated
