## MODIFIED Requirements

### Requirement: Current player
A started game SHALL always have exactly one current player until it finishes. In the waiting room nobody has the turn. When the game starts, the host MUST be the first current player, so the person who started the game plays at once. A game without a seated host (a game of bots only, watched by its creator) MUST start with a seated player chosen at random, each equally likely. When the current player leaves the game, whether they leave themselves, are kicked or are removed after a long disconnect, and the game goes on, the turn MUST pass to the next seated player clockwise.

#### Scenario: Nobody has the turn before the start
- **WHEN** two players sit in a waiting room
- **THEN** neither of them is the current player

#### Scenario: First player starts
- **WHEN** the host in seat 1 starts a game with seats 1, 2 and 3
- **THEN** seat 1 is the current player and must shift

#### Scenario: Bots only
- **WHEN** a game of three bots starts for a spectator
- **THEN** one of the three seats, chosen at random, is the current player

#### Scenario: Current player leaves
- **WHEN** the current player in seat 2 leaves while seats 1 and 3 are taken
- **THEN** the player in seat 3 becomes the current player

#### Scenario: Current player is kicked
- **WHEN** the current player in seat 1 is kicked while seats 2 and 3 are taken
- **THEN** the player in seat 2 becomes the current player and must shift
