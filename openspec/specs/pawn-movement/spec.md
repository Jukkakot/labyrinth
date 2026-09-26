# pawn-movement Specification

## Purpose
Move pawns through the labyrinth: where each pawn stands, which squares it can reach along connected corridors, and the move step that follows every shift.

## Requirements

### Requirement: Pawn squares
Every seated player SHALL have a pawn on exactly one square of the board. A player who takes a seat MUST get their pawn on that seat's start corner. Pawns ride shifts as the tile-shift rules say, and a player's pawn leaves the board when the player leaves the game. Any number of pawns MAY stand on the same square.

#### Scenario: New player starts on their corner
- **WHEN** a player takes seat 3 in a game already in progress
- **THEN** their pawn is on the bottom-right corner (6,6)

#### Scenario: Pawn rides a shift on the server
- **WHEN** a pawn stands on (2,3) and the current player's shift at N3 is accepted
- **THEN** every player sees that pawn on (3,3)

#### Scenario: Shared square
- **WHEN** a player moves onto a square where another pawn stands
- **THEN** the move is accepted and both pawns are on that square

### Requirement: Reachable squares
A square SHALL be reachable from a pawn's square when a chain of connected neighbouring squares leads there, where two neighbours are connected only when both tiles are open toward each other. The pawn's own square MUST always be reachable. Openings toward the board edge lead nowhere. Other pawns MUST NOT block the way.

#### Scenario: Closed corridor
- **WHEN** the pawn's tile is open to the east but the east neighbour is not open to the west
- **THEN** that neighbour is not reachable through that side

#### Scenario: Long corridor
- **WHEN** squares (1,1), (1,2) and (1,3) are connected in a row and (1,1) is the pawn's square
- **THEN** (1,3) is reachable

#### Scenario: Walled in
- **WHEN** no neighbour of the pawn's square is connected to it
- **THEN** only the pawn's own square is reachable

#### Scenario: Pawns do not block
- **WHEN** another pawn stands on a square in the middle of a corridor
- **THEN** squares beyond it along that corridor are still reachable

### Requirement: Move step
After the current player's shift is accepted, the same player SHALL make exactly one move: their pawn goes to a reachable square, or stays where it is by choosing its own square. The move MUST be rejected with `UNREACHABLE` when the target is not reachable, and with `WRONG_PHASE` when it is sent before the shift. A shift sent during the move step MUST be rejected with `WRONG_PHASE`. A rejected move MUST NOT change the game.

#### Scenario: Move along a corridor
- **WHEN** the current player has shifted and moves to a reachable square
- **THEN** their pawn is on that square and the turn passes

#### Scenario: Stay
- **WHEN** the current player has shifted and chooses their own square
- **THEN** their pawn does not move and the turn passes

#### Scenario: Unreachable target
- **WHEN** the current player chooses a square that is not reachable
- **THEN** it is rejected with `UNREACHABLE` and nothing changes

#### Scenario: Move before shifting
- **WHEN** the current player sends a move before shifting
- **THEN** it is rejected with `WRONG_PHASE` and nothing changes

#### Scenario: Second shift
- **WHEN** the current player has shifted and sends another shift
- **THEN** it is rejected with `WRONG_PHASE` and nothing changes

#### Scenario: Square outside the board
- **WHEN** a move names a square outside the 7×7 board
- **THEN** it is rejected with `INVALID_COMMAND` and nothing changes
