# Tasks

## 1. Found treasures in the bot (rules)

- [ ] 1.1 `BotSeatView.foundTreasures` (optional); look-ahead counts only unfound, non-own
      treasures as an opponent's possible targets (0 when none remain)
- [ ] 1.2 Tournament simulation passes the found lists
- [ ] 1.3 Tests: every other treasure found → same choice as the selfish bot; existing tests pass

## 2. Hint (rules)

- [ ] 2.1 Factor the look-ahead's per-shift evaluation; add a move-step search for an already made
      shift
- [ ] 2.2 `botHint.ts`: `hintTurn`, `hintMove`, position seed, `blockChance: 1`; exported
- [ ] 2.3 Tests: deterministic, collects when possible, move-step square is reachable and collects
      when possible

## 3. Client

- [ ] 3.1 `game/hint.ts`: game view → bot view (own target, public found lists) and the kept
      destination when the hinted shift was made; tests
- [ ] 3.2 Hint ring on the board; "Vihje" button in the shift and move controls; fi/en texts
- [ ] 3.3 GameScreen wiring (preview the hinted shift, ring, stays on for the turn); render test

## 4. Docs

- [ ] 4.1 Wiki: `architecture.md` (bots: found treasures; client: hint)
- [ ] 4.2 Roadmap item 18 and the backlog item marked done (coordinator, at archive); server
      passes found lists to its bots (coordinator)
