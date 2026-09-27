# Proposal

## Why

The game id in the top-left corner copies a bug-report line ("Peli brave-otters-sing · 26.9.2026
14.32 · v a1b2c3d"). Players rarely report bugs, but they often want to bring a friend into the game
they are in. The id is the natural handle for that: tapping it should hand out a link that opens
the game, not a line only the developer can use.

## What Changes

- Tapping the game id of a server game opens the share sheet with the game's link (the same
  `?game=<id>` invite link the waiting room's "Kutsu pelaajia" uses), or copies the link where
  there is no share sheet, and confirms "Linkki kopioitu". In the waiting room the share text asks
  to join; once the game runs it asks to watch. The link itself is the same: invite links already
  seat a friend in the waiting room or, once the game has started, make them a spectator.
- If neither sharing nor copying works, the link is shown selectable.
- Games on the device ("Päivän pulma", "Oma peli") have no link: their badge becomes a plain label
  that does nothing on tap.
- The bug-report line moves to the settings screen: a new "Vianilmoitus" section shows the line
  (game id when opened from a game, local date and time, app version) and copies it on tap.
- **BREAKING (UI):** tapping the id no longer copies the bug-report line.

Workspaces: client only.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `board-view`: the game identifier badge shares the game's link instead of copying the
  bug-report line; device games show a plain label (REMOVED + ADDED).
- `settings`: new requirement for copying the bug-report line from the settings screen.

## Impact

- Client: `game/GameIdBadge.tsx`, `game/copyLine.ts`, `settings/SettingsScreen.tsx`, i18n,
  tests. `GameScreen` must pass the room id to the settings screen and `WaitingRoomScreen` must
  mark its badge as a join link (small wiring, done by the coordinator).
- Wiki: `docs/operations.md` (how a player gives the bug-report line).
