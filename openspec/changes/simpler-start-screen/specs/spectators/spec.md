## REMOVED Requirements

### Requirement: Running games to watch
**Reason**: Private games are gone and games of bots to watch run on the device; replaced by "Started games to watch".
**Migration**: None; the list works as before.

## ADDED Requirements

### Requirement: Started games to watch
The start screen SHALL list, under "Käynnissä olevat pelit", the games on the server that have
started and not finished. Each entry MUST show the host's nickname and the number of seated players
(for example "Maija · 3 pelaajaa"). The list MUST update by itself like the open games list, and a
game MUST disappear from it when it finishes or closes. With no running games the section MUST NOT
be shown. Tapping an entry MUST join that game as a spectator, needs a valid nickname like every
join, and MUST be disabled whenever Play is. If the game can no longer be watched, the player MUST
stay on the start screen and see "Peli ei ole enää avoinna". Games on a player's own device (quick
bot games, games of bots to watch, the daily puzzle) MUST NOT be listed.

#### Scenario: A started game is listed
- **WHEN** the host of a game with 3 players starts it while the viewer is on the start screen
- **THEN** the game moves from the open games list to "Käynnissä olevat pelit" as "Maija · 3 pelaajaa"

#### Scenario: Watch from the list
- **WHEN** the viewer taps that entry
- **THEN** the viewer sees the game's board as a spectator, and no seat is taken

#### Scenario: Finished game disappears
- **WHEN** a listed game finishes
- **THEN** it is no longer in "Käynnissä olevat pelit"

#### Scenario: Device games are not listed
- **WHEN** a quick bot game or a game of bots to watch is running on someone's phone
- **THEN** it is not in "Käynnissä olevat pelit"

## MODIFIED Requirements

### Requirement: Watching a game of bots
With the start screen's "Pelaan itse" switch off, the quick bot section SHALL offer "2 bottia",
"3 bottia" and "4 bottia". Tapping one MUST start a new game of that many bots only on the player's
own device, without contacting the server, and show it to the player as its spectator: the bots in
seats 1 upwards with the usual bot names, the treasure cards dealt and a bot chosen at random on
turn first. The player MUST go straight to the board without a connecting state. The buttons MUST
be disabled only for an invalid nickname; they MUST NOT wait for the server to wake up, and they
MUST work without a network connection. The game is an ordinary game of bots with the same rules,
bot behaviour and bot pacing as on the server: they play until one wins. It has no turn clock,
nobody else can see, join or watch it, and it is not kept: leaving or reloading the page ends it,
and it MUST NOT replace or end a quick bot game saved on the device.

#### Scenario: Watch three bots
- **WHEN** the player turns "Pelaan itse" off and taps "3 bottia"
- **THEN** they see a started game of Robo, Pixel and Byte, each with 8 treasure cards, and the bots play by themselves

#### Scenario: Bots play to the end
- **WHEN** the spectator keeps watching
- **THEN** one of the bots eventually wins and the result is shown

#### Scenario: No waiting for the server
- **WHEN** the server is still being woken up and the player taps "2 bottia"
- **THEN** they see the board at once

#### Scenario: Not a game to join
- **WHEN** another player looks at the start screen while the bot game runs
- **THEN** the game is in neither list

#### Scenario: One bot is not a game
- **WHEN** the player turns "Pelaan itse" off
- **THEN** the smallest game offered is "2 bottia"

#### Scenario: Reload ends it
- **WHEN** the spectator reloads the page while watching
- **THEN** they are on the start screen and the watched game is gone

#### Scenario: Saved quick game kept
- **WHEN** the player has an unfinished 1v2 game saved, watches a game of 4 bots and leaves it
- **THEN** "Jatka peliä" still continues the 1v2 game

### Requirement: New bot game after watching
When a watched game with no person seated has finished, its spectators SHALL be offered "Uusi
bottipeli", which starts a new game of the same number of bots at the same speed on the viewer's
own device with the viewer as its spectator, and "Alkuun", which returns to the start screen.

#### Scenario: Watch another
- **WHEN** a game of 3 bots watched at 2× finishes and the spectator taps "Uusi bottipeli"
- **THEN** they watch a new game of 3 bots at 2× on their device

#### Scenario: After a game on the server
- **WHEN** a spectator of a game on the server whose people all left watches its 2 bots finish and taps "Uusi bottipeli"
- **THEN** they watch a new game of 2 bots on their device
