# game-session Specification

## Purpose
Get players into a game: quick play from the start screen, a fresh seeded board for every new game, seats on the start corners, and one player per browser tab that survives a page reload.

## Requirements

### Requirement: Quick play
The start screen SHALL offer a single Play action. Play MUST join an existing game that has a free seat, or create a new game when none has. While the connection is being made the player MUST see a waiting state. The server may need up to about a minute to wake up, so the waiting state MUST say it is connecting. If joining fails, the player MUST see a calm message with a retry action, and technical details MUST NOT be shown.

As soon as the start screen opens, the client SHALL ask the server once for its build information, so that a sleeping server starts waking immediately. Until the server has answered, Play MUST be shown disabled, and the screen MUST say that the server is being woken up ("Herätetään palvelinta…"). If this takes more than a few seconds, the screen MUST add that it can take about a minute. When the server answers, Play MUST become available. If the server has not answered within about 90 seconds, Play MUST become available anyway, with a short calm note that the server did not answer yet. The client MUST NOT keep contacting the server after it has answered.

#### Scenario: First player
- **WHEN** a player taps Play and no game has a free seat
- **THEN** a new game is created and the player sees its board

#### Scenario: Second player joins the open game
- **WHEN** a second player taps Play while that game has a free seat
- **THEN** they join the same game and both see the same board

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

### Requirement: Seeded game setup
When a game is created, the server SHALL draw a random seed and set up the original starting board from it. Every player in the game MUST see the identical board. The seed MUST stay on the server and MUST NOT be sent to any client.

#### Scenario: Identical board for everyone
- **WHEN** two players are in the same game
- **THEN** every square shows the same tile with the same rotation for both, and the spare tile is the same

#### Scenario: New games differ
- **WHEN** two new games are created
- **THEN** their boards come from independently drawn seeds

#### Scenario: Seed is private
- **WHEN** the state a client receives is inspected
- **THEN** it contains no seed

### Requirement: Seats and start corners
A game SHALL have at most 4 players. Each joining player MUST get the lowest free seat, 1 to 4. The seats map clockwise to the start corners: seat 1 top-left, seat 2 top-right, seat 3 bottom-right, seat 4 bottom-left. A player who taps Play while every open game is full MUST get a new game.

#### Scenario: Seats in join order
- **WHEN** three players join a new game one after another
- **THEN** they get seats 1, 2 and 3, on the top-left, top-right and bottom-right corners

#### Scenario: Freed seat is reused
- **WHEN** the player in seat 2 leaves and another player joins
- **THEN** the new player gets seat 2

#### Scenario: Full game
- **WHEN** a fifth player taps Play while the only game has 4 players
- **THEN** the fifth player is placed in a different, new game

### Requirement: One player per browser tab
Each browser tab SHALL be its own player: two tabs of the same browser are two players. Reloading a tab during a game MUST return that tab to the same game and seat, as long as its seat is still held.

#### Scenario: Two tabs, two players
- **WHEN** a user taps Play in two tabs of the same browser
- **THEN** the two tabs are two different players in the game

#### Scenario: Reload keeps the seat
- **WHEN** a player reloads the page during a game
- **THEN** they are back in the same game, in the same seat, without tapping Play again
