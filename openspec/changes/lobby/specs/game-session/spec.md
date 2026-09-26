# Spec Delta

## MODIFIED Requirements

### Requirement: Quick play
The start screen SHALL offer a single Play action. Play MUST seat the player in the waiting room of a public game that has not started and has a free seat, or create a new public game with the player as its host when none has. Play needs a valid nickname. While the connection is being made the player MUST see a waiting state. The server may need up to about a minute to wake up, so the waiting state MUST say it is connecting. If joining fails, the player MUST see a calm message with a retry action, and technical details MUST NOT be shown.

As soon as the start screen opens, the client SHALL ask the server once for its build information, so that a sleeping server starts waking immediately. Until the server has answered, Play MUST be shown disabled, and the screen MUST say that the server is being woken up ("Herätetään palvelinta…"). If this takes more than a few seconds, the screen MUST add that it can take about a minute. When the server answers, Play MUST become available. If the server has not answered within about 90 seconds, Play MUST become available anyway, with a short calm note that the server did not answer yet. The client MUST NOT keep contacting the server after it has answered.

#### Scenario: First player
- **WHEN** a player taps Play and no public game is waiting with a free seat
- **THEN** a new public game is created and the player sees its waiting room as the host

#### Scenario: Second player joins the open game
- **WHEN** a second player taps Play while that game is waiting with a free seat
- **THEN** they join the same waiting room and both see each other listed

#### Scenario: Slow server
- **WHEN** the server takes several seconds to answer
- **THEN** the player sees a "connecting" state instead of an empty or frozen screen

#### Scenario: Join fails
- **WHEN** the server cannot be reached
- **THEN** the player sees a short localized message and a retry button

#### Scenario: Sleeping server is woken on open
- **WHEN** the start screen opens and the server is asleep
- **THEN** a request to the server is sent immediately, Play is shown disabled, and the screen says "Herätetään palvelinta…"

#### Scenario: Server wakes up
- **WHEN** the server answers while the start screen is open
- **THEN** the waking message disappears and Play can be tapped

#### Scenario: Awake server
- **WHEN** the server is already awake
- **THEN** Play becomes available almost at once, without a noticeable waiting message

#### Scenario: Server does not answer
- **WHEN** the server has not answered after about 90 seconds
- **THEN** Play becomes available with a calm note that the server did not answer yet, and tapping it follows the normal connecting and join-error flow

### Requirement: Seats and start corners
A game SHALL have at most 4 players. Seats are taken only in the waiting room: each joining player MUST get the lowest free seat, 1 to 4. The seats map clockwise to the start corners: seat 1 top-left, seat 2 top-right, seat 3 bottom-right, seat 4 bottom-left. Players keep the seat they had in the waiting room when the game starts. A player who taps Play while every waiting public game is full MUST get a new game.

#### Scenario: Seats in join order
- **WHEN** three players join a new game's waiting room one after another
- **THEN** they get seats 1, 2 and 3, on the top-left, top-right and bottom-right corners

#### Scenario: Full game
- **WHEN** a fifth player taps Play while the only waiting game has 4 players
- **THEN** the fifth player is placed in a different, new game

#### Scenario: Freed seat is reused
- **WHEN** the player in seat 2 leaves the waiting room and another player joins
- **THEN** the new player gets seat 2

#### Scenario: Seats kept at the start
- **WHEN** players in seats 1 and 3 start the game
- **THEN** their pawns stand on the top-left and bottom-right corners

### Requirement: Finished games are closed
Quick play, the games list and invite links SHALL only place a player in a game that is still in its waiting room. A started or finished game MUST NOT accept new players. Players already in a finished game MAY stay and look at the final board until they leave.

#### Scenario: Only game is finished
- **WHEN** a player taps Play while the only game with free seats has finished
- **THEN** the player is placed in a new game

#### Scenario: Only game is running
- **WHEN** a player taps Play while the only game with free seats has started
- **THEN** the player is placed in a new game

### Requirement: Leaving the game
A player SHALL be able to leave a running game on purpose with a leave action in the game screen's top bar, after confirming it ("Poistutaanko pelistä? Nappulasi ja aarteesi poistuvat pelistä." with "Poistu" and "Peru"). A player who leaves a running game, whether they leave themselves, are kicked or are removed after a long disconnect, SHALL be removed from the game completely: their pawn disappears from the board, their treasure stack and found treasures are gone, and their seat stays empty for the rest of the game. The other players MUST see who left. The leaving player MUST be back on the start screen at once, even if the server is slow to confirm. In a finished game the leave action MUST NOT ask for confirmation, and a player who leaves a finished game MUST NOT change its result.

#### Scenario: Player leaves mid-game
- **WHEN** the player in seat 2 leaves while seats 1 and 3 keep playing
- **THEN** seat 2's pawn and progress disappear for everyone, and the other players see that seat 2's player left

#### Scenario: Confirm before leaving
- **WHEN** a player taps the leave action during a running game
- **THEN** nothing happens until they confirm with "Poistu", and "Peru" keeps them in the game

#### Scenario: Leaving returns at once
- **WHEN** a player confirms leaving and the server's confirmation is delayed
- **THEN** the player sees the start screen immediately, and a reload does not bring them back into the game

#### Scenario: Leaving a finished game
- **WHEN** a player leaves after the game has finished
- **THEN** the winner and the finished state stay as they were
