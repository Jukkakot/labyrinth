## Why

A new player lands in a running game with a board full of arrows and no idea what to do first.
Roadmap item 16 (`first-game-tips`) asks for a few short tips during the first game, each at the
moment it matters. The backlog item "Hint ring stands out" is folded in: the "Vihje" ring uses the
same orange as the reach rings of the shift preview, so it is only moderately easy to spot.

## What Changes

- Four one-time tips during the player's own game: your target (what you are looking for), push a
  row in from an arrow (own shift step), walk to a highlighted square (own move step), and return
  home once every treasure is found. One at a time, shown when relevant, dismissable, remembered in
  this browser.
- The start screen offers "Näytä vinkit uudelleen" once any tip has been seen; it makes every tip
  show again in the next game.
- The hint ring gets its own look: a different colour from the reach and move marks and a slow
  pulse, static when the viewer prefers reduced motion.

Workspaces: client only (no rules or server change).

## Capabilities

### New Capabilities
- `first-game-tips`: the one-time tips of the first game and resetting them.

### Modified Capabilities
- `board-view`: the Hint requirement's marked square gets a look of its own (colour and motion).

## Impact

- Client: new `client/src/tips/` (tip logic, component, reset link), `TurnMarks` css, start screen
  footer, fi/en locales. The tips component is mounted in `GameScreen` by the coordinator (one
  line); it takes plain props and is independent of the session transport.
- No protocol, server or rules change. Tip state lives only in the browser's local storage.
