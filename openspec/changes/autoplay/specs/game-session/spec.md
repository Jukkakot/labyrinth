# Spec Delta

## MODIFIED Requirements

### Requirement: Dropped connection
A dropped connection SHALL NOT count as leaving. The player MUST keep their seat, pawn and treasures for 5 minutes and MUST be shown to every player as disconnected. The turn still passes to a disconnected player; while their seat is held it is auto-played (see autoplay), so their turns are played for them, and the turn time limit and kicking apply to them as to anyone else. If the player comes back within 5 minutes, for example by reloading the page, they MUST continue in the same seat with everything they had. After 5 minutes disconnected, the player MUST be removed from the game automatically, as if they had left.

#### Scenario: Shown as disconnected
- **WHEN** the connection of the player in seat 2 drops
- **THEN** every other player sees seat 2 marked as disconnected, and seat 2 keeps its pawn and treasures

#### Scenario: Played for while away
- **WHEN** the connection of the player in seat 2 drops in a running game and the turn passes to seat 2
- **THEN** seat 2's turn is played by the bot, and the turn passes on

#### Scenario: Back in time
- **WHEN** a disconnected player reconnects after 4 minutes
- **THEN** they are back in their seat with their pawn, treasures and target, and no longer marked disconnected

#### Scenario: Removed after five minutes
- **WHEN** a player has been disconnected for 5 minutes
- **THEN** they are removed from the game as if they had left, and a later reconnect attempt returns them to the start screen
