## Why

Treasures that have already been collected keep their icon on the board, so the board mixes what is
still in play with what is done. Hint and bots already ignore them; the board should too, so a player
sees at a glance which treasures remain.

## What Changes

- A tile whose treasure has been collected by any player is drawn as a plain tile: no treasure icon
  and no treasure name for assistive technology. This applies on the board, in a shift preview and on
  the spare tile (and the tile about to drop out).
- The viewer's own target tile is always drawn with its treasure (and target mark), even in the
  daily-puzzle replay, where the replayed target is already collected at the end.
- Works the same for players, spectators, device games (local bot games) and the daily puzzle,
  because the collected set comes from every player's found list in the synced state.
- How-to-play pictures are unchanged (they show example tiles, not a game).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `board-view`: "Treasures shown as icons" and "Spare tile shown" leave collected treasures out.

## Impact

- Workspaces: client only (`client/src/game`: tile, board and spare rendering; a small helper for the
  collected set). No rules, server or protocol change: `found` lists are already synced to everyone.
- The screen that renders the spare-tile controls must pass the collected set to them (wiring in the
  game screen).
