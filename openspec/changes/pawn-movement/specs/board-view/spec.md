# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Pawns on start corners`
- TO: `### Requirement: Pawns on their squares`

## MODIFIED Requirements

### Requirement: Pawns on their squares
Each seated player's pawn SHALL be shown on the square where it currently stands; a new player's pawn stands on their start corner. Seats are distinguished by a colour-blind-safe colour and by pawn shape: circle, square, triangle and diamond for seats 1–4. The viewer's own pawn MUST be identifiable as theirs. When several pawns share a square, all of them MUST stay visible, drawn smaller side by side. In a shift preview, pawns on the previewed line MUST be shown where the shift would carry them.

#### Scenario: Two players
- **WHEN** players in seats 1 and 2 have just joined a game
- **THEN** a circle pawn is shown on the top-left corner and a square pawn on the top-right corner, each in its seat colour, and the viewer's own pawn is marked as theirs

#### Scenario: Shared square
- **WHEN** the pawns of seats 1 and 2 stand on the same square
- **THEN** both pawns are visible on that square

#### Scenario: Preview carries a pawn
- **WHEN** a pawn stands on (2,3) and the viewer previews the N3 shift
- **THEN** the pawn is shown on (3,3) in the preview

### Requirement: Whose turn is shown
The game screen SHALL always show whose turn it is and which step it is in. On your own turn it MUST say what to do: push a tile ("Sinun vuorosi – työnnä laatta") or move your pawn ("Sinun vuorosi – siirrä nappulaa"). On someone else's turn it MUST name that player, show their pawn shape and colour, and say whether they are pushing or moving ("Pelaaja 2 työntää" / "Pelaaja 2 siirtää").

#### Scenario: Own turn
- **WHEN** it is the viewer's turn and they have not shifted yet
- **THEN** the turn line says it is their turn and that they should push a tile

#### Scenario: Own move step
- **WHEN** the viewer has shifted
- **THEN** the turn line says it is their turn and that they should move their pawn

#### Scenario: Other player's turn
- **WHEN** it is the turn of the player in seat 2 and the viewer is in seat 1
- **THEN** the turn line names player 2 with their pawn shape and says whether they are pushing or moving, and the shift controls are disabled

## ADDED Requirements

### Requirement: Move controls
During the viewer's move step, every square their pawn can reach SHALL be highlighted, and tapping a highlighted square MUST send the move at once, without a separate confirmation. A "Stay" button ("Jää paikalleen") MUST send a move to the pawn's own square; tapping the own square does the same. Squares that cannot be reached MUST NOT react. The shift arrows and the rotate button MUST NOT be offered during the move step. While the move waits for the server, the move controls MUST show a waiting state and MUST NOT accept a second move. The highlight MUST NOT rely on colour alone. Every square is a tap target of at least 44 px on the reference device.

#### Scenario: Tap to move
- **WHEN** the viewer has shifted and taps a highlighted square
- **THEN** the move to that square is sent once, and the highlight disappears when the turn passes

#### Scenario: Stay
- **WHEN** the viewer has shifted and presses "Jää paikalleen"
- **THEN** a move to the pawn's own square is sent

#### Scenario: Unreachable square
- **WHEN** the viewer taps a square that is not highlighted
- **THEN** nothing is sent

#### Scenario: Not during the shift
- **WHEN** it is the viewer's turn and they have not shifted yet
- **THEN** no squares are highlighted for moving

### Requirement: Pawns walk
When a pawn moves, every player SHALL see it walk square by square along a shortest path through the corridors to its target, quickly enough that a long walk takes at most about a second. A pawn riding a shift MUST slide with its tile; a pawn carried off the board edge onto the inserted tile MUST jump there instead of sliding across the board. With reduced motion requested by the device, pawns MUST move without animation.

#### Scenario: Someone moves
- **WHEN** any player's move arrives
- **THEN** their pawn walks along the corridors to the target square on every player's screen

#### Scenario: Reduced motion
- **WHEN** the device requests reduced motion and a pawn moves
- **THEN** the pawn appears on the target square without animation
