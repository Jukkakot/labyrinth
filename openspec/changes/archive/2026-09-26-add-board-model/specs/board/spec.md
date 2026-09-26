# Spec Delta

## Purpose

Define the Labyrinth board precisely: its squares, the tiles on them, how tiles open and rotate, which squares are fixed, and when two squares are connected. Every other game rule builds on this definition.

## ADDED Requirements

### Requirement: Board geometry
The board SHALL consist of 7×7 squares. A square is addressed as `(row, col)`, both from 0 to 6. `(0, 0)` is the top-left square, rows grow downward and columns grow rightward. Directions are N (toward row 0), E (toward col 6), S (toward row 6) and W (toward col 0). Any coordinate outside 0–6 MUST be rejected as invalid.

#### Scenario: Neighbour in a direction
- **WHEN** the neighbour of square `(3, 3)` toward E is requested
- **THEN** the result is `(3, 4)`

#### Scenario: No neighbour beyond the edge
- **WHEN** the neighbour of square `(0, 2)` toward N is requested
- **THEN** there is no neighbour

#### Scenario: Invalid coordinate
- **WHEN** square `(7, 0)` is requested
- **THEN** the request is rejected as an invalid coordinate

### Requirement: Tiles on the board
Every square SHALL hold exactly one tile, and exactly one additional tile SHALL be the spare tile outside the board. That makes 50 tiles in total. Every tile MUST have an id that is unique among the 50 tiles and that never changes, whether the tile is rotated or moves between squares.

#### Scenario: Tile count
- **WHEN** a valid board is inspected
- **THEN** it has 49 tiles on squares plus 1 spare tile, and all 50 ids are distinct

### Requirement: Tile kinds and openings
A tile SHALL be of exactly one kind, and each kind has a fixed set of openings at rotation 0:
- **straight:** open N and S
- **corner:** open N and E
- **T-junction:** open E, S and W (closed N)

A side that is not open is a wall.

#### Scenario: Openings at rotation 0
- **WHEN** the openings of a corner tile at rotation 0 are requested
- **THEN** they are exactly N and E

### Requirement: Rotation
A tile's rotation SHALL be one of 0°, 90°, 180° or 270° clockwise. Rotating by 90° clockwise maps every opening N→E, E→S, S→W and W→N. Rotation MUST NOT change a tile's kind or id. Four successive 90° rotations MUST return the tile to its original openings.

#### Scenario: Rotating a corner
- **WHEN** a corner tile at rotation 0 (open N, E) is rotated 90° clockwise
- **THEN** its rotation is 90° and it is open E and S

#### Scenario: Rotating a T-junction to 270°
- **WHEN** the openings of a T-junction at rotation 270° are requested
- **THEN** they are exactly N, E and S (closed toward W)

#### Scenario: Straight tile symmetry
- **WHEN** the openings of a straight tile at 0° and at 180° are compared
- **THEN** they are the same (N and S)

#### Scenario: Full turn
- **WHEN** any tile is rotated 90° clockwise four times
- **THEN** its openings, kind and id are the same as before

### Requirement: Fixed and movable squares
The 16 squares where both row and column are even SHALL be fixed squares. All other 33 squares SHALL be movable squares. The four corner squares `(0,0)`, `(0,6)`, `(6,6)` and `(6,0)` are fixed squares and are the players' start corners. Tiles on fixed squares are fixed tiles. The 33 tiles on movable squares, together with the spare tile, are the 34 movable tiles.

#### Scenario: Fixed square
- **WHEN** square `(2, 4)` is checked
- **THEN** it is a fixed square

#### Scenario: Movable square
- **WHEN** square `(2, 3)` is checked
- **THEN** it is a movable square

#### Scenario: Counts
- **WHEN** all squares are classified
- **THEN** there are 16 fixed squares and 33 movable squares, and the four start corners are among the fixed squares

### Requirement: Connections between squares
Two squares SHALL be connected when they are orthogonal neighbours and each tile is open toward the other. A square MUST NOT be connected to anything beyond the board edge, even when its tile is open toward the edge. Squares that are not orthogonal neighbours MUST NOT be connected directly.

#### Scenario: Both open
- **WHEN** square `(3, 3)` holds a tile open toward E and square `(3, 4)` holds a tile open toward W
- **THEN** the two squares are connected

#### Scenario: One side walled
- **WHEN** square `(3, 3)` holds a tile open toward E but square `(3, 4)` holds a tile closed toward W
- **THEN** the two squares are not connected

#### Scenario: Open toward the edge
- **WHEN** square `(0, 3)` holds a tile open toward N
- **THEN** that opening connects to nothing

#### Scenario: Connected neighbours of a square
- **WHEN** the connected neighbours of a square are requested
- **THEN** exactly the orthogonal neighbours that satisfy the connection rule are returned

### Requirement: Board construction from a layout
It SHALL be possible to construct a board from an explicit layout: a tile (kind, rotation, id) for each of the 49 squares plus the spare tile. Construction MUST reject a layout with a missing or extra square, or with duplicate tile ids. A constructed board is an immutable value that can be serialized to plain data and restored to an equal board.

#### Scenario: Valid layout
- **WHEN** a board is constructed from a layout with 49 squares, a spare tile and 50 distinct ids
- **THEN** construction succeeds and each square holds the tile given for it

#### Scenario: Duplicate id
- **WHEN** a layout gives the same id to two tiles
- **THEN** construction is rejected with an error naming the duplicate id

#### Scenario: Missing square
- **WHEN** a layout has only 48 squares
- **THEN** construction is rejected

#### Scenario: Round trip
- **WHEN** a board is serialized to plain data and restored
- **THEN** the restored board is equal to the original
