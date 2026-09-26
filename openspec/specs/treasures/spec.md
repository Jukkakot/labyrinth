# treasures Specification

## Purpose
Give the game its goal: treasure cards dealt evenly, one secret target at a time, collecting treasures by ending a move on them, returning home to win, and the finished game.

## Requirements

### Requirement: Treasure cards dealt evenly
Every game SHALL deal the 24 treasure cards from a seeded shuffle, evenly, so that every seat gets the same number of cards in a fixed order (its stack). Until the waiting room exists, the cards MUST be dealt when the game is created, 6 to each of the four seats, and a player taking a seat MUST get that seat's stack with nothing found yet. The deal MUST be reproducible from its seed, and no treasure MUST appear in two stacks. The deal seed MUST stay on the server.

#### Scenario: Four stacks of six
- **WHEN** a new game is created
- **THEN** each of the seats 1–4 has a stack of 6 different treasures, and together the stacks hold all 24 treasures once

#### Scenario: Deal for fewer seats
- **WHEN** the treasures are dealt for 2 or 3 seats
- **THEN** each seat gets 12 or 8 cards, and together they hold all 24 treasures once

#### Scenario: Reproducible deal
- **WHEN** the cards are dealt twice with the same seed and the same seats
- **THEN** every seat gets the same stack in the same order

#### Scenario: Freed seat
- **WHEN** a player leaves and a new player takes their seat
- **THEN** the new player starts that seat's stack from the first card, with nothing found

### Requirement: Secret current target
Each player SHALL hunt one treasure at a time: their current target is the first card of their stack not yet found. A player's current target MUST be sent only to that player. How many cards each player has and which treasures each player has found MUST be visible to every player.

#### Scenario: Own target
- **WHEN** a player looks at the game
- **THEN** they know their own current target

#### Scenario: Other players' targets hidden
- **WHEN** the state a player receives is inspected
- **THEN** it contains no other player's current target, but it contains every player's card count and found treasures

### Requirement: Collecting a treasure
When the current player's move ends on the square whose tile carries their current target, including by staying there, that treasure SHALL be collected: it is added to the player's found treasures and the next card becomes their target. At most one treasure is collected per move. A shift MUST NOT collect anything, and a pawn standing on another player's target MUST NOT collect it for either player.

#### Scenario: Move onto the target
- **WHEN** a player's current target is the dragon and their move ends on the tile carrying the dragon
- **THEN** the dragon is among their found treasures and their next card is their current target

#### Scenario: Stay on the target
- **WHEN** a shift carries the tile with the current player's target under their pawn and they stay
- **THEN** the treasure is collected

#### Scenario: Passing through
- **WHEN** the player's pawn walks across their target's tile but the move ends elsewhere
- **THEN** nothing is collected

#### Scenario: Someone else's target
- **WHEN** a player's move ends on a tile carrying another player's current target
- **THEN** nothing is collected

### Requirement: Return home to win
After a player has found every treasure in their stack, their target SHALL be their own start corner. When their move ends on that corner, including by staying there, they MUST win and the game MUST be finished at once.

#### Scenario: Heading home
- **WHEN** a player collects the last treasure of their stack
- **THEN** their target is their start corner

#### Scenario: Winning
- **WHEN** a player who has found all their treasures ends their move on their start corner
- **THEN** that player wins and the game is finished

#### Scenario: Home too early
- **WHEN** a player who still has treasures to find ends their move on their start corner
- **THEN** nothing happens and the turn passes

### Requirement: Finished game
A finished game SHALL tell every player who won. In a finished game every shift and move MUST be rejected with `WRONG_PHASE` and MUST NOT change the game.

#### Scenario: Move after the end
- **WHEN** any player sends a shift or a move after the game has finished
- **THEN** it is rejected with `WRONG_PHASE` and nothing changes
