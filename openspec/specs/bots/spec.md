# bots Specification

## Purpose
Computer-controlled players: how the host seats and removes them, how they play their turns under
the same rules as people, and how a game with bots ends when no person is left.

## Requirements

### Requirement: Adding and removing bots
In the waiting room the host SHALL be able to seat a bot in any free seat and to remove a bot from
its seat. A bot takes an ordinary seat: it gets that seat's start corner, pawn shape and colour, and
counts as a seated player for the start and for the seat count. A bot MUST get the first name from
Robo, Pixel, Byte, Nova that no other bot in the game has. Adding a bot MUST be rejected, without
changing the game, when:
- the sender has no seat: `NOT_SEATED`;
- the sender is not the host: `NOT_HOST`;
- the game is no longer in its waiting room: `WRONG_PHASE`;
- the named seat is taken, or is being taken by a person who is joining right now: `SEAT_TAKEN`.

Removing a bot MUST be rejected in the same way for `NOT_SEATED`, `NOT_HOST` and `WRONG_PHASE`, and
with `NOT_A_BOT` when the named seat holds no bot. A removed bot's seat is free again. A bot is
never the host.

#### Scenario: Host adds a bot
- **WHEN** the host, alone in the waiting room, adds a bot to seat 3
- **THEN** everyone sees Robo in seat 3 marked as a bot, and the host may start the game

#### Scenario: Second bot gets the next name
- **WHEN** the host adds bots to seats 2 and 4
- **THEN** seat 2 holds Robo and seat 4 holds Pixel

#### Scenario: Guest tries to add a bot
- **WHEN** a guest sends an add-bot for a free seat
- **THEN** it is rejected with `NOT_HOST` and the waiting room is unchanged

#### Scenario: Seat already taken
- **WHEN** the host adds a bot to the seat a guest sits in
- **THEN** it is rejected with `SEAT_TAKEN`

#### Scenario: Host removes a bot
- **WHEN** the host removes the bot in seat 3
- **THEN** seat 3 is free again for everyone

#### Scenario: Removing a person
- **WHEN** the host sends a remove-bot for a seat held by a person
- **THEN** it is rejected with `NOT_A_BOT` and that person keeps the seat

#### Scenario: No bots after the start
- **WHEN** the host sends an add-bot after the game has started
- **THEN** it is rejected with `WRONG_PHASE`

#### Scenario: A person joins where a bot was
- **WHEN** the host removes the bot in seat 2 and a new player joins
- **THEN** the new player gets seat 2

### Requirement: Bots play their turns
When a bot becomes the current player, it SHALL play its turn by itself under the same rules as a
person: first a shift, then a move. It MUST wait about 1.5 seconds before the shift and about 1
second between the shift and the move, so the people in the game can follow what it does. Its
commands MUST be checked exactly like a person's. A bot MUST always finish its turn: if an action
it chose were rejected, it MUST instead make an allowed shift and then stay. A bot never kicks
anyone, and its connection never drops. A bot's current target stays secret like everyone else's.

#### Scenario: Bot's turn
- **WHEN** the turn passes to a bot
- **THEN** after a short pause the bot's shift slides the tiles, after another short pause its pawn walks, and the turn passes on

#### Scenario: Bot starts the game
- **WHEN** a game starts and the bot in seat 2 is chosen to begin
- **THEN** the bot plays its first turn without anyone doing anything

#### Scenario: Bot target stays secret
- **WHEN** a person looks at a game with a bot
- **THEN** they can see how many treasures the bot has found and has left, but not the bot's current target

### Requirement: Bot turn choice
A bot SHALL choose its turn from every allowed shift (every insertion point except the forbidden
reverse, and every rotation of the spare tile) and every square it can then reach, using only
public information (the board, the spare tile, every pawn, how many treasures each player has
found and has left, which treasures each player has found, the last insertion) and its own current
target; it MUST NOT know any other player's target. If some shift lets it reach its current
target, the target tile or its start corner when every treasure is found, it MUST pick such a
shift and move onto the target. Otherwise it MUST look one turn ahead: it prefers the choice after
which the most of its possible next shifts would bring the target within reach, and then the one
that leaves it closest to the target on average, counting rows plus columns.

On most turns (about four in five) a bot MUST also hold back its opponents: among its choices it
prefers shifts that leave the opponents fewer treasures within reach of their next shift, counting
only treasures that could still be an opponent's target (not its own target and not any treasure
already found by anyone), weighing every opponent evenly and the leader (fewest cards left)
slightly more, and when the next player has found every treasure and could get home after this
shift, it MUST block that if it can without giving up collecting its own target. On the other
turns it plays only for itself, so that blocking never locks a game. Among equally good choices it
picks at random, and the choice MUST be reproducible from the game's recorded seed. A game among
bots only MUST always come to an end.

#### Scenario: Target reachable this turn
- **WHEN** a shift exists after which the bot's target tile is connected to its pawn
- **THEN** the bot makes such a shift and moves onto the target tile, collecting the treasure

#### Scenario: Target out of reach
- **WHEN** no shift connects the bot's pawn to its target
- **THEN** the bot ends its move where the most of its next shifts would bring the target within reach, and among those as close to it as possible

#### Scenario: Blocking the opponents
- **WHEN** the bot cannot collect and several shifts serve it about equally well
- **THEN** it prefers the shift that leaves its opponents the fewest treasures within reach

#### Scenario: Found treasures are no threat
- **WHEN** every treasure except the bot's own target has already been found
- **THEN** the bot's choice is the same as if it played only for itself, since no opponent can be heading for any treasure within reach

#### Scenario: Opponent about to win
- **WHEN** the next player has found every treasure, the bot cannot collect, and some shift keeps that player from getting home next turn
- **THEN** the bot usually makes such a shift

#### Scenario: Never the forbidden reverse
- **WHEN** the previous player pushed in at N1
- **THEN** the bot does not push in at S1

#### Scenario: Heading home
- **WHEN** the bot has found all its treasures and its start corner can be reached after some shift
- **THEN** the bot moves home and wins

#### Scenario: Bots finish a game
- **WHEN** four bots play a game from the start
- **THEN** one of them wins after a bounded number of turns

### Requirement: Game ends without people
A started game SHALL end as soon as no person is seated in it (every person has left, been kicked or
been removed after a long disconnect) and nobody is watching it, whatever bots remain; bots MUST NOT
play on alone and MUST NOT be declared the winner in that case. While at least one spectator is
watching, including a spectator whose connection has dropped and may still come back, the bots MUST
play on without people, and the game MUST end as described as soon as the last spectator leaves.
While at least one person is in the game, a person leaving MUST be handled as before: the last
player standing, person or bot, wins, and otherwise the game goes on with the bots.

#### Scenario: Solo player leaves a bot game
- **WHEN** the only person in a game with two bots leaves and nobody is watching
- **THEN** the game ends without a winner and nothing more happens in it

#### Scenario: One of two people leaves
- **WHEN** two people and a bot are playing and one person leaves
- **THEN** the game goes on between the remaining person and the bot

#### Scenario: Person kicks the only bot
- **WHEN** a person and a bot remain, the bot's turn time is up and the person kicks it
- **THEN** the person wins as the last player standing

#### Scenario: Bots play on for a spectator
- **WHEN** the only person in a game with two bots leaves while a spectator is watching
- **THEN** the two bots play on, and the spectator sees the game continue

#### Scenario: Last spectator leaves a bot-only game
- **WHEN** the only spectator of a game of bots leaves
- **THEN** the game ends without a winner and nothing more happens in it

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
