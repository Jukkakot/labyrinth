# Spec Delta

## MODIFIED Requirements

### Requirement: Treasure cards dealt evenly
Every game SHALL deal the 24 treasure cards from a seeded shuffle, evenly among the players seated when the game starts, so that every seated player gets the same number of cards (24 / number of players: 12, 8 or 6) in a fixed order (their stack). The cards MUST be dealt when the game starts, not before; in the waiting room nobody has cards or a target. The stacks go to the seated seats in seat order. The deal MUST be reproducible from its seed and the seated seats, and no treasure MUST appear in two stacks. The deal seed MUST stay on the server.

#### Scenario: Four stacks of six
- **WHEN** a game starts with 4 players
- **THEN** each of them has a stack of 6 different treasures, and together the stacks hold all 24 treasures once

#### Scenario: Deal for fewer seats
- **WHEN** a game starts with seats 1 and 3 taken, or with 3 players
- **THEN** each player gets 12 or 8 cards respectively, and together they hold all 24 treasures once

#### Scenario: Reproducible deal
- **WHEN** the cards are dealt twice with the same seed and the same seated seats
- **THEN** every seat gets the same stack in the same order

#### Scenario: Freed seat
- **WHEN** the player in seat 2 leaves the waiting room before the start and nobody takes the seat
- **THEN** the cards are dealt only to the players still seated, and seat 2 gets no stack

#### Scenario: No cards before the start
- **WHEN** a player looks at the waiting room
- **THEN** no player has cards or a target yet
