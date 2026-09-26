# Proposal

## Why

Players can shift and walk, but the game has no goal: nobody hunts anything and nobody can win.
Treasure hunting and the return to the start corner are what make Labyrinth a game, so they are
the next roadmap item (7) and what `turn-rules`, `lobby` and `bot-player` build on.

## What Changes

- **Treasure cards are dealt** from a seeded shuffle of the 24 treasures, evenly per seat. Until
  the waiting room exists (`lobby`), each of the four seats gets its own stack of 6 when the game
  is created; whoever takes a seat plays that seat's stack. The rules function deals any 2–4
  seats evenly, so `lobby` can deal 24/n at the start instead.
- **Current target:** a player hunts one treasure at a time, the top card of their stack. The
  current target is secret: only its owner receives it. How many cards each player has and
  which treasures they have already found are public (face-up cards in the original).
- **Collecting:** when the current player's move ends (staying counts) on the tile carrying their
  current target, the treasure is collected and the next card becomes the target. A shift alone
  never collects; another player's target under your pawn does nothing.
- **Going home and winning:** after the last card the target is the player's own start corner.
  Ending a move there wins; the game is finished at once. In a finished game every shift and move
  is rejected with `WRONG_PHASE`, and quick play never joins it.
- **Client:** the own target is always highlighted on the board (or on the spare when it is
  there; the start corner when heading home), with a marker that is not colour alone. A compact
  player strip shows each seat's pawn and found/total count, and your own target. A collected
  treasure is announced briefly. When the game ends, the turn line becomes the result ("Voitit!"
  / "Pelaaja 2 voitti") and a "Uusi peli" button returns to the start screen.

Workspaces touched: `packages/rules` (dealing, collect/win step), `packages/protocol` (phase
`finished`, log events), `server` (stacks, hidden target, collect and win in `move`, lock on
finish), `client` (target highlight, player strip, result, leave).

## Capabilities

### New Capabilities
- `treasures`: dealing the treasure cards, the secret current target, collecting, returning home,
  winning and the finished game.

### Modified Capabilities
- `board-view`: own target highlighted, player strip with progress, collected message, result
  and "new game" at the end.
- `game-session`: quick play never joins a finished game.
- `turns`: a finished game has no further turns; the winner's turn is the last one.

## Impact

- Synced state: `Player` gains `cards` (stack size), `found` (collected treasures, public) and a
  view-filtered `target`; `GameState` gains `winnerSeat` and `phase` takes `"finished"`. Client
  and server are deployed together.
- Protocol: `TURN_PHASES` gets `finished`; log events `treasure.collected`, `game.finished`,
  `game.dealt`.
- Tests: rules unit + property tests (deal), server room tests (collect, win, hidden target,
  finished game), client component tests. E2E smoke test unchanged.
- Docs: `docs/architecture.md` (state sync, hidden information, game flow), roadmap item 7 done.
