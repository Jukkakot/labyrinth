## Decisions

- **Only the spare under the board is tappable.** The placed tile on the board during a preview is
  often a move target (push and pick), so a tap there must stay "walk here".
- **The tile becomes a button** with its own label ("Ylimääräinen laatta – napauta kääntääksesi") so
  it is reachable by keyboard and screen readers; the 72 px tile is well above the 44 px minimum.
  A light press scale gives feedback; the turn-in animation from `game-polish` plays as with the button.
- **The rotate button stays** for discoverability.

## NFR

No logging (local UI state). Tests: tapping the spare turns it and the shift carries the rotation;
not a button on another player's turn.
