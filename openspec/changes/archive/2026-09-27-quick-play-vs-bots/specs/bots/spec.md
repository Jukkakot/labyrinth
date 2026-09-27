# Spec Delta

## ADDED Requirements

### Requirement: Quick game against bots
The start screen SHALL offer quick games against bots under the heading "Pikapeli botteja vastaan":
"1v1", "1v2" and "1v3", the player against one, two or three bots. Tapping one MUST create a new
game that is never listed and that nobody else can join, seat the player in seat 1 as its host and
the bots in the following seats, deal the treasure cards and start the game at once: the player
MUST go straight to the board without a waiting room. The first player MUST be drawn at random as
in every game. The buttons MUST be disabled whenever Play is (invalid nickname, server still
waking up), and while connecting and after a failed join the player MUST see the same waiting
state and calm retry message as for Play. The server MUST refuse a request for fewer than 1 or more
than 3 bots. From the start on it is an ordinary game with bots.

#### Scenario: One against one
- **WHEN** Maija taps "1v1" on the start screen
- **THEN** she sees the board with herself and Robo, each holding 12 treasure cards, and one of them has the turn

#### Scenario: One against three
- **WHEN** Maija taps "1v3"
- **THEN** the game starts with Maija, Robo, Pixel and Byte, each holding 6 treasure cards

#### Scenario: Not listed
- **WHEN** another player looks at the open games list while Maija plays a quick bot game
- **THEN** Maija's game is not in the list and cannot be joined

#### Scenario: Buttons wait like Play
- **WHEN** the nickname field holds "M", or the server is still being woken up
- **THEN** "1v1", "1v2" and "1v3" are disabled

#### Scenario: Leaving a quick bot game
- **WHEN** Maija leaves her quick bot game
- **THEN** she is back on the start screen and the game ends without a winner

#### Scenario: Too many bots
- **WHEN** a request to create a game with 4 bots reaches the server
- **THEN** no game is created
