## Why

Roadmap item 22 (`share-and-colors`): sharing the invite link through the share sheet is already
built; what is left is letting a player pick their own pawn. Today the pawn is fixed by the seat
(seat 1 is always the blue circle), so a player never gets "their" colour.

## What Changes

- Four pawns, as today: a colour-blind-safe colour always paired with a shape (blue circle, orange
  square, green triangle, pink diamond). The pair is never split, so colour is never the only cue.
- A player picks their pawn on the start screen ("Nappulasi"); the choice is remembered on the
  device like the nickname and used in every game they start or join.
- Joining an online game gives the preferred pawn when it is free, otherwise the seat's own pawn
  when free, otherwise the first free one. Bots get their seat's pawn when free, otherwise the first
  free one. Without a stored choice everything looks as today.
- In the waiting room a seated person can change their pawn to any free one (taken ones are shown
  disabled); new command `setLook`, rejected with `LOOK_TAKEN` when another player holds it.
- Games on the device (quick games against bots, the daily puzzle) give the player their pawn and
  the bots the others.
- Every place that shows a player's pawn or colour (board, player strip, turn line, result, waiting
  room, last-move marks) uses the player's pawn, not the seat's.

Workspaces: **protocol** (look field, command, error code, assignment helper), **server** (schema,
join, bots, command), **client** (start screen picker, waiting room picker, device games,
rendering). No change to `packages/rules`.

## Capabilities

### New Capabilities

- `pawn-looks`: the four pawns, the player's choice, how pawns are given out and changed.

### Modified Capabilities

- `board-view`: pawns are told apart by the player's pawn instead of the seat's.
- `bots`: a bot gets its seat's pawn only when it is free.

## Impact

- `packages/protocol/src/game-codes.ts`, `game-schema.ts` (new `looks.ts`).
- `server/src/rooms/GameRoom.ts`, `schema/GameState.ts`.
- `client/src/game/*` (Pawn, PlayerStrip, TurnLine, TurnMarks, PawnLayer), `screens/StartScreen`,
  `screens/WaitingRoomScreen`, `session/{viewModel,localRoom,localGameStore,useGameSession}`, a new
  `session/look.ts`, locales.
- Docs: `docs/architecture.md` (state and commands), roadmap item 22 done.
