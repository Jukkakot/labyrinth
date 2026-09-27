# Design

## Context

`GameIdBadge` shows `roomId` and copies `useCopyLine(roomId)`. Room ids of games on the device
start with `local-` (daily: `local-daily-`), with `isLocalRoomId` / `isDailyRoomId` in
`session/localGameStore.ts`. The badge sits in the `Screen` top bar's `start` slot in the game
screen and the waiting room.

## Decisions

1. **Label chosen inside the badge from the room id.** `GameIdBadge` keeps its `roomId` prop and
   picks the label itself with the existing prefix helpers, so no caller (hot `GameScreen.tsx`)
   changes.
2. **Labels "Päivän pulma" / "Oma peli"** (en "Daily puzzle" / "Own game"), as the backlog idea
   suggested. "Päivän pulma" reuses the start screen's daily title string (`daily.title`),
   so the same concept reads the same; "Oma peli" says it is the
   player's own game on this device without technical words.
3. **Accessible name for local games** names the label, not the id: "Päivän pulma. Napauta
   kopioidaksesi pelin tunnus." A screen reader reading `local-daily-mujxitgji577` is noise; the
   copied line still carries it. Server games keep "Peli brave-otters-sing. …".
4. **One line:** the label gets `white-space: nowrap`. Server ids are three short words and the
   local labels are short, so nothing needs truncating at 384 px; no ellipsis logic.
5. The copied line is unchanged (`Peli <full id> · date time · v ver`), so the bug runbook still
   finds the game by id.

## NFR

- Logging: none needed (pure display). Tests: one render test file for the badge's labels and the
  copied full id; the existing copy/fallback tests stay. No limits touched.
