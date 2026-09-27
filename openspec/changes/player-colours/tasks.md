## 1. Protocol

- [x] 1.1 `LOOKS` (1–4), `pickLook(taken, seat, preferred?)`, `LookPayload`, `LOOK_TAKEN` error code, `look` join option and payload schema; unit tests for `pickLook` and the schemas

## 2. Server

- [x] 2.1 `Player.look`; `onJoin` and `seatBot` pick the look
- [x] 2.2 `setLook` command with `NOT_SEATED`, `WRONG_PHASE`, `LOOK_TAKEN`, same-look no-op; `player.look` log event
- [x] 2.3 Room tests: preferred/seat/lowest assignment, bot look, setLook accepted and rejections

## 3. Client

- [x] 3.1 `session/look.ts` preference store; join options carry `look`; `setLook` in the session (stores the preference too)
- [x] 3.2 View model `SeatView.look` (server `look`, fallback seat); device games keep `looks` in the save, fallback seat
- [x] 3.3 `Pawn` draws by look; PlayerStrip, TurnLine, result, TurnMarks, PawnLayer, waiting room use the player's look
- [x] 3.4 `LookPicker` component; on the start screen and in the waiting room (taken ones disabled); texts fi/en
- [x] 3.5 Tests: preference store, device-game looks, view model look, waiting-room picker

## 4. Check and docs

- [x] 4.1 UI check (portrait): start screen picker, waiting room change, the started game with the chosen pawn (device games covered by the unit test, not checked in the UI)
- [x] 4.2 Wiki (`docs/architecture.md`: state field, command, device-save field); roadmap item 22 done
