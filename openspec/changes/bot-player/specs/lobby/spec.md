# Spec Delta

## MODIFIED Requirements

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

### Requirement: Waiting room
A new game SHALL start in its waiting room. The player who created the game is its host. The
waiting room MUST show the seated players in seat order with their nickname and pawn shape and
colour, mark the host, mark the viewer, and mark bots with a robot icon and the label "Botti". It
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

An accepted start MUST deal the treasure cards to the seated players, bots included, choose the
first player at random among them, and take every player from the waiting room to the board at
once. From then on the game MUST NOT accept new players and MUST NOT be listed.

#### Scenario: Host starts
- **WHEN** the host starts with 3 players seated
- **THEN** every player sees the board, each has 8 treasure cards, and one of the three has the turn with a running clock

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
