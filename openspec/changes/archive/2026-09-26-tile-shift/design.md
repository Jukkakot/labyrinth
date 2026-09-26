# Design

## Context

What exists (see `docs/architecture.md`):
- **Rules:** the board model (plain frozen data, `createBoard`), `START_CORNERS`, the tile set.
- **Server:** `GameRoom` with seats, synced `squares`/`spare`, and `LoggedRoom.command()` (zod validation, `CommandRejection`, one audit line, `{ ok } / { ok: false, code }` reply via `room.request`). No command is defined yet.
- **Client:**
  - `useGameSession` gives a `GameView` (board, seats).
  - `Board` renders tiles keyed by tile id.
  - UI components live in `ui/`.

The shift UX is already decided in `openspec/context/product.md`: tap, ghost preview, confirm, and a blocked reverse arrow.

## Goals / Non-Goals

**Goals:**
- A pure, fully tested shift rule that server and client share: the client uses it for the preview, the server for the truth.
- The first real command end to end, establishing the pattern for `move`, `kick` and later commands: protocol schema, room handler, client `request`, error message.
- A minimal turn model that `pawn-movement` and `turn-rules` extend.

**Non-Goals:**
- A move step, the turn timer, a random starting player, the settings toggle, and tile-entry animation from the spare.

## Decisions

### 1. Rules: `shift.ts`
```ts
type InsertionId = "N1" | "N3" | "N5" | "E1" | … | "W5";          // 12, as a const tuple
INSERTIONS: readonly InsertionId[]
insertionLine(id): { squares: Square[] }   // entry square first, exit square last
reverseOf(id): InsertionId                 // N1 ↔ S1, E3 ↔ W3
shiftBoard(board, id, rotation, pawns?: readonly Square[]): { board, pawns, pushedOut: Tile }
```
- `shiftBoard` builds the new squares array: the line moves one step away from the entry, the spare is placed at the entry with the given rotation, and the exit tile becomes the spare with its rotation unchanged.
- Pawns on the line move one step. A pawn on the exit square goes to the entry square.
- The result goes through `createBoard`, so it is validated.
- Pure, with no turn or state knowledge. The server decides whether a shift is allowed (turn and reverse), and the rules only say what it does.
- **fast-check properties:**
  - the tile multiset is preserved (the 50 ids are unchanged);
  - fixed squares are unchanged;
  - shifting and then shifting back with the pushed-out tile restores the original board and pawns.

### 2. Protocol: payload and codes
`packages/protocol/src/game.ts`:
- `shiftPayloadSchema = z.object({ insertion: z.enum(INSERTION_IDS), rotation: z.union([0, 90, 180, 270 literals]) })`
- `GAME_ERROR_CODES = ["NOT_SEATED", "NOT_YOUR_TURN", "WRONG_PHASE", "REVERSE_PUSH_FORBIDDEN"]`

The insertion id list is duplicated from rules as a literal tuple. `packages/protocol` must not depend on the rules package, and a unit test asserts that the two lists are equal. Zod stays out of the client bundle: the client imports only types and constants from `game-codes.ts`, and the schema sits in its own module (as with the log schema).

### 3. Server state and command
- **GameState additions:**
  - `turnSeat: uint8` (0 = none);
  - `phase: string` (`"shift"` for now; `"move"` arrives with `pawn-movement`);
  - `lastInsertion: string` (`""` or an insertion id).
- **Command:** `messages = { shift: this.command("shift", shiftPayloadSchema, handler) }`. The handler:
  1. finds the sender's seat, else rejects with `NOT_SEATED`;
  2. checks the turn (`turnSeat === seat`, else `NOT_YOUR_TURN`) and the phase (`WRONG_PHASE`);
  3. rejects `insertion === reverseOf(lastInsertion)` with `REVERSE_PUSH_FORBIDDEN`;
  4. calls `shiftBoard` with the current board rebuilt from state;
  5. writes back the squares, spare and last insertion;
  6. calls `passTurn()`.

  Every rejection throws before any state write. `commandStateFacts()` returns `{ phase, turnSeat, lastInsertion }`, so rejection lines explain themselves.
- **Turn passing:** `passTurn()` is the next taken seat clockwise from `turnSeat`, and it logs `turn.changed { from, to }` (new event).
  - `onJoin`: if `turnSeat === 0`, the joiner gets the turn.
  - `onLeave`: if the leaver held the turn, `passTurn()` runs first, or the turn goes to 0 when nobody is left.

### 4. Client session
- **`GameView` additions:** `turnSeat`, `isMyTurn`, `lastInsertion`.
- **`useGameSession.shift(insertion, rotation)`:** calls `room.request("shift", …)` and returns the `CommandResult`. It exposes `pending` while waiting (the UI disables controls) and `notice` (a localized message key for 4 s after a rejection).
- `GameRoomLike` gains `request(type, payload)`. The SDK's `room.request` resolves with the handler's return value.

### 5. Shift interaction
- **Edge arrows:** the `Board` gets an optional `shiftTargets` layer. For each insertion id, a transparent full-tile tap target sits on its entry edge square, with an arrow glyph (Tabler `IconArrowDown` / `Up` / `Left` / `Right`) drawn small at the outer edge of the tile.
  - Implemented as SVG `<g role="button" tabIndex=0 aria-label="Työnnä ylhäältä sarakkeeseen 2">` with keyboard support (Enter/Space).
  - Human-readable labels count lines 1–7.
  - The disabled reverse arrow has `aria-disabled`, a muted style and no action.
  - Tile size is about 47 px on a 360 px screen, which meets the 44 px minimum without shrinking the board.
- **Preview:** a local `selection: { insertion, rotation }`. The board renders `shiftBoard(view.board, insertion, rotation)`. The inserted tile gets a highlight outline, and the pushed-out tile is drawn faded as "the new spare" in the controls area.
  - Tapping the same arrow confirms.
  - Controls under the board (`ShiftControls`): spare tile (72 px), rotate button, "Työnnä" (primary) and "Peru" (secondary).
  - Without a selection only the spare and rotate are shown, plus a hint "Valitse nuoli laudan reunalta".
- **Rotation:** the local spare rotation starts from the synced spare rotation. Rotate adds 90°, and it resets when a new spare arrives.
- **Animation:**
  - `TileView` positions via `style={{ transform: translate(x px, y px) }}` with `transition: transform 200ms ease`. Tiles are keyed by id, so moved tiles slide; the global reduced-motion rule disables it.
  - The inserted tile appears in place and the pushed-out tile disappears. A fly-in from the spare is out of scope.
  - The same transition animates the preview.

### 6. Turn line and notices
- `TurnLine` (game component) sits above the board. It shows the seat pawn shape and colour (reusing `Pawn` in a tiny SVG) and a sentence from i18n (`turn.mine` / `turn.other`).
- `ui/Notice` is a shared, small, polite status message (`role="status"`) that fades out. It is used for rejection messages from `errors.<CODE>` in fi/en (a missing code falls back to `errors.generic`).

## Risks / Trade-offs

- [Preview and server disagree] → Both call the same `shiftBoard`. The server's state wins: the preview is dropped as soon as the synced board changes.
- [Arrow glyph on a tile hides part of its corridor] → Drawn small (18 units) at the tile's outer edge, where a corridor would lead off the board anyway.
- [First-joiner-starts is not the final rule] → Isolated in `onJoin`; `lobby` replaces it with a random start.
- [Protocol duplicating the insertion ids] → A cross-package test keeps them equal.
