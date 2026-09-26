# Tasks

## 1. Rules

- [ ] 1.1 Add `packages/rules/src/move.ts` (`reachableSquares`, `isReachable`, `shortestPath`) and export it; verify unit tests named after the `Reachable squares` scenarios (closed corridor, long corridor, walled in, pawns do not block — rules take no pawns) and fast-check properties (own square reachable, symmetry, path steps connected, path ends reachable)

## 2. Protocol and server

- [ ] 2.1 Protocol: `TURN_PHASES` gets `"move"`, `GAME_ERROR_CODES` gets `UNREACHABLE`, add `movePayloadSchema`; verify protocol schema tests (valid square, out of range, extra field)
- [ ] 2.2 Server: `Player.row/col` set to the start corner on join; `shift` carries pawns, sets phase `move` and logs `phase.changed` instead of passing the turn; new `move` command with `UNREACHABLE`; state facts include the pawn square; verify room tests for every `pawn-movement` and `turns` scenario (new player on corner, pawn rides a shift, shared square, move, stay, unreachable, move before shift, second shift, out of board, shift does not end the turn, alternate, leave while moving) and update existing shift/turn tests to the two-step flow

## 3. Client

- [ ] 3.1 View model and session: pawn squares, `phase`, `reachable` on my move step; `move(square)` in `useGameSession` with pending and rejection notice (`UNREACHABLE` text fi/en); verify session and view-model tests
- [ ] 3.2 Board: pawns on their squares, shared-square layout, preview carries pawns, `MoveTargets` highlight layer, pawn walk / slide / jump animation with reduced motion; `TurnLine` step texts; `MoveControls` (hint + "Jää paikalleen") replacing shift controls in the move step; verify component tests for the `board-view` scenarios (two players, shared square, preview carries a pawn, own turn / own move step / other player's turn, tap to move, stay, unreachable square, not during the shift) and locale parity
- [ ] 3.3 Visual check on Galaxy S24 with two tabs (light and dark): shift, then highlighted squares, tap to move, pawn walks, other tab sees it; verify screenshots, the E2E smoke test and the bundle budget pass

## 4. Wiki and roadmap

- [ ] 4.1 Update `docs/architecture.md` (state sync: pawn squares and `move` phase; rules API: `move.ts`; game flow: shift → move → next, `move` command, `UNREACHABLE`; client components) and mark `pawn-movement` done in `openspec/context/roadmap.md`; verify links resolve
