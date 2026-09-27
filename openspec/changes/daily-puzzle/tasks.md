## 1. Rules

- [ ] 1.1 `packages/rules/src/daily.ts`: `dailySeed(date)`, `DAILY_TREASURES`, `startDailyPuzzle(date, name)`; export from the index
- [ ] 1.2 `daily.test.ts`: same date → same game, other date → other board, one seat with 3 cards; solo turns count up and the win keeps the turn

## 2. Client: puzzle game and record

- [ ] 2.1 `localGameStore.ts`: `local-daily-` room ids and the `labyrinth.dailyGame` slot; tests that quick and daily saves do not replace each other
- [ ] 2.2 `dailyRecord.ts`: today's date string, load/save `{ date, roomId, result? }`, share text builder; tests
- [ ] 2.3 `localRoom.ts`: `LocalRoom.createDaily(name, date)`, per-turn marks, result written to the record on the win, leaving keeps an unfinished puzzle, logs; tests
- [ ] 2.4 `useGameSession.ts`: `playDaily()` (start or continue today's puzzle); session test

## 3. Client: screens

- [ ] 3.1 Shared share helper (share sheet, else clipboard) used by the waiting room and the puzzle
- [ ] 3.2 `StartScreen.tsx`: puzzle section (start/continue, solved: disabled button, result, share); render test for the solved state
- [ ] 3.3 `GameScreen.tsx` / view model: puzzle flag, turn number in the turn line, no hint, puzzle end with share and home, leave without confirmation; render test
- [ ] 3.4 i18n fi/en texts

## 4. Verify, docs

- [ ] 4.1 UI check on the phone (portrait): start screen section, a puzzle turn, the solved state (reached with a seeded helper in the console if needed)
- [ ] 4.2 Wiki: `docs/architecture.md` (local play → daily puzzle, storage keys), `openspec/context/product.md` (modes); roadmap item 19 done
- [ ] 4.3 Check chain, commit, push
