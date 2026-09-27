# Proposal

## Why

On a phone the app is often closed mid-game (swiped away, browser tab closed). The seat is still
held for 5 minutes, but the reconnection token lives in the tab's session storage, so a newly
opened app has no way back and the game is lost. The start screen should offer "Jatka peliä"
instead. Joined with the backlog item "Server wake-up progress": the same start screen shows only a
static "Herätetään palvelinta…" while the server wakes, which looks stuck during a wait of up to a
minute.

## What Changes

- The client also remembers the current game in the browser's persistent storage (per browser, not
  per tab) while the player holds a seat in a running game, with the time it was last seen alive.
- A newly opened start screen offers "Jatka peliä" when such a game is remembered and was seen
  within the 5-minute hold; tapping it rejoins the same seat. If the seat is gone, a calm notice
  says the game is no longer available and the offer disappears.
- Starting any other game, leaving, being kicked or the game finishing forgets the remembered game.
  Spectators are not offered a resume.
- Reloading a tab keeps working as before (automatic rejoin, per tab).
- While the server wakes, the start screen counts the seconds waited ("0:23") next to a loading
  animation (static when the player prefers reduced motion).

Workspaces: client only (no server or rules change: the server already holds a dropped seat for 5
minutes and accepts the reconnection token).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `game-session`: adds resuming a game after the app was closed, and visible progress while the
  server wakes up.

## Impact

- `client/src/session/` (a remembered-game store beside the per-tab token, `useGameSession`
  resume action), `client/src/screens/StartScreen.tsx` (+ CSS), `client/src/App.tsx`, i18n
  `fi.json`/`en.json`.
- Tests: session hook and store unit tests, a start-screen render test.
- Wiki: `docs/architecture.md` client session section.
