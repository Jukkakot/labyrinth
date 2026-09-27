## ADDED Requirements

### Requirement: Resume after closing the app
When the app is opened again after it was closed during a game (in the waiting room or running), the start screen SHALL offer "Jatka peliä" as its most prominent action, as long as the player's seat can still be held (the player was last connected less than 5 minutes ago). Tapping it MUST return the player to the same game and seat with everything they had. If the seat is gone by then (removed after 5 minutes, kicked, or the game closed), the player MUST see a calm notice that the game can no longer be continued, and the offer MUST disappear. The offer MUST NOT be shown for a game the player left on purpose, was kicked from, watched as a spectator, or that had finished. Starting or joining any other game MUST forget the offered game. While the server is still waking up, "Jatka peliä" MUST be shown disabled like the other join actions.

#### Scenario: App reopened mid-game
- **WHEN** a player closes the app during their game and opens it again 2 minutes later
- **THEN** the start screen offers "Jatka peliä", and tapping it puts them back in the same seat

#### Scenario: Too late
- **WHEN** a player opens the app again 10 minutes after closing it mid-game
- **THEN** the start screen does not offer "Jatka peliä"

#### Scenario: Seat already gone
- **WHEN** a player taps "Jatka peliä" but was removed from the game in the meantime
- **THEN** they stay on the start screen with a notice that the game can no longer be continued, and the offer is gone

#### Scenario: Left on purpose
- **WHEN** a player leaves a game with the leave action and opens the app again
- **THEN** the start screen does not offer "Jatka peliä"

#### Scenario: Another game started instead
- **WHEN** a player is offered "Jatka peliä" but starts a new game against bots
- **THEN** the old game is no longer offered afterwards

### Requirement: Server wake-up progress
While the start screen waits for a sleeping server to wake up, it SHALL show how long it has waited so far as minutes and seconds (for example "0:23"), updated every second, together with a loading animation. When the player prefers reduced motion, the animation MUST NOT move. The counter and animation MUST disappear once the server answers or the wait gives up.

#### Scenario: Waiting counts up
- **WHEN** the server has not answered for 23 seconds
- **THEN** the start screen shows "Herätetään palvelinta…" with "0:23" and a loading animation

#### Scenario: Reduced motion
- **WHEN** a player who prefers reduced motion opens the start screen while the server sleeps
- **THEN** the waiting time still counts up, and the loading indicator does not move
