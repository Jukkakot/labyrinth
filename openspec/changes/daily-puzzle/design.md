# Design

## Context

Quick games against bots already run on the device: `LocalRoom` implements `GameRoomLike` over
the rules engine (`startGame`, `applyShift`, `applyMove`), saves one game in localStorage
(`labyrinth.localGame`) after every step and is reached through `local-…` room ids and `local:…`
tokens. The engine plays a one-seat game fine: after a move the turn passes to the same seat and
`turn` counts up; a win leaves `turn` at the winning turn. The waiting room already shares an
invite through the share sheet or the clipboard.

## Goals / Non-Goals

**Goals:** a daily solo puzzle on the device, the same per date, one scored attempt, a
Wordle-style shareable result.

**Non-Goals:** leaderboards or any server part, past puzzles / archive, streak statistics,
practice replays of a solved puzzle, difficulty levels.

## Decisions

1. **Date and seed.** The puzzle date is the device's local date (`YYYY-MM-DD`); players in the
   same time zone share it, and a new puzzle starts at local midnight. `dailySeed(date)` hashes the
   date string (FNV-1a) into the seed range; the board, spare and deal come from `startGame` with
   that seed and one seat, as any game. A date string rather than a day number keeps it readable
   in logs.
2. **Goal: 3 treasures, then home.** One treasure is often solved in one or two turns and gives
   no spread; the whole stack of 24 is far too long for a daily. 3 treasures plus home gives a
   game of a few minutes with scores spread over several turns. `startDailyPuzzle` cuts the
   one-seat stack to its first `DAILY_TREASURES = 3` cards. Tunable later.
3. **Score = turns.** `state.turn` when the game finishes (the engine does not advance it on the
   win). Fewer is better.
4. **Own save slot.** The puzzle game is saved under `labyrinth.dailyGame`, chosen by its room id
   prefix `local-daily-`, so a quick game (`labyrinth.localGame`) never replaces it and the other
   way round. Everything else about local games (tokens, restore, the session) stays as is.
5. **One attempt, record per date.** `labyrinth.daily` holds `{ date, roomId, result? }` with
   `result = { turns, marks }`. The puzzle button: no record for today → start; record without
   result and the saved game exists → continue it; result → disabled, result and share shown.
   A record of an earlier date is replaced on the next start. If today's saved game is lost
   (storage cleared), a fresh attempt starts: storage is the only memory and that is acceptable
   for a casual puzzle.
6. **Leaving keeps the puzzle.** Unlike a quick game, leaving an unfinished puzzle does not end or
   clear it (solo, nobody waits); the leave button still returns to the start screen without a
   confirmation. After a solved puzzle, leaving clears the saved game; the result stays in the
   record.
7. **Per-turn marks.** The local room records, per finished turn, whether a treasure was found
   (`found` grew) or home was reached; the list becomes the result's marks (`t` treasure,
   `h` home, `-` plain), turned into emoji only in the share text.
8. **Game screen.** The view model knows the puzzle from the room id prefix (no protocol change).
   Puzzle: the hint button is not rendered (the score must mean the player's own play), no turn
   clock (local games have none), the turn line adds "Vuoro N", game over shows
   "Ratkaisit päivän pulman N vuorossa", share and home.
9. **Share.** Text in the UI language: `Muuttuva labyrintti – päivän pulma 27.9.2026`, `6 vuoroa`,
   the marks row, the app's URL (origin + base path). Share sheet where `navigator.share` exists,
   else clipboard with a short "Kopioitu" confirmation, as the invite link does; the share helper
   moves to a shared module used by both.
10. **Start screen placement.** The puzzle is a separate section under the quick bot game
    ("Päivän pulma" button with a one-line explanation), not mixed into the 1v1–1v3 choices. It
    does not need the nickname field to be filled; the player's name defaults to the nickname or
    "Sinä".

## Risks / Trade-offs

- Local date: players in different time zones see different puzzles on the same moment; fine for
  a Finnish-first audience.
- Some seeds may give an unusually easy puzzle (first treasure next to the start); acceptable, the
  score spread over three treasures evens it out.
- Clearing site data allows a new attempt; no server check by design (0 € budget, no accounts).

## NFR

- Logging: `client.daily.started` (date, seed) and `client.daily.finished` (date, turns) through
  the client log shipping; no personal data.
- Tests: rules unit tests for `dailySeed` (stable, differs by date) and `startDailyPuzzle` (one
  seat, 3 cards, deterministic); client unit tests for the daily record, the separate save slot,
  the local room's marks and score, the share text; a few render tests (start screen states, no
  hint in the puzzle, puzzle end). No E2E change (the smoke test path is unchanged).
- Performance: no new dependency; `npm run size` stays under budget.
- Abuse: nothing reaches the server.
