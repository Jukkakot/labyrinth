## 1. Tip logic

- [ ] 1.1 `client/src/tips/tips.ts`: tip ids, `pickTip(situation, seen)` (order target → push → walk → home, nothing for spectators or a finished game), storage helpers `loadSeenTips`/`saveSeenTips`/`resetTips` with try/catch and injectable storage; unit tests in `tips.test.ts`

## 2. Tips on the game screen

- [ ] 2.1 `client/src/tips/FirstGameTips.tsx` + `.module.css`: plain props `{ playing, isMyTurn, step, heading }`, one card fixed at the top, lightbulb icon, 44 px close button, polite live region, marks the tip seen when shown, clears it when its moment passes; fi/en texts; render test (shown, closed, not shown again)

## 3. Reset from the start screen

- [ ] 3.1 `client/src/tips/TipsReset.tsx`: "Näytä vinkit uudelleen" link shown only when a tip was seen, confirmation after the tap; mounted in the start screen footer; render test

## 4. Hint ring

- [ ] 4.1 `TurnMarks.module.css`: own yellow ring on a dark halo, gentle pulse, static under reduced motion

## 5. Docs and check

- [ ] 5.1 Update `docs/architecture.md` client section (tips module, local storage keys); run client tests, lint, typecheck; list the GameScreen mount under "Coordinator to do"
