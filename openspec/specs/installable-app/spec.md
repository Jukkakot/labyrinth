# installable-app Specification

## Purpose
Let the web app live on the phone like an installed game: home-screen install, offline start and self-updates without losing a game.

## Requirements

### Requirement: Installable to the home screen
The app SHALL be installable to a phone's home screen as a web app: it MUST have a name
("Muuttuva labyrintti", short name "Labyrintti"), icons that also fit a round or masked launcher
icon, the app's theme colour, and it MUST open full screen without the browser's address bar, in
portrait orientation.

#### Scenario: Install offered
- **WHEN** a player opens the app in Chrome on Android
- **THEN** the browser offers to install it, and the installed app opens full screen with the labyrinth icon and the name "Labyrintti"

### Requirement: Opens offline
After the app has been opened once online, it SHALL open without a network connection, both from
the home screen and from its web address, and show the start screen. Without a network the actions
that need the server MUST behave as when the server cannot be reached; quick games against bots
and continuing a bot game on the device MUST work.

#### Scenario: Opened offline
- **WHEN** a player who has used the app before opens it in flight mode
- **THEN** the start screen shows, and "1v1" starts a game

### Requirement: Updates itself
When a new version of the app has been published, the app SHALL use it without the player doing
anything: at the latest on the next opening after the new version was found. An update MUST NOT
lose a game in progress: a game on the server is rejoined as after a reload, a game on the device
continues where it was.

#### Scenario: New version after a deploy
- **WHEN** a new version is deployed and a player opens the installed app twice
- **THEN** the second opening at the latest runs the new version

#### Scenario: Update during a bot game
- **WHEN** the app reloads itself to a new version during a quick game against bots
- **THEN** the same game continues on the board
