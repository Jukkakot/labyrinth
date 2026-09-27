# Proposal

## Why

On a phone the top-bar game id badge of a game on the device (`local-daily-mujxitgji577`) is so
long that it wraps to two lines and crowds the top bar. The id is only useful in a bug report;
the player needs to see which game this is, not a random suffix (backlog item "Game id badge in
local games").

## What Changes

- The badge of a game on the device shows a short label instead of its id: "Päivän pulma" /
  "Daily puzzle" for the daily puzzle, "Oma peli" / "Own game" for other games on the device.
  Server games keep showing their readable id (`brave-otters-sing`).
- Tapping the badge still copies the full line with the real id, date and time, and version, so a
  bug report of a local game can still be traced.
- The badge stays on one line at phone width (no wrapping inside the badge).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `board-view`: "Game identifier badge" — games on the device show a short label; the copied line
  keeps the full id; the badge fits on one line.

## Impact

- Workspaces: **client** only (`GameIdBadge`, its CSS, fi/en strings, a render test).
- No protocol, server or rules change; no new dependencies.
