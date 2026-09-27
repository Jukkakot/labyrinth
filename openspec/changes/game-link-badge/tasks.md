# Tasks

## 1. Copy feedback and badge

- [x] 1.1 Add `ui/copyFeedback.ts` (`useCopyFeedback`: idle / copied for 2 s / fallback text)
- [x] 1.2 `GameIdBadge`: server game shares `inviteUrl(roomId)` via `shareOrCopy` with join/watch text (`invite` prop), "Linkki kopioitu" after a copy, selectable URL on failure; device games render a plain label
- [x] 1.3 i18n (fi, en): `game.watchShareText`, `game.linkLabel`, `game.linkFallback`; drop unused keys
- [x] 1.4 Tests in `GameIdBadge.test.tsx` (share, copy, failure, join text, device labels); remove the old badge tests from `screens/screens.test.tsx`

## 2. Bug-report line in settings

- [x] 2.1 `SettingsScreen` takes optional `roomId`; new "Vianilmoitus" section with "Kopioi pelin tiedot" showing and copying the line (`useCopyLine`, now with an optional room id)
- [x] 2.2 i18n (fi, en) for the section; tests in `SettingsScreen.test.tsx` (with room, without room, failure)

## 3. Wiki

- [x] 3.1 `docs/operations.md`: manual check step and bug runbook say the line is copied from settings; the id shares the link
- [x] 3.2 List the coordinator wiring (GameScreen → SettingsScreen `roomId`, WaitingRoomScreen → badge `invite="join"`)

Notes: wiring outside this job's files, left to the coordinator: `GameScreen` passes
`roomId={view.roomId}` to `SettingsScreen`; `WaitingRoomScreen` passes `invite="join"` to
`GameIdBadge`; `e2e/tests/helpers.ts` reads the game id from the badge's aria-label, which is now
"Peli <id>. Napauta jakaaksesi pelin linkin.".

## Coordinator wiring (after merge)

- [x] C.1 `GameScreen`: pass `roomId` to `SettingsScreen` so the bug-report line in a game names it.
- [x] C.2 `WaitingRoomScreen`: badge with `invite="join"` (join text instead of watch text).
- [x] C.3 `e2e/tests/helpers.ts`: game id read from the new badge label.
