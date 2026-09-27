# Tasks

## 1. Protocol

- [ ] 1.1 Join options `watch`, `speed` (1/2/4), `botSeats` (unique seats 1–4, at most 3), `bots` 1–4 with the combination rules of design §4; `BOT_SPEEDS`; commands `setSpeed { speed }` and `rematch {}`; error codes `NOT_SPECTATOR`, `PEOPLE_PLAYING`, `SERVER_FULL`; log events `spectator.joined`, `spectator.left`, `game.rematch` — schema tests in `game-schema.test.ts` pass

## 2. Server: spectators and bot-only games

- [ ] 2.1 Synced `spectators`, `botSpeed`, `rematchRoomId`; metadata `watchable`; spectator set, `maxClients` 12 after the start, spectator views with every player, `spectator.joined/left`, holds for dropped spectators — room tests: joining via the route, all targets visible to the spectator, a player's view still private, spectator commands `NOT_SEATED`, 9th spectator refused
- [ ] 2.2 `POST /watch` route (validated options, `watchable` check, `reserveSeatFor`), audited — tests: running game ok, waiting/finished/unknown/private-quick refused
- [ ] 2.3 Watch-created bot games (`watch`, `bots` 2–4, `speed`): creator is spectator, bots seated 1..n, started at once, private — room test: 3 bots start with 8 cards each and play (short delays)
- [ ] 2.4 End rule: finish `noPeople` only when no person is seated and no spectator (held ones count) — tests for the bots spec scenarios, including the last spectator leaving
- [ ] 2.5 `setSpeed` command and speed-scaled bot delays — tests: rejections in order, delays shortened

## 3. Server: rematch

- [ ] 3.1 `botSeats` join option seats bots in `onCreate`; `rematch` command creates one new room with the same settings (private, pool, bots of the start or quick `bots`), idempotent, `SERVER_FULL` rejection, `game.rematch` log — room tests for every game-session rematch scenario that the server decides

## 4. Client: session and view model

- [ ] 4.1 View model: `spectating`, `spectators`, `botSpeed`, `botOnly`, `rematchRoomId`, per-seat targets for spectators, current player's target tile — viewModel tests
- [ ] 4.2 `useOpenGames` lists open and running games from one lobby connection (filter by pool only) — tests for the split
- [ ] 4.3 `useGameSession`: `watch(roomId, nickname)` via `/watch` + seat reservation, `watchBots(n, speed, nickname)`, `setSpeed`, `rematch()` (command → wait for id → leave → join), invite fallback to watching with a one-off notice; dev shortcut `?dev=0vN` — session tests

## 5. Client: screens

- [ ] 5.1 Start screen: "Käynnissä olevat pelit" section and "Katso bottien peliä" 2/3/4 group, disabled like Play — render test for the running list tap
- [ ] 5.2 Game screen: spectator panel (text, speed control, finished actions), eye count in the top bar, no confirm on spectator leave, all targets in the strip, finished controls "Pelaa uudelleen" + "Alkuun" — a few render tests; fi/en strings
- [ ] 5.3 UI check on the reference phone (portrait): watch a 3-bot game, change speed, finish; play 1v1 to the end and rematch; spectator count seen by a player

## 6. Wiki, roadmap, checks

- [ ] 6.1 docs/architecture.md (spectators, watch route, rematch, end rule, state fields), docs/operations.md if the log events list is there; roadmap item 12 marked done
- [ ] 6.2 Full check chain (`lint`, `typecheck`, `test`, `build`, `size`) green; commit and push
