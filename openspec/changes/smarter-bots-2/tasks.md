# Tasks

## 1. Sampling bot (rules)

- [x] 1.1 `botLookahead.ts`: export the fast board model and `scoreTurns` (every choice with its
      score, the blocking draw); the look-ahead's own choice unchanged
- [x] 1.2 `botSampling.ts`: candidates from the look-ahead, fair sampled decks, one-round greedy
      play-outs with common random numbers, turn budget, `samplingStrategy` and `samplingMove`
- [x] 1.3 Tests (`botSampling.test.ts`): collect, heading home, forbidden reverse, reproducibility,
      legality property, move after a made shift

## 2. Tournament and switch

- [x] 2.1 Tune against the look-ahead with the tournament; record numbers and the decision in
      `design.md`
- [x] 2.2 `chooseBotTurn`, `botMoveAfterShift` and the hint use the sampling bot; tournament test
      lineups compare sampling with look-ahead; simulation test timeout raised
- [x] 2.3 `BOT_SIM=full` passes

## 3. Docs

- [x] 3.1 Wiki: `architecture.md` (rules modules), `development.md` (tournament)
- [ ] 3.2 Roadmap backlog item marked done (coordinator, at archive)
