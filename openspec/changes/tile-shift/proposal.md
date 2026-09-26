# Proposal

## Why

The board is visible but nothing can happen on it. Shifting a row or column with the spare tile is the heart of the game and the first real command: it exercises the command contract, server-side rule validation, turn order and the mobile interaction pattern (tap, preview, confirm) that later actions will reuse.

## What Changes

- **Shift rule** in `@labyrinth/rules`:
  - 12 insertion points (rows and columns 1, 3, 5, from either end). The spare is inserted with a chosen rotation, and the tile pushed out becomes the new spare.
  - Pawns on the shifted line move with their tiles. A pawn pushed off the board re-enters on the inserted tile.
  - Pushing straight back where the previous shift came from is forbidden.
- **Minimal turn order:**
  - The game has a current player.
  - After a successful shift the turn passes clockwise to the next seated player (`pawn-movement` later adds a move step in between).
  - For now the first player to sit down starts; the random starting player arrives with the waiting room in `lobby`.
- **`shift` command** on the server through the command wrapper. The server rejects with `NOT_YOUR_TURN`, `WRONG_PHASE`, `NOT_SEATED` or `REVERSE_PUSH_FORBIDDEN`, changes nothing on rejection, and logs every turn change.
- **Shift controls on the phone:**
  - Arrow markers sit on the 12 edge tiles of the pushable lines. Tapping one previews the shift on the board.
  - Tapping it again or pressing "Työnnä" confirms; "Peru" cancels.
  - The spare tile is rotated with a rotate button.
  - The forbidden reverse insertion is shown disabled.
  - Tiles slide into place with a short animation that respects reduced motion.
- **State legibility:** a turn line shows whose turn it is ("Sinun vuorosi – työnnä laatta" or "Pelaaja 2 työntää"). Controls are enabled only on your own turn. A rejected command shows a short localized message.
- Workspaces touched: rules, protocol (shift payload and error codes), server, client.

Out of scope:
- Moving pawns (`pawn-movement`).
- The 60 s turn limit, kicking and leaving (`turn-rules`, `lobby`).
- The per-user "confirm shift" setting (`settings`); for now shifts always ask for confirmation.

## Capabilities

### New Capabilities
- `tile-shift`: insertion points, the shift itself, the new spare, pawns riding and wrapping, and the no-reverse rule.
- `turns`: current player, turn passing after a shift, and who may act.

### Modified Capabilities
- `board-view`: adds shift controls (edge arrows, preview, confirm, rotate, disabled reverse), the turn line, the slide animation and messages for rejected commands.

## Impact

- **packages/rules**: new `shift.ts` (insertions, `shiftBoard`, `isReverse`), with fast-check properties.
- **packages/protocol**: `shift` payload schema and game error codes (shared by client and server).
- **server**: `GameState` gains `turnSeat`, `phase` and `lastInsertion`; `GameRoom` gets the `shift` command and turn passing; new `turn.changed` log event.
- **client**: `useGameSession` exposes turn info and `shift()`; new `ShiftControls` and `TurnLine`, board edge arrows with preview, a `Notice` UI component, and fi/en strings.
- **E2E**: smoke test unchanged (feature behaviour is covered by unit and room tests).
