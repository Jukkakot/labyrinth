# Tasks

## 1. Settings core

- [x] 1.1 `client/src/settings/settings.ts`: `Settings` type, defaults, load/save with merge and broken-storage fallback, subscribe store and `useSettings()` hook; unit tests
- [x] 1.2 Theme: `applyTheme` (`data-theme` on `<html>`), called in `main.tsx` and on change; `tokens.css` dark block for forced dark and system-not-light; unit test
- [x] 1.3 Sounds: `playSound("turn" | "treasure")` with Web Audio, silent when off or unsupported; vibration helper; unit test for the off/unsupported paths

## 2. Game wiring

- [x] 2.1 Turn alert hook (`useTurnAlert(view)`): fires on turn start per the spec, title only while hidden and restored on visibility/turn end; unit tests for when it fires and the title
- [x] 2.2 GameScreen: confirm shift off → one-tap shift; treasure sound; turn alert hook; render test for one-tap shift
- [x] 2.3 Confirm move: chosen square in `MoveTargets`, "Kävele tänne"/"Peru" in `MoveControls`, GameScreen state reset on board change; render test

## 3. Settings screen

- [x] 3.1 `SettingsScreen` (confirmations, theme segmented choice, sounds, turn notification: title, vibration disabled where unsupported), gear button in the start screen's top bar, "Takaisin"; fi/en strings; render test
- [x] 3.2 Gear in the game's top bar (instead of the language switcher) opens the settings over the game; inline theme script in `index.html`; render test

## 4. Docs

- [x] 4.1 Wiki: `docs/architecture.md` client paragraph on device settings (store, theme attribute, generated sounds, turn alert)

Notes: no UI check in this parallel job (the coordinator runs it); no in-game settings entry (placement left to the coordinator).
- [x] 4.2 Roadmap item 21 marked done
