## MODIFIED Requirements

### Requirement: Game identifier badge
During a game, the game's readable identifier SHALL be shown small in the top area. A game played on the device MUST show a short label instead of its identifier: "Päivän pulma" / "Daily puzzle" for the daily puzzle and "Oma peli" / "Own game" for any other game on the device. Tapping it MUST copy a line with the full identifier (also for games on the device), the local date and time, and the app version (for example `Peli brave-otters-sing · 26.9.2026 14.32 · v a1b2c3d`) and briefly confirm that it was copied. If copying is not possible, the text MUST be shown selectable instead. The badge MUST be at least 44 px tall to tap and its text MUST stay on one line on a phone in portrait.

#### Scenario: Copy for a bug report
- **WHEN** the player taps the game identifier
- **THEN** the identifier, local date and time and version are copied to the clipboard and a short "Kopioitu" / "Copied" confirmation appears

#### Scenario: Daily puzzle label
- **WHEN** the player is in the daily puzzle
- **THEN** the badge reads "Päivän pulma" instead of the `local-daily-…` identifier
- **AND** tapping it copies a line with the full `local-daily-…` identifier

#### Scenario: Other game on the device
- **WHEN** the player is in a quick game against bots on the device
- **THEN** the badge reads "Oma peli" instead of the `local-…` identifier
