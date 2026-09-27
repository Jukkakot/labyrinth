# Design

## Context

The look-ahead bot (`botLookahead.ts`, change `smarter-bots`) takes a `BotView` (board, seats'
pawns and card counts, last insertion, own target) and returns a whole turn. The client already
has everything a hint needs: the synced board, every seat's pawn and public found list, the card
counts, the last insertion and the viewer's own target. The server's bots are driven by
`GameRoom.ts`, which this change cannot touch (a parallel job owns other files; see "Follow-up").

## Goals / Non-goals

- Goal: a hint that is exactly "what the best bot would do in your seat", computed on the device,
  fair (no hidden information), deterministic, and cheap enough to run on a tap.
- Goal: the bot excludes found treasures from an opponent's possible targets.
- Non-goal: hint limits, scoring or a "hints used" count; explaining why the move is good.

## Decisions

1. **Found treasures in the bot view.** `BotSeatView` gains an optional `foundTreasures` list. The
   look-ahead unions every seat's list (the deck is dealt out without repeats, so a treasure found
   by anyone is no one's target) and counts an opponent's chance as the share of the remaining
   possible treasures (all 24 minus its own target minus the found ones) within its reach. If none
   remain, that opponent's chance is 0. Optional, so callers that do not pass it (the server until
   the follow-up) get the old behaviour exactly; the tournament simulation passes it.
2. **Hint = the bot, always minding the opponents.** The hint uses the default weights with
   `blockChance: 1`: the one-in-five selfish turns exist only so bots cannot lock a game, which is
   not a concern for a suggestion, and it makes the hint independent of a random draw.
3. **Deterministic tie-break.** Equal choices are picked with an rng seeded from a hash of the
   position (tile ids and rotations, spare, seat, pawns, last insertion). The same position
   always gives the same hint; different positions vary the tie-break as the bots do.
4. **Move-step hint.** The look-ahead's per-shift evaluation is factored out, so the same scoring
   runs for one already-made shift (the synced board, the shift just made as the next reverse):
   `hintMove` returns the best square to walk to. When the player made exactly the hinted shift
   (same insertion, the inserted tile turned the same way), the client keeps the destination
   hinted in the shift step instead, so following a hint never moves the ring to an equally good
   but different square.
5. **Showing it.** The shift-step hint reuses the preview: it selects the arrow and turns the spare
   (the existing preview then shows the moved line, the dropping tile and the reach rings), and a
   hint ring marks the destination. The ring is a thick ring with a light halo, larger than the
   reach rings and unlike the dashed move outline, with an aria label naming the square; it is
   shown only while the preview matches the hinted shift and rotation. Once pressed, the hint stays
   on for the rest of the viewer's turn, so after the shift the move-step ring appears by itself.
6. **The button.** A secondary button with a bulb icon and the text "Vihje" in the spare-tile row of
   both step controls (after the rotate button in the shift step), 44 px tall; disabled on other
   players' turns and while a command is pending, never hidden in those controls. Unlimited:
   against bots nobody is disadvantaged, and in a game with people everyone has the same button.
7. **Where the code lives.** The hint itself (`botHint.ts`: `hintTurn`, `hintMove`, seeding) is in
   the rules package and tested there; the client only maps its view to a `BotView`
   (`client/src/game/hint.ts`) and draws.

## NFR

- Logging: nothing is sent to the server and no server state changes, so no log events. The hint
  is not an audit-relevant action.
- Tests: rules unit tests for found treasures and for the hint (determinism, collecting when
  possible, reachable destination, move step); a client test for the view-to-bot-view mapping;
  one GameScreen render test (button disabled off-turn, pressing it previews the shift and rings
  the square). The UI check is left to the coordinator (this job may not run dev servers).
- Limits/performance: one look-ahead run per press, the same cost as a bot turn (a few ms on a
  desktop, tens of ms on a phone); computed on press, never per render. No bundle growth beyond
  the rules code that is already in the client bundle.

## Risks

- The server's bots ignore found treasures until `GameRoom.ts` passes the lists (follow-up), so
  the hint may block slightly differently from the bots for a while. Harmless.

## Follow-up (outside this change's files)

- `server/src/rooms/GameRoom.ts`: when building the bot's `BotView`, set each seat's
  `foundTreasures` from the player's public found list.
