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

## Hidden information
- Colyseus syncs state to all clients by default. A player's current target is
  sent only to that player and to spectators (Colyseus StateView).

## Client identity
- Colyseus reconnection token in sessionStorage (per tab).
