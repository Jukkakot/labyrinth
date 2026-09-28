## Why

The game works and reads well, but its big moments pass quietly: a treasure is collected with only
a notice line, a win is a line of text, the spare jumps between rotations and a shift makes no
sound. A little motion and sound at these moments makes the game feel finished, without adding
controls or text.

## What Changes

- **Treasure pickup effect:** when any player collects a treasure, its icon rises from the square and
  fades while a ring in the collector's colour widens (under a second). Everyone sees it.
- **Win celebration:** when a game ends with a winner, the winner's pawn hops a few times and small
  pieces in the players' colours burst from its square once. The daily puzzle's finish celebrates the
  player's pawn the same way.
- **Spare turns smoothly:** the rotate button turns the spare tile with a short rotation instead of
  a jump.
- **Sounds:** a soft low "thud" when a shift lands (players, not spectators), a rising three-note
  tune when the viewer wins or solves the puzzle, and a short lower one when someone else wins.
  All under the existing "Äänet" setting.
- Reduced motion: no hop, no burst, no pickup effect, no rotation.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `board-view`: new requirements for the pickup effect, the win celebration and the spare's turn.
- `settings`: the Sounds requirement lists the new sounds.

## Impact

- Workspaces: client only (`client/src/game` marks and spare, `settings/feedback.ts`, game screen
  wiring). No rules, server or protocol change; no new dependencies (SVG and CSS only).
