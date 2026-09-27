# pawn-looks Specification

## Purpose
The four pawns (colour + shape pairs), the player's own choice, how pawns are given out in online
and device games, and changing one in the waiting room.

## Requirements

### Requirement: Four pawns
There SHALL be four pawns, each a colour-blind-safe colour paired with a shape: 1 blue circle,
2 orange square, 3 green triangle, 4 pink diamond. A colour is never shown with another shape. In
one game every seated player (person or bot) has a different pawn.

#### Scenario: Different pawns
- **WHEN** four players sit in a game
- **THEN** all four pawns are different

### Requirement: The player's own pawn choice
The start screen SHALL let the player pick one of the four pawns. The choice is kept on the device
and used for every game they start or join afterwards, until they pick another. Without a stored
choice the player has no preference.

#### Scenario: Remembered
- **WHEN** Maija picks the green triangle and reloads the page
- **THEN** the start screen still shows the green triangle chosen

### Requirement: Pawns given out in an online game
When a person takes a seat in a game on the server, they SHALL get their preferred pawn if nobody
in the game has it; otherwise the pawn numbered like their seat if free; otherwise the lowest-
numbered free pawn. A bot SHALL get the pawn numbered like its seat if free, otherwise the lowest-
numbered free pawn. A player keeps their pawn for the rest of the game, including after a
reconnect.

#### Scenario: Preferred pawn free
- **WHEN** Maija prefers the green triangle and joins a waiting room where only the blue circle is taken
- **THEN** Maija sits in seat 2 with the green triangle

#### Scenario: Preferred pawn taken
- **WHEN** Maija in seat 1 has the green triangle and Pekka, who also prefers it, joins seat 2
- **THEN** Pekka gets the orange square, seat 2's own pawn

#### Scenario: Seat's pawn taken too
- **WHEN** Maija in seat 1 has the orange square and Pekka, preferring her pawn, joins seat 2
- **THEN** Pekka gets the blue circle, the lowest-numbered free pawn

#### Scenario: No preference
- **WHEN** a player without a stored choice joins seat 2 and the orange square is free
- **THEN** they get the orange square, as before this change

### Requirement: Changing the pawn in the waiting room
In the waiting room a seated person SHALL be able to change their pawn to any pawn no other player
in the game holds; the waiting room shows all four, the taken ones disabled. The new pawn becomes
their stored choice as well. Changing MUST be rejected, without changing the game, when:
- the sender has no seat: `NOT_SEATED`;
- the game is no longer in its waiting room: `WRONG_PHASE`;
- another player holds that pawn: `LOOK_TAKEN`.
Choosing the pawn one already has changes nothing and is accepted.

#### Scenario: Change to a free pawn
- **WHEN** Maija, in the waiting room with the blue circle, taps the pink diamond that nobody has
- **THEN** every player sees Maija's pawn as the pink diamond

#### Scenario: Taken pawn
- **WHEN** Maija sends a change to the orange square that Robo holds
- **THEN** it is rejected with `LOOK_TAKEN` and nothing changes

#### Scenario: After the start
- **WHEN** Maija sends a change after the game started
- **THEN** it is rejected with `WRONG_PHASE`

### Requirement: Pawns in games on the device
A quick game against bots and the daily puzzle SHALL give the player their preferred pawn (the
blue circle without a preference); each bot gets the pawn numbered like its seat if free, otherwise
the lowest-numbered free pawn. The pawns stay the same when the game is continued later.

#### Scenario: Device game
- **WHEN** Maija prefers the orange square and starts a 1v2 game against bots
- **THEN** Maija has the orange square, the bot in seat 2 the blue circle and the bot in seat 3 the green triangle
