# Tasks

## 1. Rules: treasure names

- [x] 1.1 Rename `TREASURES` to the icon-aligned names (design §7); verify rules tests pass unchanged, including the golden board

## 2. Server: seeded game, seats, synced board

- [x] 2.1 Extend `GameState` with `squares`/`spare` (`TileState { id, rotation }`) and `Player.seat`; in `GameRoom.onCreate` draw a seed (node:crypto), `setupBoard`, copy into state and log `game.setup` (add to the event catalogue); verify room tests: the client's synced squares/spare equal `setupBoard(seed)` for the logged seed, no seed in client state, two rooms get different seeds
- [x] 2.2 Assign the lowest free seat 1–4 on join; verify room tests: seats 1,2,3 in join order, a freed seat is reused, a fifth `joinOrCreate` lands in a new room

## 3. Client foundation

- [x] 3.1 Move colour tokens into `client/src/ui/tokens.css` (plus spacing, radii, tap size, seat colours); add `ui/Button` and `ui/Badge` with CSS Modules; move the crash screen onto `Button`; verify component tests and a visual check of the start and crash screens on Galaxy S24 (Playwright MCP)
- [x] 3.2 Add `@tabler/icons-react`; create `game/treasureIcons.ts` (exhaustive over `TreasureId`) and `treasures.*` names in fi/en; verify a test that all 24 treasures map to 24 distinct icons and the locale parity test

## 4. Client game

- [x] 4.1 Add `@colyseus/sdk`; create `useGameSession` (join/reconnect via sessionStorage token, view model from state, `setLogContext`, `client.conn.lost/restored` logs, error state); verify unit tests of the state-to-view mapping (board rebuilt with `createBoard`, seats) and of token handling (stored on join, cleared on failed reconnect)
- [x] 4.2 Create `game/TileView`, `game/Board`, `game/Pawn`, `game/SpareTile` (corridor style, fixed-tile mark, treasure icons with accessible names, seat shapes and colours, own pawn marked); verify component tests: corner open E,S draws exactly two corridor arms, the dragon tile's accessible name, seat shapes
- [x] 4.3 Create `game/GameIdBadge` (copy line, "Kopioitu", selectable fallback) and `screens/StartScreen` / `screens/GameScreen` (connecting and slow-server states, error with retry); verify component tests for the copy line and fallback, and the error state
- [x] 4.4 Check the bundle budget with the SDK and icons; verify `npm run size -w @labyrinth/client` passes and record the size

## 5. E2E

- [ ] 5.1 Create the `e2e` workspace (Playwright, Galaxy S24 project, webServer for server and client) and tests: quick play shows 49 tiles, spare and game id; two contexts join the same game and each sees both pawns with their own marked; reload keeps the seat; the board fits 360×780 without horizontal scroll; verify `npm run e2e` passes locally
- [ ] 5.2 Add the `e2e` CI job (install chromium, run, upload report on failure); verify a green CI run

## 6. Production check

- [ ] 6.1 After deploy, play on https://jukkakot.github.io/labyrinth/ with Playwright MCP (Galaxy S24, two tabs): board shown, same board in both, badge copy works; find the game's `game.setup` line in Render logs and confirm `setupBoard(seed)` reproduces the shown board; verify with screenshots
- [ ] 6.2 Investigate `room.leave()` through Render's proxy (design §10) and record the finding in `docs/operations.md`

## 7. Wiki

- [ ] 7.1 Update `docs/architecture.md` (State sync principle and client identity → Implemented with the actual schema, client structure, UI foundation and component rule, treasure icons) and `docs/development.md` (E2E: how to run, where reports go); mark `show-board` done in `openspec/context/roadmap.md`; verify links resolve
