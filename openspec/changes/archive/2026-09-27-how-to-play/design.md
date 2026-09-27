## Context

The start screen and the settings screen already swap themselves for a sub-screen through local
state (`settingsOpen`). The game draws tiles with `TileView` and pawns with `Pawn` (SVG in
100-unit squares), so the pictures can reuse them and follow the theme and seat colours.

## Goals / Non-Goals

**Goals:** a short, illustrated rules page reachable before and during a game; no new dependency.

**Non-Goals:** an interactive tutorial, animations, rules of lobby/spectating/autoplay (the UI
explains those where they appear), a rules page for bots' behaviour.

## Decisions

- **Entry points**: a text link "Näin pelaat" under the start screen's tagline (visible without
  scrolling to a first-time player) and a row at the end of the settings screen (the game's top
  bar has no room; the gear already leads to settings, as the language choice does). Not a
  top-bar "?" icon on the start screen: the bar holds gear + language already, and a text link is
  easier to find.
- **Navigation**: local state, like settings: `StartScreen` and `SettingsScreen` each render
  `<HowToPlay onClose>` in place of themselves. No router, no URL (none exists in the app).
- **Pictures**: small `<svg>`s composed of `TileView` and `Pawn` with fixed example tiles (a row
  with the spare and an arrow; a 3×3 corridor patch with the pawn and reachable squares; a
  target-marked treasure tile with the pawn; the home corner). Each picture is `aria-hidden`;
  the text carries the meaning. Arrows and reach dots use the existing theme tokens
  (`--accent`, `--highlight`).
- **Sections**: goal, push, walk, treasures, home, daily puzzle; each a heading, one to three
  short sentences and a picture. The turn clock is left out (it only applies to online games and
  the timer explains itself).
- **Texts** live under a new `howTo` key in both locale files; the locale key-parity test covers
  them.

## Risks / Trade-offs

- Text drifting from the rules when rules change → the spec lists what the page must say, so a
  rules change touching those points also touches this spec.
- Bundle size: a few kB of text and JSX, well within the 200 kB budget.

## NFR

Logging: none needed (no commands, no errors; a static page). Tests: one render test for opening
from the start screen and returning, one for the settings entry, the locale parity test for the
new keys. Limits: none (no network).
