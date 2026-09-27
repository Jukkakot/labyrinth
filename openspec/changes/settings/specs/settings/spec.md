## ADDED Requirements

### Requirement: Settings on the device
The player SHALL be able to open a settings screen from the start screen and, through a gear in the game's top bar, during a game, and return from it. During a game the settings screen covers the game while it keeps running, and it also holds the language choice (the game's top bar has no room for both). The
settings SHALL be kept on the device and survive a reload and a reopened app; they MUST NOT change
the game's rules or anything other players see. Without stored settings (or with unreadable ones)
the defaults apply: confirm shift on, confirm move off, theme system, sounds on, tab title on,
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

### Requirement: Shift confirmation setting
With confirm shift on, tapping an edge arrow SHALL only preview the shift, and a second tap on the
same arrow or the confirm button sends it. With confirm shift off, tapping an allowed edge arrow on
the viewer's shift step SHALL send the shift at once with the spare's current rotation; the
forbidden arrow stays unusable.

#### Scenario: One-tap shift
- **WHEN** confirm shift is off and Maija, on her shift step, taps an allowed arrow
- **THEN** the shift is sent at once with the spare as currently rotated

### Requirement: Move confirmation setting
With confirm move off, tapping a reachable square SHALL move there at once. With confirm move on,
tapping a reachable square SHALL only mark it as chosen; tapping it again or "Kävele tänne" moves
there, tapping another reachable square chooses that one instead, and "Peru" drops the choice. The
choice is dropped when the board or turn changes.

#### Scenario: Confirmed move
- **WHEN** confirm move is on and Maija taps a reachable square
- **THEN** the square is marked and nothing is sent until she taps it again or "Kävele tänne"

### Requirement: Theme setting
The theme SHALL be one of system, light or dark. System follows the device's colour scheme; light
and dark force that scheme regardless of the device. The stored theme MUST be applied before the
first screen is drawn, so the page does not flash the other scheme.

#### Scenario: Forced dark
- **WHEN** the device uses a light scheme and Maija picks dark
- **THEN** the app turns dark at once and stays dark after a reload

### Requirement: Sounds
With sounds on, a short, quiet sound SHALL play when the viewer's turn begins in a game with other
players and when the viewer collects a treasure. With sounds off, the app plays no sound. A
spectator and the daily puzzle (always the player's turn) get no turn sound.

#### Scenario: Turn sound
- **WHEN** sounds are on and the turn passes from a bot to Maija
- **THEN** a short sound plays once

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
