## 1. Rules

- [ ] 1.1 `dailySolver.ts`: `fewestTurns(board, start, maxTurns)`; tests on fixture boards (1-turn, 2-turn, reverse push excluded) and a time bound
- [ ] 1.2 `daily.ts`: `startDailyPuzzle(date, name)` → `{ game, par }` with one destination of par 2; `applyPuzzleMove` finishes on the treasure; tests

## 2. Client session

- [ ] 2.1 `dailyRecord.ts`: record `{ date, roomId, par, best? }`, best kept across attempts; marks row and share lines with par
- [ ] 2.2 `localRoom.ts`: daily game from the new start, par in state and save, history and `undo` command, win via `applyPuzzleMove`, best written; `playDaily` with retry; tests

## 3. Client screens

- [ ] 3.1 View model `par`; turn line and end text; `undo()` in the session; "Peru" in both control rows; hint on
- [ ] 3.2 End row (Alkuun, Uudelleen, Jaa tulos); start screen with best vs. par, button playable after a solve; texts fi/en; render tests

## 4. Verify, docs

- [ ] 4.1 UI check on the phone (portrait): puzzle turn with par, undo, the end row fits
- [ ] 4.2 Wiki (`docs/architecture.md`, `openspec/context/product.md`)
- [ ] 4.3 Check chain, commit, push
