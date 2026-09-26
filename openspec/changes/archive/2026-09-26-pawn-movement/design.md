# Design

## Context

The server holds the board and seats; `phase` is always `"shift"` and `passTurn()` runs right
after an accepted shift. `Player` has only `seat` and `connected`; the client draws pawns on
`START_CORNERS[seat - 1]`. `shiftBoard(board, id, rotation, pawns)` already moves pawns but the
room passes none. `connectedNeighbours(board, sq)` exists in `packages/rules/src/board.ts`.

## Goals / Non-Goals

**Goals:** pawn squares in synced state, the shift → move turn flow, the `move` command with
server-side reachability, move UI with highlight / tap / Stay, pawn walk and ride animation.

**Non-Goals:** treasures and targets (`treasures-and-win`), turn timer and kick (`turn-rules`), the
"confirm move" setting (`settings`; default is off, so tapping moves at once now), bots.

## Decisions

Autopilot decisions (made without review; revisit freely):

1. **Stay = move to own square.** One `move { row, col }` command; no separate `stay`. Keeps one
   code path and one audit event; the planned architecture already said so.
2. **Tap moves immediately**, as `product.md` says ("tapping one moves immediately"); tapping the
   own square also stays. The optional confirmation arrives with `settings`.
3. **Pawns do not block** and may share squares (original rules). Shared squares draw pawns at
   ~60 % size in fixed per-seat quadrants (seat 1 top-left … seat 4 bottom-left), so positions do
   not jump around when a third pawn arrives.
4. **Pawn walks the shortest path**, computed on the client from the previous square and the
   current board with `shortestPath()` from rules (the board does not change during a move, so
   the path is deterministic). Step time `min(120 ms, 900 ms / steps)`. Only the walk end state is
   authoritative; if the path cannot be found (e.g. state jumped after a reconnect), the pawn just
   jumps.
5. **Wrapping pawn jumps.** A pawn pushed off the edge lands on the inserted tile without a slide,
   like the inserted tile itself (which appears in place). Detected as "moved more than one square
   during a shift".
6. **Move step hides the shift controls** and shows only a hint line and the Stay button in the
   same slot under the board, so the layout height does not jump. The spare is still shown
   (disabled rotate hidden) so players can see what dropped out.
7. **Turn line texts:** "Sinun vuorosi – siirrä nappulaa" / "Your turn – move your pawn",
   "Pelaaja N siirtää" / "Player N is moving".
8. **Reachable highlight** is an outlined inset square plus a small dot at the tile hub (shape, not
   just colour); the own square gets the same outline so it is clearly a valid "stay" tap.
9. **Leaving during the move step** passes the turn with phase `shift` (existing `setTurn` resets
   the phase).

### Rules (`packages/rules/src/move.ts`)
- `reachableSquares(board, from): Square[]` — BFS over `connectedNeighbours`, `from` first.
- `isReachable(board, from, to): boolean`.
- `shortestPath(board, from, to): Square[] | undefined` — BFS with parents, `[from, …, to]`.

### Protocol
- `TURN_PHASES = ["shift", "move"]`, `GAME_ERROR_CODES += "UNREACHABLE"`.
- `movePayloadSchema = z.strictObject({ row: int 0–6, col: int 0–6 })` → out of range is
  `INVALID_COMMAND` from the command wrapper.

### Server
- `Player` gains `row`, `col` (`uint8`). `onJoin` sets them from `START_CORNERS[seat - 1]`.
- `shift`: requires phase `shift`; passes all pawn squares (in a fixed order of player entries) to
  `shiftBoard`, writes them back, sets `phase = "move"`; does **not** pass the turn. Logs
  `phase.changed` (already in the event catalogue) with `from: "shift", to: "move"`.
- `move`: `requireTurn(client, "move")`, `isReachable` else `UNREACHABLE` with facts
  `{ from: [row, col], to: [row, col] }`, sets the square, `passTurn()` (which resets phase to
  `shift` via `setTurn`).
- `commandStateFacts` adds the current player's pawn square.

### Client
- `SyncedState.players` items gain `row`, `col`; `SeatView` gains `square`; `GameView` gains
  `phase` and `reachable` (computed only on my move step).
- `Board` draws pawns at their squares through a `PawnLayer` that owns the walk animation
  (per-pawn displayed square advanced by timers; CSS transform transition on the pawn `<g>`,
  disabled for jumps and under `prefers-reduced-motion`).
- New `MoveTargets` layer (like `ShiftTargets`): one tap target per reachable square.
- `GameScreen` switches between `ShiftControls` and a small `MoveControls` (hint + Stay button) by
  phase; `useGameSession` gains `move(square)` with the same pending / notice handling as `shift`.
- Shift preview passes pawn squares to `shiftBoard` so the preview carries pawns.

## How NFRs are met

- **Logging/audit:** `move` goes through `defineCommand` → exactly one `cmd.accepted` /
  `cmd.rejected` line; rejection lines carry phase, turn seat and the pawn square; the step change
  logs `phase.changed`; `turn.changed` stays. No personal data added.
- **Tests:** rules unit tests named after the scenarios plus fast-check properties (own square
  always reachable; reachability is symmetric; every `shortestPath` step is a connected pair and
  its end is reachable). Server room tests for every `pawn-movement` and `turns` scenario. Client
  component tests for move controls, turn line and pawn placement. The E2E smoke test is
  unchanged.
- **Performance:** BFS over 49 squares is trivial; animation uses `transform` only; bundle grows by
  a few hundred bytes (checked by `npm run size`).
- **Abuse:** payload strictly validated; out-of-turn or out-of-phase commands rejected before any
  state change.

## Risks / Trade-offs

- A player who shifts and then drops holds the game until the turn timer exists (`turn-rules`).
  Same as today with a player who never shifts. Accepted.
- Path animation computed client-side could differ from what a human expected when several
  shortest paths exist; purely cosmetic.
