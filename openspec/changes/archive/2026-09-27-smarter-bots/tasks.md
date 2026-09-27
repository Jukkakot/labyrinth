# Tasks

## 1. Look-ahead bot (rules)

- [x] 1.1 Fast board model in `botLookahead.ts`: typed-array masks, shift, pawn-after table, BFS
- [x] 1.2 Look-ahead strategy: collect/win, own outlook over next shifts, opponents' chance, even
      blocking with leader weight, stopping the next player's win, `blockChance`
- [x] 1.3 `chooseBotTurn` points to the new strategy; greedy kept as `greedyBotTurn`
- [x] 1.4 Tests for the spec scenarios: reference check of the outlook, blocking the opponents,
      opponent about to win, forbidden reverse, heading home, reproducibility, properties

## 2. Tournament

- [x] 2.1 `botTournament.ts`: whole-game simulation (moved from the test) and `runTournament` with
      rotated seats, win rates and ms per turn
- [x] 2.2 Opt-in tournament test (`BOT_TOURNAMENT=<games>`); tune the weights; record the results in
      `design.md`
- [x] 2.3 Simulation test plays whole games with the new bot (`BOT_SIM=full` passes)

## 3. Docs

- [x] 3.1 Wiki: `architecture.md` (rules modules), `development.md` (how to run the tournament)
- [x] 3.2 Roadmap item 17 marked done (coordinator, at archive)
