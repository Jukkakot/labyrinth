# Proposal

## Why

Everything built so far is invisible: the rules exist only in tests, and the phone shows a title page. `show-board` is the first vertical slice. A player taps Play on their phone, lands in a game, and sees the real starting board set up by the server. This puts the mobile board layout, the client–server state sync and the tooling (E2E tests, production logs) under real use before any game action is built on top.

## What Changes

- **Quick play:** the start screen gets a Play button. It joins an open game with a free seat or creates a new one, while the Render server may still be waking up.
- **Server-side game setup:** each new game gets a fresh random seed and the original starting board (`setupBoard`). The seed is logged but never sent to clients. The board is synced as tile ids and rotations only.
- **Seats:** up to 4 players per game, seated clockwise on the start corners. Each player's pawn is shown on their corner in colour + shape.
- **One player per browser tab:** reloading the page returns to the same game and seat.
- **Board view:** the whole 7×7 board and the spare tile fit a 360 px wide phone. Tiles use the corridor style with Tabler treasure icons, and fixed tiles are recognisable.
- **Game id badge** at the top. Tapping it copies "game id · local time · version" for bug reports.
- **UI foundation:** CSS Modules on shared design tokens and reusable components (button, badge, tile, pawn).
- **Treasure names** aligned with the chosen icon set (names only; rules unchanged).
- **Playwright E2E tests** on the Galaxy S24 profile, run in CI. A production check of leaving a game through Render's proxy.
- Workspaces touched: rules (treasure names), server, client, plus a new `e2e` workspace.

Out of scope:
- Shifting (`tile-shift`) and moving (`pawn-movement`).
- Nicknames and the game list (`lobby`).
- Turn order and targets (`treasures-and-win`, `turn-rules`).

## Capabilities

### New Capabilities
- `game-session`: quick play, game creation with a seeded board, seats and start corners, one player per tab with rejoin on reload, hidden seed.
- `board-view`: how the board, tiles, treasures, pawns, spare tile and game id badge are shown on a phone.

### Modified Capabilities
- `observability`: adds a requirement to log each game's setup with its seed, so a game's starting board can be reproduced from the logs.

## Impact

- **packages/rules**: `TREASURES` renamed (8 of 24 names); tests updated.
- **server**: `GameState` gains board, spare and seats; `GameRoom` sets up the board on create; new `game.setup` log event.
- **client**: new dependencies `@colyseus/sdk` and `@tabler/icons-react`. Start and game screens, board components, a connection hook with sessionStorage rejoin, a design-token stylesheet and shared components. Must stay within the 200 kB bundle budget.
- **e2e** (new workspace): `@playwright/test`, Galaxy S24 project, CI job.
- **Wiki**: architecture (state sync Implemented, client structure, UI foundation), development (E2E).
