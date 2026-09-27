## ADDED Requirements

### Requirement: Games on the device logged
A quick game against bots that runs on the player's device SHALL report its start and its end in
the client log entries shipped to the server: `client.local.started` with the game's id, the deal
seed, the seats and the starting seat, and `client.local.finished` with the winner (0 when the
player left) and the number of turns played. Entries written without a network connection MUST be
kept (within the client's buffer limit) and shipped once the server can be reached again. Commands
inside a game on the device MUST NOT be shipped one by one.

#### Scenario: Game on the device started
- **WHEN** Maija starts a 1v2 game on her phone while online
- **THEN** one `client.local.started` line with its deal seed, seats 1–3 and the starting seat reaches the server's log

#### Scenario: Played offline
- **WHEN** Maija finishes a bot game with no network and later opens the app online
- **THEN** its `client.local.started` and `client.local.finished` lines reach the server's log
