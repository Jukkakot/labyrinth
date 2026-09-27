# lobby Specification

## Purpose
The way into a game before it starts: a nickname, the list of open games, invite links, and the
waiting room where the creator starts the game once enough players are in.

## Requirements

### Requirement: Nickname
Every player SHALL have a nickname before joining or creating a game. The start screen MUST have a
nickname field ("Nimimerkki"). A nickname is valid when, after trimming, it is 2–16 characters long
and contains no control characters. Play, "Luo yksityinen peli", joining from the list and
"Liity peliin" MUST be disabled while the nickname is invalid, and a short hint MUST say what is
wrong. The browser MUST remember the last nickname used and prefill the field with it; the
nickname MUST NOT be stored anywhere else in the browser. When no nickname is remembered, the field
MUST be prefilled with a random valid name, an adjective and an animal in the UI language (for
example "Rohkea Ilves"), drawn from lists long enough that two players rarely get the same one.
Next to the field a dice button ("Arvo uusi nimi") MUST replace the field's content with a new
random name. A random name is remembered only once the player joins with it. The server MUST
refuse to seat a player whose nickname is invalid. Nicknames need not be unique: players are still
told apart by pawn shape and colour.

#### Scenario: Valid nickname
- **WHEN** a player types "  Maija  " into the nickname field
- **THEN** the actions become available, and in the game they are called "Maija"

#### Scenario: Too short
- **WHEN** the nickname field holds "M"
- **THEN** every join and create action is disabled and a hint says the nickname needs 2–16 characters

#### Scenario: Remembered nickname
- **WHEN** a player who played as "Maija" opens the start screen again later in the same browser
- **THEN** the nickname field already says "Maija"

#### Scenario: Random name for a new player
- **WHEN** a player opens the start screen for the first time in a browser
- **THEN** the nickname field already holds a random name such as "Rohkea Ilves", and Play can be tapped at once

#### Scenario: Another random name
- **WHEN** the player taps the dice button
- **THEN** the field holds a new random name

#### Scenario: Server refuses an invalid nickname
- **WHEN** a join arrives at the server with a whitespace-only nickname
- **THEN** the join is refused and no seat is taken

#### Scenario: Same nickname twice
- **WHEN** two players both call themselves "Maija"
- **THEN** both are seated, told apart by their pawns

