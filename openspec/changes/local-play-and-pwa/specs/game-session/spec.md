## MODIFIED Requirements

### Requirement: Resume after closing the app
When the app is opened again after it was closed during a game (in the waiting room or running), the start screen SHALL offer "Jatka peliä" as its most prominent action. For a game on the server the offer MUST last as long as the player's seat can still be held (the player was last connected less than 5 minutes ago); for a quick game against bots on the device it MUST last until that game is finished, left or replaced, with no time limit. Tapping it MUST return the player to the same game and seat with everything they had; a game on the device MUST continue exactly where it was, whoever's turn it was. If the seat is gone by then (removed after 5 minutes, kicked, or the game closed), the player MUST see a calm notice that the game can no longer be continued, and the offer MUST disappear. The offer MUST NOT be shown for a game the player left on purpose, was kicked from, watched as a spectator, or that had finished. Starting or joining any other game MUST forget the offered game. While the server is still waking up, "Jatka peliä" for a game on the server MUST be shown disabled like the other join actions; for a game on the device it MUST be enabled, also without a network connection. Reloading the page during a game on the device MUST continue it without going through the start screen.

#### Scenario: App reopened mid-game
- **WHEN** a player closes the app during their game and opens it again 2 minutes later
- **THEN** the start screen offers "Jatka peliä", and tapping it puts them back in the same seat

#### Scenario: Too late
- **WHEN** a player opens the app again 10 minutes after closing it mid-game on the server
- **THEN** the start screen does not offer "Jatka peliä"

#### Scenario: Bot game on the device the next day
- **WHEN** a player closes the app during a quick game against bots and opens it again the next day without a network connection
- **THEN** the start screen offers "Jatka peliä", and tapping it shows the same board, cards and turn

#### Scenario: Reload during a bot game on the device
- **WHEN** a player reloads the page during a quick game against bots
- **THEN** the same game continues on the board

#### Scenario: Seat already gone
- **WHEN** a player taps "Jatka peliä" but was removed from the game in the meantime
- **THEN** they stay on the start screen with a notice that the game can no longer be continued, and the offer is gone

#### Scenario: Left on purpose
- **WHEN** a player leaves a game with the leave action and opens the app again
- **THEN** the start screen does not offer "Jatka peliä"

#### Scenario: Another game started instead
- **WHEN** a player is offered "Jatka peliä" but starts a new game against bots
- **THEN** the old game is no longer offered afterwards
