## Why

A new player gets four one-time tips in their first game, but nothing explains the rules before
they start or lets them look something up later (why an arrow is blocked, what happens to a pawn
pushed off the edge, how the daily puzzle scores). A short illustrated rules page fixes that
without a manual.

## What Changes

- A "Näin pelaat" / "How to play" screen: the rules in a few short sections, each with a small
  picture drawn with the game's own tiles and pawns: the goal, push a tile, walk, treasures,
  return home, and the daily puzzle's rules.
- Opened from the start screen (a link under the tagline) and from the settings screen, so it is
  also reachable during a game through the gear; "Takaisin" returns where the player came from.
- Finnish first, English second; minimalist; built for a phone in portrait.

Workspaces: **client** only (no rules, server or protocol change).

## Capabilities

### New Capabilities

- `how-to-play`: the rules screen, where it opens from, and what it must explain.

### Modified Capabilities

(none; the settings screen only gains a link, which the new spec states)

## Impact

- `client/src/howto/` (new): the screen and its pictures.
- `client/src/screens/StartScreen.tsx`, `client/src/settings/SettingsScreen.tsx`: the entry link.
- `client/src/i18n/locales/{fi,en}.json`: the texts.
- `docs/architecture.md` (client screens), `openspec/context/roadmap.md` (backlog note).
