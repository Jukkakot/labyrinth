# Architecture conventions

## Board geometry
- Squares are `(row, col)`, 0–6, origin top-left; row grows down, col right.
- Directions N, E, S, W. A tile is its set of open sides; rotation is clockwise
  in 90° steps (0/90/180/270).
- Fixed tiles sit where row and col are both even. Rows and cols 1, 3, 5 are
  pushable → 12 insertion points, named by entry side + index (e.g. `N1` pushes
  column 1 downward from the top).
- Start corners (0,0), (0,6), (6,6), (6,0) in clockwise order.

## Game flow and commands
- Phases: `LOBBY → SHIFT → MOVE → (next player) SHIFT … → FINISHED`.
- Commands: `shift{insertion, rotation}`, `move{square}` (own square = stay),
  `kick{player}`; creator only: `addBot`, `removeBot`, `start`.
- Spare-tile rotation stays client-side until the shift is sent.
- Every command is validated for phase, turn and game state; invalid commands
  are rejected with a stable error code (`NOT_YOUR_TURN`, `WRONG_PHASE`,
  `REVERSE_PUSH_FORBIDDEN`, `UNREACHABLE`, …) and never change state.

## Bots
- A bot is an ordinary player seat. Its decision is a pure function in
  `@labyrinth/rules`; the server submits the result through the same command
  handler as humans.

## State sync principle
- The server syncs only authoritative facts that cannot be derived: tile ids and
  rotations per square and spare, last insertion, pawn squares, phase, current
  player, turn deadline, found treasures, player flags, result. Tile kinds and
  treasures per tile are static per game and sent once.
- The client derives everything else with `@labyrinth/rules` (openings,
  reachable squares, slide animations from tile-id diffs, seat colour/shape).
- UI-only state (shift preview, spare rotation before sending, settings) never
  crosses the network. The seed stays on the server.
- Don't optimise beyond this; Colyseus already sends only deltas.

## Hidden information
- Colyseus syncs state to all clients by default. A player's current target is
  sent only to that player and to spectators (Colyseus StateView).

## Client identity
- Colyseus reconnection token in sessionStorage (per tab).
