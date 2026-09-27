## REMOVED Requirements

### Requirement: Game identifier badge
**Reason**: Tapping the game id now shares the game's link; the bug-report line moves to the settings screen.
**Migration**: See "Game link badge" below and the settings requirement "Game details for a bug report".

## ADDED Requirements

### Requirement: Game link badge
In the waiting room and during a game, the game's readable identifier SHALL be shown small in the top area. Tapping the identifier of a server game MUST hand out the game's link (the invite link that contains the game id): through the device's share sheet where there is one, otherwise by copying the link and briefly confirming "Linkki kopioitu" / "Link copied". In the waiting room the shared text MUST invite the friend to join ("Liity Labyrintti-peliini"); once the game runs it MUST invite them to watch ("Katso Labyrintti-peliäni"). The link is the same in both cases: an invite link seats a friend in the waiting room or, once the game has started, lets them watch it. If neither sharing nor copying is possible, the link MUST be shown selectable instead. A game played on the device has no link: it MUST show a short label instead of its identifier, "Päivän pulma" / "Daily puzzle" for the daily puzzle and "Oma peli" / "Own game" for any other game on the device, and the label MUST NOT react to a tap. The badge MUST be at least 44 px tall to tap and its text MUST stay on one line on a phone in portrait.

#### Scenario: Share a running game
- **WHEN** Maija taps the game identifier `brave-otters-sing` during a game on a phone with a share sheet
- **THEN** the share sheet opens with the text "Katso Labyrintti-peliäni" and the game's link, which contains `game=brave-otters-sing`

#### Scenario: Share from the waiting room
- **WHEN** the host taps the game identifier in the waiting room
- **THEN** the shared text is "Liity Labyrintti-peliini" with the same game link

#### Scenario: No share sheet
- **WHEN** the player taps the game identifier on a device without a share sheet
- **THEN** the game's link is copied to the clipboard and "Linkki kopioitu" appears briefly

#### Scenario: Neither share nor copy works
- **WHEN** sharing is not available and copying fails
- **THEN** the link is shown in a selectable field

#### Scenario: Daily puzzle label
- **WHEN** the player is in the daily puzzle
- **THEN** the badge reads "Päivän pulma" instead of the `local-daily-…` identifier and tapping it does nothing

#### Scenario: Other game on the device
- **WHEN** the player is in a quick game against bots on the device
- **THEN** the badge reads "Oma peli" instead of the `local-…` identifier
