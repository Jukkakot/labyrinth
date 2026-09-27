## MODIFIED Requirements

### Requirement: Treasures shown as icons
A tile carrying a treasure SHALL show that treasure's icon on its corridor while the treasure is still in play. Once any player has collected a treasure, its tile MUST be shown as a plain tile: no icon and no treasure name for assistive technology, on the board and in a shift preview. The tile carrying the viewer's current target MUST always show its treasure. The same treasure MUST always use the same icon, and the 24 treasures MUST use 24 different icons. Each treasure MUST have a localized name for assistive technology.

#### Scenario: Treasure tile
- **WHEN** the tile carrying the dragon is shown
- **THEN** it shows the dragon icon, and its accessible name includes the localized treasure name ("lohikäärme" / "dragon")

#### Scenario: Collected treasure hidden
- **WHEN** another player has collected the dragon
- **THEN** the dragon's tile is shown with its corridors but without the dragon icon or name, for players and spectators alike

#### Scenario: Own target always shown
- **WHEN** the tile carrying the viewer's current target is shown
- **THEN** it shows its treasure icon and the target highlight

### Requirement: Spare tile shown
The spare tile SHALL be shown next to the board in the same style as the board's tiles, including its treasure if it has one that is still in play; a collected treasure is left out as on the board.

#### Scenario: Spare with treasure
- **WHEN** the spare tile carries a treasure
- **THEN** the spare is shown with its corridors and treasure icon

#### Scenario: Spare with a collected treasure
- **WHEN** the spare tile carries a treasure that has already been collected
- **THEN** the spare is shown with its corridors but without the treasure icon
