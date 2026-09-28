## Why

Turning the spare needs the separate rotate button; the natural gesture is to tap the tile itself
(asked 2026-09-28).

## What Changes

- On the viewer's shift step (also during a preview), tapping the spare tile under the board turns
  it a quarter clockwise, exactly like the rotate button. The button stays.
- The spare is not tappable on other players' turns, in the move step or while a command waits.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `board-view`: Push and pick shift controls (tapping the spare rotates it).

## Impact

- Workspaces: client only (`SpareTile`, `ShiftControls`, fi/en label). No rules, server or protocol change.
