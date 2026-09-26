# Tasks

## 1. Rules

- [ ] 1.1 Create `packages/rules/src/shift.ts` (`INSERTIONS`, `insertionLine`, `reverseOf`, `shiftBoard` with pawns) and export it; verify tests for every `tile-shift` scenario (twelve points, column 2 rejected, push down N1 with rotation, push left E3, fixed tiles unchanged, pawn rides, pawn wraps, reverse pairs) and fast-check properties (ids preserved, fixed squares unchanged, shift + reverse with the pushed-out tile restores board and pawns)

## 2. Protocol

- [ ] 2.1 Add `game-codes.ts` (insertion ids, rotations, `GAME_ERROR_CODES`) and `game-schema.ts` (`shiftPayloadSchema`) to `@labyrinth/protocol`; verify schema tests and a cross-package test that the insertion ids equal the rules' `INSERTIONS`

## 3. Server

- [ ] 3.1 Add `turnSeat`, `phase`, `lastInsertion` to `GameState`; turn start on join, `passTurn()` on leave, `turn.changed` event; verify room tests for the `turns` scenarios (first player starts, current player leaves, dropped player keeps their place)
- [ ] 3.2 Add the `shift` command with `NOT_SEATED` / `NOT_YOUR_TURN` / `WRONG_PHASE` / `REVERSE_PUSH_FORBIDDEN` and `commandStateFacts()`; verify room tests via `room.request`: accepted shift updates squares/spare/lastInsertion as `shiftBoard` says and passes the turn (two players alternate, alone keeps turn), out-of-turn and reverse rejected with state unchanged and a `cmd.rejected` line carrying the facts

## 4. Client

- [ ] 4.1 Extend the view model and `useGameSession` (turn info, `shift()` via `request`, `pending`, `notice` with 4 s timeout); verify unit tests with a fake room (accepted → no notice, rejected → notice key, pending blocks a second shift)
- [ ] 4.2 Add `ui/Notice`, `game/TurnLine`, and fi/en strings (`turn.*`, `shift.*`, `errors.*`); verify component tests (own turn / other player's turn with name and shape, notice text for `REVERSE_PUSH_FORBIDDEN`) and locale parity
- [ ] 4.3 Add board shift targets (edge arrows, keyboard, disabled reverse), `ShiftControls` (spare, rotate, Työnnä, Peru, hint) and the preview/confirm flow in `GameScreen`; slide transitions in `TileView`; verify component tests for the `board-view` scenarios (preview then confirm sends once, change of mind, rotate twice → 180°, reverse arrow disabled, controls disabled on others' turn)
- [ ] 4.4 Visual check on Galaxy S24 (light and dark): own turn with preview, other's turn; verify screenshots and that the E2E smoke test still passes; bundle budget passes

## 5. Wiki

- [ ] 5.1 Update `docs/architecture.md` (shift rule and insertion naming, turn model, command pattern example with the `shift` command, client interaction and animation) and mark `tile-shift` done in `openspec/context/roadmap.md`; verify links resolve
