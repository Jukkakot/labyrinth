## MODIFIED Requirements

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

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Shift confirmation setting
**Reason**: Push and pick needs no shift confirmation, and one-tap shifting takes the same taps as push and pick while showing less.
**Migration**: "Työnnä erikseen" brings back the confirmed shift; the one-tap shift is gone.
