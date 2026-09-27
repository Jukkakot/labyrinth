# spectators Specification

## Purpose
Watching games without playing: joining a running game on the server, or a game of bots only on
the device, as a spectator, what
a spectator sees and may do, the bots' speed while only bots play, and how players see that they
are watched.

## Requirements

### Requirement: Running games to watch
The start screen SHALL list, under "Käynnissä olevat pelit", the public games that have started and
not finished. Each entry MUST show the host's nickname and the number of seated players (for
example "Maija · 3 pelaajaa"). The list MUST update by itself like the open games list, and a game
MUST disappear from it when it finishes or closes. With no running games the section MUST NOT be
shown. Tapping an entry MUST join that game as a spectator, needs a valid nickname like every join,
and MUST be disabled whenever Play is. If the game can no longer be watched, the player MUST stay
on the start screen and see "Peli ei ole enää avoinna". Private games MUST NOT be listed.

#### Scenario: A started game is listed
- **WHEN** the host of a public game with 3 players starts it while the viewer is on the start screen
- **THEN** the game moves from the open games list to "Käynnissä olevat pelit" as "Maija · 3 pelaajaa"

#### Scenario: Watch from the list
- **WHEN** the viewer taps that entry
- **THEN** the viewer sees the game's board as a spectator, and no seat is taken

#### Scenario: Finished game disappears
- **WHEN** a listed game finishes
- **THEN** it is no longer in "Käynnissä olevat pelit"

#### Scenario: Private games are not listed
- **WHEN** a private game or a quick bot game is running
- **THEN** it is not in "Käynnissä olevat pelit"

### Requirement: Watching by invite link
When "Liity peliin" of an invite link fails because the game has already started, the player SHALL
join that game as a spectator instead, and MUST be told once, briefly, that the game had already
started so they are watching it ("Peli oli jo alkanut – katsot sitä"). If the game cannot be
watched either (finished or gone), the player MUST see "Peli ei ole enää avoinna" on the normal
start screen.

#### Scenario: Invite to a running game
- **WHEN** a friend taps "Liity peliin" on the invite link of a game that started a minute ago
- **THEN** they see the running game as a spectator and a short message that it had already started

#### Scenario: Invite to a finished game
- **WHEN** someone taps "Liity peliin" on the invite link of a finished game
- **THEN** they see "Peli ei ole enää avoinna" on the start screen

### Requirement: Watching a game of bots
The start screen SHALL offer, under the heading "Katso bottien peliä", the buttons "2", "3" and "4".
Tapping one MUST create a new game that is never listed and that nobody can join as a player, seat
that many bots in seats 1 upwards, start it at once and show it to the player as its spectator. The
buttons MUST be disabled whenever Play is, and connecting and a failed attempt MUST look as for
Play. The server MUST refuse a request for fewer than 2 or more than 4 bots in such a game. The
game is an ordinary game of bots: they play by the normal rules until one wins.

#### Scenario: Watch three bots
- **WHEN** the player taps "3" under "Katso bottien peliä"
- **THEN** they see a started game of Robo, Pixel and Byte, each with 8 treasure cards, and the bots play by themselves

#### Scenario: Bots play to the end
- **WHEN** the spectator keeps watching
- **THEN** one of the bots eventually wins and the result is shown

#### Scenario: Not a game to join
- **WHEN** another player looks at the start screen while the bot game runs
- **THEN** the game is in neither list

#### Scenario: One bot is not a game
- **WHEN** a request to watch a game of 1 bot reaches the server
- **THEN** no game is created

### Requirement: What a spectator sees
A spectator SHALL see the same game screen as the players: the board, whose turn it is and the
step, the turn clock, every player's progress, departures and the result. A spectator MUST also see
every player's current target: in the progress strip on every chip, and on the board the target of
the player whose turn it is is highlighted. The screen MUST say that the viewer is watching
("Katsot peliä") where a player has their step controls. A spectator MUST NOT be offered shift,
move or kick controls, and every shift, move, kick or rematch a spectator sends MUST be rejected
with `NOT_SEATED` without changing the game. A spectator has no seat, pawn or nickname in the game.

#### Scenario: All targets visible
- **WHEN** a spectator watches a game in which Maija's target is the dragon and Pekka's the key
- **THEN** Maija's chip shows the dragon, Pekka's chip shows the key, and on Maija's turn the dragon's tile is highlighted

#### Scenario: Players' targets stay secret from each other
- **WHEN** a spectator is watching
- **THEN** each player still receives only their own target

#### Scenario: No controls
- **WHEN** it is a player's shift step
- **THEN** the spectator sees "Katsot peliä" and no arrows, spare-tile controls or kick buttons

#### Scenario: Spectator tries to move
- **WHEN** a spectator sends a move
- **THEN** it is rejected with `NOT_SEATED` and nothing changes

### Requirement: Spectators shown to players
While a game has at least one spectator, everyone in it SHALL see an eye icon with the number of
spectators in the top bar, with the accessible text "Katsojia: 2". Without spectators the icon MUST
NOT be shown. A game SHALL have at most 8 spectators at a time; a further spectator MUST be refused
as if the game could not be watched.

#### Scenario: Someone starts watching
- **WHEN** a spectator joins a running game of two players
- **THEN** both players see the eye icon with 1

#### Scenario: Last spectator leaves
- **WHEN** the only spectator leaves
- **THEN** the eye icon disappears for the players

### Requirement: Leaving as a spectator
A spectator SHALL leave with the top bar's leave action without a confirmation and MUST be on the
start screen at once. Leaving MUST NOT change the game for the players. A spectator whose
connection drops MUST be able to come back by reloading within 5 minutes, as a player can, and
counts as watching until then. A spectator MUST see the result when the game finishes and may stay
until they leave.

#### Scenario: Spectator leaves
- **WHEN** a spectator taps the leave action
- **THEN** they see the start screen at once, and the players' game goes on

#### Scenario: Spectator reloads
- **WHEN** a spectator reloads the page during the game
- **THEN** they are watching the same game again

### Requirement: Bot speed
While no person is seated in a running game, every spectator SHALL be offered the bots' speed:
"1×", "2×" and "4×", with the current one marked. 1× is the normal pace of bot turns; 2× and 4×
make every pause of a bot's turn two and four times shorter. A new game starts at 1×. Everyone
watching MUST see the same speed. A speed change MUST be rejected, without changing the game, when:
- the sender is not a spectator: `NOT_SPECTATOR`;
- a person is seated in the game: `PEOPLE_PLAYING`;
- the game is not running: `WRONG_PHASE`.

#### Scenario: Faster bots
- **WHEN** a spectator of a bot-only game taps "4×"
- **THEN** the bots' next turns come four times faster, and every spectator sees 4× marked

#### Scenario: Not while people play
- **WHEN** a spectator of a game with a seated person sends a speed change
- **THEN** it is rejected with `PEOPLE_PLAYING`, and the speed buttons are not offered to them

#### Scenario: Players cannot change the speed
- **WHEN** a seated player sends a speed change
- **THEN** it is rejected with `NOT_SPECTATOR`

### Requirement: New bot game after watching
When a watched game with no person seated has finished, its spectators SHALL be offered "Uusi
bottipeli", which starts a new game of the same number of bots at the same speed with the viewer as
its spectator, and "Alkuun", which returns to the start screen.

#### Scenario: Watch another
- **WHEN** a game of 3 bots watched at 2× finishes and the spectator taps "Uusi bottipeli"
- **THEN** they watch a new game of 3 bots at 2×
