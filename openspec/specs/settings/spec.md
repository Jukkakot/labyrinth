# settings Specification

## Purpose
Device-only player settings: how a turn is played (push and pick or a separate shift), move confirmation, theme, sounds and the turn notification
(tab title, vibration), opened from the start screen and during a game.

## Requirements

### Requirement: Settings on the device
The player SHALL be able to open a settings screen from the start screen and, through a gear in the game's top bar, during a game, and return from it. During a game the settings screen covers the game while it keeps running, and it also holds the language choice (the game's top bar has no room for both). The
settings SHALL be kept on the device and survive a reload and a reopened app; they MUST NOT change
the game's rules or anything other players see. Without stored settings (or with unreadable ones)
the defaults apply: separate shift off, confirm move off, theme system, sounds on, tab title on,
vibration on. A change takes effect at once.

#### Scenario: Settings during a game
- **WHEN** Maija taps the gear in the game's top bar
- **THEN** the settings screen opens, and "Takaisin" returns to the same game

#### Scenario: Setting remembered
- **WHEN** Maija turns sounds off and reloads the page
- **THEN** the settings screen still shows sounds off and no sounds play

#### Scenario: Broken storage
- **WHEN** the stored settings cannot be read
- **THEN** the defaults apply and the app works normally

### Requirement: Move confirmation setting
With confirm move off, tapping a reachable square SHALL move there at once (in push and pick: send
the previewed shift and then the move). With confirm move on, tapping a reachable square SHALL only
mark it as chosen; tapping it again or "Kävele tänne" moves there (after the previewed shift in push
and pick), tapping another reachable square chooses that one instead, and "Peru" drops the choice.
The choice is dropped when the board or turn changes, or when the previewed shift is moved or its
tile rotated.

#### Scenario: Confirmed move
- **WHEN** confirm move is on and Maija taps a reachable square
- **THEN** the square is marked and nothing is sent until she taps it again or "Kävele tänne"

#### Scenario: Confirmed move in the preview
- **WHEN** confirm move is on and Maija, previewing N3, taps a reachable square and then "Kävele tänne"
- **THEN** the N3 shift is sent and then the move to that square

### Requirement: Theme setting
The theme SHALL be one of system, light or dark. System follows the device's colour scheme; light
and dark force that scheme regardless of the device. The stored theme MUST be applied before the
first screen is drawn, so the page does not flash the other scheme.

#### Scenario: Forced dark
- **WHEN** the device uses a light scheme and Maija picks dark
- **THEN** the app turns dark at once and stays dark after a reload

### Requirement: Sounds
With sounds on, a short, quiet sound SHALL play when the viewer's turn begins in a game with other
players, when the viewer collects a treasure, when a shift lands in a game the viewer plays in, and
when the game ends (a rising tune when the viewer wins or solves the daily puzzle, a short lower one
when someone else wins). With sounds off, the app plays no sound. A
spectator and the daily puzzle (always the player's turn) get no turn sound.

#### Scenario: Turn sound
- **WHEN** sounds are on and the turn passes from a bot to Maija
- **THEN** a short sound plays once

#### Scenario: Winning tune
- **WHEN** sounds are on and Maija's move wins the game
- **THEN** a rising three-note tune plays once

### Requirement: Turn notification
When the viewer's turn begins in a game with other players (not as a spectator, not while their
seat is auto-played, not in the daily puzzle):
- with tab title on and the page hidden, the page title SHALL announce that it is the viewer's
  turn until the page is visible again or the turn ends, then return to the normal title;
- with vibration on and a device that can vibrate, the device SHALL vibrate briefly once.

Where the device cannot vibrate, the vibration setting is shown disabled with a note.

#### Scenario: Backgrounded tab
- **WHEN** Maija has switched to another tab and her turn begins
- **THEN** the game's tab title says it is her turn, and it returns to normal when she comes back

#### Scenario: Visible page
- **WHEN** Maija is looking at the game when her turn begins
- **THEN** the title does not change (the sound and vibration settings still apply)

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

### Requirement: Separate shift setting
The setting "Työnnä erikseen" SHALL choose how a turn is played. Off (the default), the turn is push
and pick: the previewed shift is sent together with the move when a reachable square is tapped. On,
tapping an edge arrow only previews the shift, a second tap on the same arrow or "Työnnä" sends it,
and the move follows in the move step. A value stored by earlier versions for shift confirmation
MUST be ignored.

#### Scenario: Back to the separate shift
- **WHEN** Maija turns "Työnnä erikseen" on and taps an arrow and then "Työnnä"
- **THEN** only the shift is sent and she walks in the move step

#### Scenario: Old stored confirmation
- **WHEN** the device has shift confirmation stored as on from an earlier version
- **THEN** the game uses push and pick until the player turns "Työnnä erikseen" on
