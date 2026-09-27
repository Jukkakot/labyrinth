## MODIFIED Requirements

### Requirement: Games on the device logged
A quick game against bots that runs on the player's device SHALL report its start and its end in
the client log entries shipped to the server: `client.local.started` with the game's id, the deal
seed, the seats and the starting seat, and `client.local.finished` with the winner (0 when the
player left) and the number of turns played. A daily puzzle SHALL report `client.daily.started`
with the game's id, the date and the seed, and `client.daily.finished` with the number of turns
once solved (leaving an unfinished puzzle is not an end). Entries written without a network
connection MUST be kept (within the client's buffer limit) and shipped once the server can be
reached again. Commands inside a game on the device MUST NOT be shipped one by one.

#### Scenario: Game on the device started
- **WHEN** Maija starts a 1v2 game on her phone while online
- **THEN** one `client.local.started` line with its deal seed, seats 1–3 and the starting seat reaches the server's log

#### Scenario: Played offline
- **WHEN** Maija finishes a bot game with no network and later opens the app online
- **THEN** its `client.local.started` and `client.local.finished` lines reach the server's log

#### Scenario: Daily puzzle solved
- **WHEN** Maija solves the puzzle of 2026-09-27 in 7 turns
- **THEN** a `client.daily.started` line with that date and a `client.daily.finished` line with 7 turns reach the server's log
