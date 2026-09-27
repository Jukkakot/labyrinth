## MODIFIED Requirements

### Requirement: Quick game against bots
The start screen SHALL offer quick games with bots in one section under the heading "Pikapeli
bottien kanssa", with a "Pelaan itse" switch that is on whenever the start screen opens. With the
switch on the section MUST offer "1v1", "1v2" and "1v3", the player against one, two or three bots;
with it off it MUST offer a game of bots only to watch (see spectators). Tapping "1v1", "1v2" or
"1v3" MUST start a new game on the player's own device, without contacting the server: the player
in seat 1, the bots in the following seats with the usual bot names, the treasure cards dealt and
the player on turn first, as the host of every game. The player MUST go straight to the board
without a waiting room or a connecting state. The game MUST follow the same rules, bot behaviour,
bot pacing, hint, turn marks and result as a game on the server, with two differences: it has no
turn time limit (nobody can be kicked), and nobody else can see, join or watch it. The buttons
MUST be disabled only for an invalid nickname; they MUST NOT wait for the server to wake up, and
they MUST work without a network connection. "Pelaa uudelleen" in a finished quick bot game MUST
start a new game against the same number of bots on the device at once. Leaving MUST end the game
without a winner. The server MUST NOT create a game with bots in it at creation: bots join a game
on the server only through its waiting room.

#### Scenario: One against one
- **WHEN** Maija taps "1v1" on the start screen
- **THEN** she sees the board with herself and Robo, each holding 12 treasure cards, and it is her turn

#### Scenario: One against three
- **WHEN** Maija taps "1v3"
- **THEN** the game starts with Maija, Robo, Pixel and Byte, each holding 6 treasure cards

#### Scenario: Switch on by default
- **WHEN** Maija opens the start screen, even after she turned "Pelaan itse" off earlier
- **THEN** "Pelaan itse" is on and "1v1", "1v2" and "1v3" are offered

#### Scenario: Not listed
- **WHEN** another player looks at the open games list while Maija plays a quick bot game
- **THEN** Maija's game is not in the list and cannot be joined or watched

#### Scenario: No waiting for the server
- **WHEN** the server is still being woken up and Maija taps "1v2"
- **THEN** she sees the board at once

#### Scenario: Offline
- **WHEN** Maija's phone has no network connection and she taps "1v1"
- **THEN** the game starts and can be played to the end

#### Scenario: Buttons wait like Play
- **WHEN** the nickname field holds "M"
- **THEN** "1v1", "1v2" and "1v3" are disabled like Play; a server still waking up does not disable them

#### Scenario: No turn clock
- **WHEN** Maija thinks about her shift for two minutes in a quick bot game
- **THEN** no turn time runs out and nobody can kick her

#### Scenario: Quick bot game again
- **WHEN** Maija taps "Pelaa uudelleen" after her 1v2 game against bots
- **THEN** a new game against two bots starts at once and she sees its board

#### Scenario: Leaving a quick bot game
- **WHEN** Maija leaves her quick bot game
- **THEN** she is back on the start screen and the game is gone

#### Scenario: Too many bots
- **WHEN** a request to create a game with 4 bots reaches the server
- **THEN** no game is created