### Requirement: Open games list
The start screen SHALL list the public games that are still in their waiting room and have a free
seat. Each entry MUST show the host's nickname and how many of the 4 seats are taken, bots included
(for example "Maija · 2/4"). The list MUST update by itself while the start screen is open: new
games appear, and games that fill up (with people or bots), start or close disappear. Tapping an
entry MUST join that game's waiting room. If the game can no longer be joined, the player MUST stay
on the start screen and see a calm message that the game is no longer open ("Peli ei ole enää
avoinna"). With no open games, the list MUST say so briefly. Private games and started games MUST
NOT be listed.

#### Scenario: A game appears
- **WHEN** another player creates a public game while the viewer is on the start screen
- **THEN** it appears in the viewer's list with the host's nickname and 1/4, without reloading

#### Scenario: Bots count as taken seats
- **WHEN** the host of a listed game adds a bot
- **THEN** its entry changes from 1/4 to 2/4, and after the host fills every free seat with bots it disappears from the list

#### Scenario: Join from the list
- **WHEN** the viewer taps "Maija · 2/4"
- **THEN** the viewer is seated in Maija's waiting room

#### Scenario: Game started meanwhile
- **WHEN** the viewer taps an entry just after that game started
- **THEN** the viewer stays on the start screen and sees "Peli ei ole enää avoinna"

#### Scenario: Started and private games hidden
- **WHEN** a public game starts, and another player creates a private game
- **THEN** neither is in the list

### Requirement: Private game and invite link
The start screen SHALL offer "Luo yksityinen peli", which creates a new private game with the
player as its host and takes them to its waiting room. A private game MUST NOT appear in the list
and quick play MUST NOT place anyone in it. Every game, public or private, has an invite link
that contains its game id. Opening an invite link MUST show the start screen in invite mode: it
says the player has been invited to a game, shows the nickname field and a "Liity peliin" action,
and offers a way back to the normal start screen. "Liity peliin" MUST seat the player in that game's
waiting room. If the game does not exist any more, is full or has started, the player MUST see
"Peli ei ole enää avoinna" and the normal start screen. After the invite link has been used, a
reload MUST NOT use the link again.

#### Scenario: Create a private game
- **WHEN** a player taps "Luo yksityinen peli"
- **THEN** they are the host of a new game's waiting room, and the game is not in anyone's list

#### Scenario: Join by invite link
- **WHEN** a friend opens the invite link of that private game, enters a nickname and taps "Liity peliin"
- **THEN** they are seated in the same waiting room

#### Scenario: Stale invite link
- **WHEN** someone opens an invite link after that game has started
- **THEN** they see "Peli ei ole enää avoinna" and the normal start screen

#### Scenario: Quick play skips private games
- **WHEN** the only game with a free seat is private and a player taps Play
- **THEN** a new public game is created for them

### Requirement: Waiting room
A new game SHALL start in its waiting room. The player who created the game is its host. The
waiting room MUST show the seated players in seat order with their nickname and pawn shape and
colour, mark the host, mark the viewer, and mark bots with a robot icon and the label "botti" (lower case like the other marks). It
MUST offer "Kutsu pelaajia", which shares the game's invite link through the device's share sheet
where available and otherwise copies it and says so ("Linkki kopioitu"). The host MUST see an
"Lisää botti" action in every free seat and a remove action ("Poista botti") on every bot; other
players MUST NOT see either. The host MUST see "Aloita peli", disabled with the hint "Tarvitaan
vähintään 2 pelaajaa" until at least 2 players, people or bots, are seated. Other players MUST see
that they are waiting for the host to start ("Odotetaan, että Maija aloittaa pelin"). A player whose
connection drops in the waiting room keeps their seat in the same way as in a game and is shown as
disconnected.

#### Scenario: Host alone
- **WHEN** a player has just created a game
- **THEN** they see the waiting room with themselves as host, "Kutsu pelaajia", "Lisää botti" in the three free seats, and "Aloita peli" disabled with the two-player hint

#### Scenario: Solo game with a bot
- **WHEN** the host alone taps "Lisää botti" in seat 2
- **THEN** Robo appears in seat 2 with the bot mark, and "Aloita peli" becomes enabled

#### Scenario: Second player arrives
- **WHEN** a second player joins the waiting room
- **THEN** both see two players listed, and the host's "Aloita peli" becomes enabled

#### Scenario: Guest view
- **WHEN** a player who is not the host looks at the waiting room
- **THEN** they see who is seated, which seats hold bots, and "Odotetaan, että <host> aloittaa pelin", and no start or bot actions

#### Scenario: Share the invite link
- **WHEN** a player taps "Kutsu pelaajia" on a phone with a share sheet
- **THEN** the share sheet opens with the game's invite link

### Requirement: Starting the game
Only the host SHALL be able to start the game, only in the waiting room, and only with at least 2
players seated, counting bots. A start MUST be rejected, without changing the game, when:
- the sender has no seat: `NOT_SEATED`;
- the sender is not the host: `NOT_HOST`;
- the game is no longer in its waiting room: `WRONG_PHASE`;
- fewer than 2 players are seated: `NOT_ENOUGH_PLAYERS`.

An accepted start MUST deal the treasure cards to the seated players, bots included, give the
first turn to the host, and take every player from the waiting room to the board at
once. From then on the game MUST NOT accept new players and MUST NOT be listed.

#### Scenario: Host starts
- **WHEN** the host starts with 3 players seated
- **THEN** every player sees the board, each has 8 treasure cards, and the host has the turn with a running clock

#### Scenario: Host starts against bots
- **WHEN** the host starts with two bots seated and no other people
- **THEN** the host and each bot have 8 treasure cards, and the game begins

#### Scenario: Guest tries to start
- **WHEN** a player who is not the host sends a start
- **THEN** it is rejected with `NOT_HOST` and the waiting room is unchanged

#### Scenario: Host alone tries to start
- **WHEN** the host sends a start while alone
- **THEN** it is rejected with `NOT_ENOUGH_PLAYERS`

#### Scenario: Start twice
- **WHEN** the host sends a start after the game has started
- **THEN** it is rejected with `WRONG_PHASE` and nothing changes

#### Scenario: No joining after the start
- **WHEN** someone tries to join a started game by its invite link
- **THEN** they are not seated

### Requirement: Leaving the waiting room
Every player SHALL be able to leave the waiting room ("Poistu"); their seat becomes free and the
others see them disappear from the list. When the host leaves the waiting room, including when a
dropped host's seat hold runs out, the game MUST close for everyone: the other players MUST be
returned to the start screen with the calm message "Pelin luoja poistui, joten peli suljettiin". Before
the host leaves with other players seated, the host MUST confirm ("Peli suljetaan kaikilta.
Poistutaanko?").

#### Scenario: Guest leaves
- **WHEN** a guest taps "Poistu" in the waiting room
- **THEN** they are back on the start screen, and the others see one player fewer

#### Scenario: Host leaves
- **WHEN** the host confirms leaving while two guests wait
- **THEN** the game closes and both guests see the start screen with "Pelin luoja poistui, joten peli suljettiin"

### Requirement: Game limit
The server SHALL keep at most a fixed number of games open at a time. When that many games exist,
creating a new game, including by quick play when no game has a free seat, MUST be refused, and the
player MUST see a calm message that the server is full and to try again later ("Palvelin on täynnä –
yritä hetken päästä uudelleen"). Joining an existing game MUST still work.

#### Scenario: Server full
- **WHEN** the game limit is reached and a player taps "Luo yksityinen peli"
- **THEN** no game is created and the player sees the server-full message
