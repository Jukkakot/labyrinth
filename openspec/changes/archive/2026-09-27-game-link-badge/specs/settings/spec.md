## ADDED Requirements

### Requirement: Game details for a bug report
The settings screen SHALL have a "Vianilmoitus" / "Report a problem" section that shows the line a player pastes into a bug report: when opened during a game, the game's full identifier (also the `local-…` identifier of a game on the device), then the local date and time and the app version (for example `Peli brave-otters-sing · 26.9.2026 14.32 · v a1b2c3d`); when opened from the start screen, only the date and time and the version. Tapping it MUST copy the line and briefly confirm "Kopioitu" / "Copied". If copying is not possible, the line MUST be shown selectable instead.

#### Scenario: Copy during a game
- **WHEN** Maija opens the settings during game `brave-otters-sing` and taps "Kopioi pelin tiedot"
- **THEN** a line with `brave-otters-sing`, the local date and time and the version is copied and "Kopioitu" appears

#### Scenario: Daily puzzle
- **WHEN** the player opens the settings during the daily puzzle and taps "Kopioi pelin tiedot"
- **THEN** the copied line carries the full `local-daily-…` identifier

#### Scenario: From the start screen
- **WHEN** the player opens the settings from the start screen and taps "Kopioi pelin tiedot"
- **THEN** a line with the local date and time and the version is copied

#### Scenario: Copying not possible
- **WHEN** copying fails
- **THEN** the line is shown in a selectable field
