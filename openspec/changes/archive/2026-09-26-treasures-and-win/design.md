# Design

## Context

The room syncs the board, seats, pawn squares, `turnSeat` and `phase` (`shift` → `move`). The
`move` command places the pawn and passes the turn. The static `TILE_SET` already says which tile
carries which of the 24 treasures (`treasureOf(tileId)`), and the start corners are the fixed
tiles 0, 3, 15, 12 (seats 1–4). There is no waiting room yet: players sit down one by one into a
running game, and the first one starts. Nothing is hidden from any client yet.

## Goals / Non-Goals

**Goals:** a seeded even deal, a secret current target per player, collecting at the end of a
move, returning home to win, a finished game that rejects further commands and is closed to quick
play, and the client side: target highlight, progress strip, collect message, result and leave.

**Non-Goals:** dealing at the start of a waiting-room game (`lobby`), "last human remaining wins"
and kicks (`turn-rules`), spectators seeing all targets and rematch (`spectators-and-rematch`),
sounds and celebration effects (`settings`), bots aiming at targets (`bot-player`).

## Decisions

Autopilot decisions (made without review; revisit freely):

1. **Temporary deal: four stacks of 6 at game creation.** Without a waiting room there is no
   moment when the number of players is known. Re-dealing whenever someone joins would change
   other players' secret targets mid-game, so instead each seat gets a fixed stack of 24/4 = 6 when
   the room is created, and whoever takes a seat plays that seat's stack from the first card. With
   2 players, 12 treasures stay unused and the game is shorter than the original. The rules
   function `dealTreasures(seed, seatCount)` already deals 12/8/6 for 2/3/4 seats, so `lobby` only
   calls it at the start with the real seat count — no rework.
2. **Separate deal seed.** The room draws a second random seed for the deal, logged in `game.dealt`
   (server only, never synced). The board setup's draw-order contract stays untouched, and the
   deal is reproducible from the logs. Shuffle = the existing `shuffle()` over `TREASURES`, then
   consecutive chunks per seat (seat 1 first).
3. **Collect only when the move ends there, staying included.** Original rule: the treasure is
   taken by the pawn reaching it with the move; a shift carrying the tile under your pawn lets you
   take it by staying. Passing through does not count. One treasure per move (only the top card is
   looked at).
4. **Target = tile id.** The client highlights the viewer's target by the id of the tile carrying
   it (the treasure's tile, or the start-corner tile when heading home). Tiles are already keyed by
   id, so the highlight follows the tile through shift previews, slides and onto the spare with no
   extra logic.
5. **Hidden target via a view-filtered field.** `Player.target` (treasure id, `""` = heading home)
   is tagged for views; each client's view contains only its own `Player`. `cards` and `found`
   (face-up cards in the original) are public. A server test inspects what another client decodes
   to prove the target does not leak. On reconnect the new client object gets its view again.
6. **Finished game.** A winning move sets `winnerSeat`, `phase = "finished"` and locks the room
   (quick play skips locked rooms); the turn does not pass. Any shift or move then fails the
   existing phase check with `WRONG_PHASE`. Leaving a finished game does not start a turn. Players
   who stay can look at the final board.
7. **Target highlight look:** a solid ring (not dashed like move targets) in a new `--target`
   token plus a small flag badge in the tile's corner, so it is not colour alone and is distinct
   from the move highlight. Home uses the same ring with a home badge. The spare tile shows the
   same ring when it carries the target.
8. **Progress strip** (`PlayerStrip`) sits between the turn line and the board: one compact chip
   per seat with the pawn shape and "found/cards"; the viewer's chip also shows the target icon
   (accessible name "Kohde: lohikäärme") or a home icon. One line on the reference device.
9. **Collect message** reuses the shared `Notice` ("Löysit: lohikäärme"), detected on the client
   when the viewer's `found` grows. Other players' collections only update their counts (no event
   log, per product decisions).
10. **Result:** the turn line becomes "Voitit!" / "Pelaaja 2 voitti" (with pawn), the control slot
    under the board shows only a primary "Uusi peli" button. It calls `room.leave()`; the existing
    leave handling returns to the start screen and clears the tab's token. A player who leaves an
    unfinished game still loses their stack and progress (`product.md`); the seat's next player
    starts it fresh.
11. **Protocol:** `TURN_PHASES` gains `"finished"`. No new commands and no new error codes.

## Risks / Trade-offs

- **2- and 3-player games are shorter** than the original until `lobby` deals 24/n → accepted,
  temporary, and noted in the roadmap item for `lobby`.
- **View-filtered fields are new in this codebase** → covered by a room test that decodes the
  state as a second client; if the view API misbehaves on reconnect, the test catches it.
- **Locked rooms and auto-unlock:** Colyseus unlocks a room that was locked only because it was
  full; an explicit `lock()` stays locked. A room test checks that a finished room stays closed
  after someone leaves.

## NFR check (`openspec/context/nfr.md`)

- **Logging:** new catalogue events `game.dealt { dealSeed }` (at creation),
  `treasure.collected { seat, treasure, found, cards }` and `game.finished { winner }`, plus the
  existing `phase.changed` to `finished`. Commands keep their one audit line; the `WRONG_PHASE`
  rejection after the end carries `phase: "finished"`. No personal data.
- **Tests:** rules unit tests named after the `treasures` scenarios and fast-check properties
  (deal is a partition of the 24 treasures, equal stacks, deterministic); server room tests for
  every `treasures`, `turns` and `game-session` scenario; client component tests for the
  `board-view` scenarios. E2E smoke test unchanged.
- **Limits/performance:** a few bytes of state per player; no new timers or network calls. Bundle
  budget checked with `npm run size`.
- **Abuse:** the server alone decides collecting and winning; the client sends only the same
  `move` command as before.
