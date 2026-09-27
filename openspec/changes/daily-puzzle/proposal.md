# Proposal

## Why

Roadmap item 19. Single player comes first (direction 2026-09-27), and a short daily challenge
gives a reason to come back every day and something to share with friends, like Wordle. It builds
on local play: the whole game runs on the device, offline, with no server.

## What Changes

- **Päivän pulma / Daily puzzle** on the start screen: a solo game with no opponents, the same for
  everyone on the same calendar day (board, spare and treasures from a seed of the date).
- Goal: find **3 treasures** in order and return home in as few turns as possible. The score is
  the number of turns.
- One scored attempt per day: the game is saved on the device, leaving keeps it (the button
  continues it), and once solved the button is disabled and the start screen shows the result with
  a **share** action (share sheet, else clipboard). A new puzzle at local midnight.
- In the puzzle: no hint, no turn clock, no rematch; the turn line shows the turn number; the end
  shows the result with share and home.
- The shared text: title with the date, turn count, one mark per turn (💎 a treasure found,
  🏠 home, ⬜ otherwise) and the app link.

Workspaces: **rules** (daily seed and puzzle start), **client** (start screen, local puzzle game,
result record, game screen differences, share text). **server** untouched.

## Capabilities

### New Capabilities

- `daily-puzzle`: the daily solo puzzle: same puzzle per date, goal and score, one attempt,
  resume, result and sharing.

### Modified Capabilities

(none; the start screen entry and the game screen differences are specified in `daily-puzzle`)

## Impact

- `packages/rules`: new `daily.ts` (date → seed, puzzle start with a 3-card stack), exported.
- `client/src/session`: `localGameStore.ts` (separate save slot for the puzzle), `localRoom.ts`
  (daily game kind, turn marks recorded), new `dailyRecord.ts` (today's attempt and result),
  `useGameSession.ts` (start/continue the puzzle).
- `client/src/screens`: `StartScreen.tsx` (button, result, share), `GameScreen.tsx` (no hint,
  turn number, puzzle end).
- i18n fi/en texts; logs `client.daily.started` / `client.daily.finished`.
- Wiki: architecture (local play → puzzle), product context; roadmap item 19 done.
