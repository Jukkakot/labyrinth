# Tasks

## 1. Copy feedback and badge

- [ ] 1.1 Add `ui/copyFeedback.ts` (`useCopyFeedback`: idle / copied for 2 s / fallback text)
- [ ] 1.2 `GameIdBadge`: server game shares `inviteUrl(roomId)` via `shareOrCopy` with join/watch text (`invite` prop), "Linkki kopioitu" after a copy, selectable URL on failure; device games render a plain label
- [ ] 1.3 i18n (fi, en): `game.watchShareText`, `game.linkLabel`, `game.linkFallback`; drop unused keys
- [ ] 1.4 Tests in `GameIdBadge.test.tsx` (share, copy, failure, join text, device labels); remove the old badge tests from `screens/screens.test.tsx`

## 2. Bug-report line in settings

- [ ] 2.1 `SettingsScreen` takes optional `roomId`; new "Vianilmoitus" section with "Kopioi pelin tiedot" showing and copying the line (`useCopyLine`, now with an optional room id)
- [ ] 2.2 i18n (fi, en) for the section; tests in `SettingsScreen.test.tsx` (with room, without room, failure)

## 3. Wiki

- [ ] 3.1 `docs/operations.md`: manual check step and bug runbook say the line is copied from settings; the id shares the link
- [ ] 3.2 List the coordinator wiring (GameScreen → SettingsScreen `roomId`, WaitingRoomScreen → badge `invite="join"`)
