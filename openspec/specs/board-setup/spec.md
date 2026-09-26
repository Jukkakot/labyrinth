# board-setup Specification

## Purpose
Produce the starting board of the original game: its fixed tile set and treasures, the fixed tiles in their original places, and the movable tiles shuffled reproducibly from a seed.

## Requirements

### Requirement: Tile set
Every game SHALL use the same 50 tiles, and each tile id SHALL always have the same kind in every game.
- **Fixed tiles (16):** 4 corners and 12 T-junctions.
- **Movable tiles (34):** 12 straight, 16 corner and 6 T-junction.

#### Scenario: Tile counts
- **WHEN** the tile set is inspected
- **THEN** it contains 50 tiles with distinct ids: 16 fixed (4 corner, 12 T-junction) and 34 movable (12 straight, 16 corner, 6 T-junction)

#### Scenario: Same tiles every game
- **WHEN** two games are set up with different seeds
- **THEN** every tile id has the same kind and the same treasure in both games

### Requirement: Treasures
There SHALL be 24 distinct treasures, each on exactly one tile:
- one on each of the 12 fixed T-junctions,
- one on each of the 6 movable T-junctions,
- one on 6 of the 16 movable corners.

The start corners, the straight tiles and the other 10 movable corners MUST have no treasure. Which tile carries which treasure MUST be the same in every game.

#### Scenario: Treasure placement
- **WHEN** the treasures of the tile set are counted
- **THEN** there are 24 distinct treasures: 12 on fixed T-junctions, 6 on movable T-junctions, 6 on movable corners, and none on start corners or straight tiles

### Requirement: Fixed layout
The fixed tiles SHALL be placed on the 16 fixed squares with these kinds and openings.

```
        col 0      col 2      col 4      col 6
row 0   ┌ E,S      ┬ E,S,W    ┬ E,S,W    ┐ S,W        (start corners, top edge)
row 2   ├ N,E,S    ├ N,E,S    ┬ E,S,W    ┤ N,S,W
row 4   ├ N,E,S    ┴ N,E,W    ┤ N,S,W    ┤ N,S,W
row 6   └ N,E      ┴ N,E,W    ┴ N,E,W    ┘ N,W        (start corners, bottom edge)
```

- **Start corners:** open toward the inside of the board.
- **Edge T-junctions:** closed toward the board edge.
- **Four inner T-junctions:** `(2,2)` is closed toward W, `(2,4)` toward N, `(4,4)` toward E and `(4,2)` toward S.

#### Scenario: Start corners open inward
- **WHEN** the start corners of a new board are inspected
- **THEN** `(0,0)` is open E and S, `(0,6)` is open S and W, `(6,6)` is open N and W, and `(6,0)` is open N and E

#### Scenario: Edge T-junctions closed toward the edge
- **WHEN** the fixed T-junctions on the board edge are inspected
- **THEN** those on row 0 are closed N, on column 6 closed E, on row 6 closed S and on column 0 closed W

#### Scenario: Inner T-junctions
- **WHEN** the four inner fixed T-junctions are inspected
- **THEN** `(2,2)` is closed W, `(2,4)` closed N, `(4,4)` closed E and `(4,2)` closed S

#### Scenario: Fixed layout is the same every game
- **WHEN** two games are set up with different seeds
- **THEN** every fixed square holds the same tile with the same rotation in both games

### Requirement: Seeded initial placement
Setting up a game from a seed (an unsigned 32-bit integer) SHALL place the 34 movable tiles in a shuffled order onto the 33 movable squares and the spare, and give each movable tile a random rotation. The result MUST be a valid board. The setup MUST depend only on the seed: the same seed MUST always produce an identical board, on any platform and in any later version unless a change explicitly replaces the setup.

#### Scenario: Valid board
- **WHEN** a game is set up with any seed
- **THEN** the result is a valid board containing all 50 tiles exactly once, with the fixed tiles on the fixed squares and one movable tile as the spare

#### Scenario: Reproducible
- **WHEN** a game is set up twice with seed 12345
- **THEN** both boards are identical, square by square, including rotations and the spare tile

#### Scenario: Different seeds
- **WHEN** games are set up with seeds 1 and 2
- **THEN** the placement or rotation of the movable tiles differs

#### Scenario: Invalid seed
- **WHEN** setup is requested with a seed that is not an integer between 0 and 2^32 − 1
- **THEN** it is rejected
