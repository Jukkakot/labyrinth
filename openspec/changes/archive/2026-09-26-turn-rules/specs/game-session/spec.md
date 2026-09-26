# Spec Delta

## ADDED Requirements

### Requirement: Leaving the game
A player who leaves a running game, whether they leave themselves, are kicked or are removed after a long disconnect, SHALL be removed from the game completely: their pawn disappears from the board, their treasure stack and found treasures are gone, and their seat becomes free. The other players MUST see who left. A player who leaves a finished game MUST NOT change its result.

#### Scenario: Player leaves mid-game
- **WHEN** the player in seat 2 leaves while seats 1 and 3 keep playing
- **THEN** seat 2's pawn and progress disappear for everyone, and the other players see that player 2 left

#### Scenario: Leaving a finished game
- **WHEN** a player leaves after the game has finished
- **THEN** the winner and the finished state stay as they were

### Requirement: Dropped connection
A dropped connection SHALL NOT count as leaving. The player MUST keep their seat, pawn and treasures for 5 minutes and MUST be shown to every player as disconnected. The turn still passes to a disconnected player, and the turn time limit and kicking apply to them as to anyone else. If the player comes back within 5 minutes, for example by reloading the page, they MUST continue in the same seat with everything they had. After 5 minutes disconnected, the player MUST be removed from the game automatically, as if they had left.

#### Scenario: Shown as disconnected
- **WHEN** the connection of the player in seat 2 drops
- **THEN** every other player sees seat 2 marked as disconnected, and seat 2 keeps its pawn and treasures

#### Scenario: Back in time
- **WHEN** a disconnected player reconnects after 4 minutes
- **THEN** they are back in their seat with their pawn, treasures and target, and no longer marked disconnected

#### Scenario: Removed after five minutes
- **WHEN** a player has been disconnected for 5 minutes
- **THEN** they are removed from the game as if they had left, and a later reconnect attempt returns them to the start screen

### Requirement: Kicked player informed
A player who is kicked SHALL be returned to the start screen, which MUST say calmly that they were removed from the game because their turn time ran out ("Sinut poistettiin pelistä, koska vuorosi aika loppui"). The message MUST disappear when they start a new game.

#### Scenario: Kicked
- **WHEN** the viewer is kicked from the game
- **THEN** they see the start screen with the removal message and can tap Play to start again
