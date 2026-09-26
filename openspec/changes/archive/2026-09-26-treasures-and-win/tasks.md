# Tasks

## 1. Rules

- [x] 1.1 Add `packages/rules/src/treasures.ts`: `dealTreasures(seed, seatCount)` (2–4 seats, even chunks of a seeded shuffle), `homeTileId(seat)`, `tileOfTreasure(treasure)`, `targetTileId(seat, target)` and `settleMove(board, { seat, square, target })` → `{ collected?, won }`; export it; verify unit tests named after the `treasures` scenarios (four stacks of six, fewer seats, reproducible, move onto target, stay on target, passing through, someone else's target, heading home, winning, home too early) and fast-check properties (partition of all 24, equal sizes, deterministic)

## 2. Protocol and server

- [x] 2.1 Protocol: `TURN_PHASES` gets `"finished"`; log catalogue gets `game.dealt`, `treasure.collected`, `game.finished`; verify protocol tests
- [x] 2.2 Server: deal seed and four stacks at creation (`game.dealt`); `Player.cards`, `found`, view-filtered `target`; each client's view holds its own player (also after reconnect); `move` settles collect and win (`treasure.collected`, `game.finished`, phase `finished`, `winnerSeat`, room locked, no turn pass); leaving a finished game starts no turn; verify room tests for every `treasures`, `turns` and `game-session` scenario, including a second client decoding no foreign target and a finished room staying closed after a leave

## 3. Client

- [x] 3.1 View model and session: per-seat `cards` and `found`, my `target` (treasure or home) and `targetTileId`, `winnerSeat`/`finished`; `leave()` in `useGameSession`; verify view-model and session tests
- [x] 3.2 UI: `--target` token, target ring + badge on the board and the spare (preview included), `PlayerStrip`, collect `Notice`, result line and "Uusi peli" instead of controls when finished; fi/en strings; verify component tests for the `board-view` scenarios (target on board, on spare, heading home, progress strip, viewer collects, viewer wins, someone else wins) and locale parity
- [x] 3.3 Visual check on Galaxy S24 with two tabs (light and dark): target highlighted, strip fits, collecting updates; verify screenshots, the E2E smoke test and the bundle budget pass

## 4. Wiki and roadmap

- [x] 4.1 Update `docs/architecture.md` (state sync: cards, found, hidden target, winner; hidden information Implemented; rules API `treasures.ts`; game flow: collect, win, finished; client components) and mark `treasures-and-win` done in `openspec/context/roadmap.md`, noting the temporary 4×6 deal for `lobby`; verify links resolve
