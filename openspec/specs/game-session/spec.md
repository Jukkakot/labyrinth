# game-session Specification

## Purpose
Get players into a game: quick play from the start screen, a fresh seeded board for every new game, seats on the start corners, and one player per browser tab that survives a page reload.

## Requirements

### Requirement: Quick play
The start screen SHALL offer a single Play action. Play MUST seat the player in the waiting room of a public game that has not started and has a free seat, or create a new public game with the player as its host when none has. Play needs a valid nickname. While the connection is being made the player MUST see a waiting state. The server may need up to about a minute to wake up, so the waiting state MUST say it is connecting. If joining fails, the player MUST see a calm message with a retry action, and technical details MUST NOT be shown.

As soon as the start screen opens, the client SHALL ask the server once for its build information, so that a sleeping server starts waking immediately. Until the server has answered, Play MUST be shown disabled, and the screen MUST say that the server is being woken up ("Herätetään palvelinta…"). If this takes more than a few seconds, the screen MUST add that it can take about a minute. When the server answers, Play MUST become available. If the server has not answered within about 90 seconds, Play MUST become available anyway, with a short calm note that the server did not answer yet. The client MUST NOT keep contacting the server after it has answered.

#### Scenario: First player
- **WHEN** a player taps Play and no public game is waiting with a free seat
- **THEN** a new public game is created and the player sees its waiting room as the host

#### Scenario: Second player joins the open game
- **WHEN** a second player taps Play while that game is waiting with a free seat
- **THEN** they join the same waiting room and both see each other listed

#### Scenario: Slow server
- **WHEN** the server takes several seconds to answer
- **THEN** the player sees a "connecting" state instead of an empty or frozen screen

#### Scenario: Join fails
- **WHEN** the server cannot be reached
- **THEN** the player sees a short localized message and a retry button

#### Scenario: Sleeping server is woken on open
- **WHEN** the start screen opens and the server is asleep
- **THEN** a request to the server is sent immediately, Play is shown disabled, and the screen says "Herätetään palvelinta…"

#### Scenario: Server wakes up
- **WHEN** the server answers while the start screen is open
- **THEN** the waking message disappears and Play can be tapped

#### Scenario: Awake server
- **WHEN** the server is already awake
- **THEN** Play becomes available almost at once, without a noticeable waiting message

#### Scenario: Server does not answer
- **WHEN** the server has not answered after about 90 seconds
- **THEN** Play becomes available with a calm note that the server did not answer yet, and tapping it follows the normal connecting and join-error flow

### Requirement: Seeded game setup
When a game is created, the server SHALL draw a random seed and set up the original starting board from it. Every player in the game MUST see the identical board. The seed MUST stay on the server and MUST NOT be sent to any client.

#### Scenario: Identical board for everyone
- **WHEN** two players are in the same game
- **THEN** every square shows the same tile with the same rotation for both, and the spare tile is the same

#### Scenario: New games differ
- **WHEN** two new games are created
- **THEN** their boards come from independently drawn seeds

#### Scenario: Seed is private
- **WHEN** the state a client receives is inspected
- **THEN** it contains no seed

### Requirement: Seats and start corners
A game SHALL have at most 4 players. Seats are taken only in the waiting room: each joining player MUST get the lowest free seat, 1 to 4. The seats map clockwise to the start corners: seat 1 top-left, seat 2 top-right, seat 3 bottom-right, seat 4 bottom-left. Players keep the seat they had in the waiting room when the game starts. A player who taps Play while every waiting public game is full MUST get a new game.

#### Scenario: Seats in join order
- **WHEN** three players join a new game's waiting room one after another
- **THEN** they get seats 1, 2 and 3, on the top-left, top-right and bottom-right corners

#### Scenario: Full game
- **WHEN** a fifth player taps Play while the only waiting game has 4 players
- **THEN** the fifth player is placed in a different, new game

#### Scenario: Freed seat is reused
- **WHEN** the player in seat 2 leaves the waiting room and another player joins
- **THEN** the new player gets seat 2

#### Scenario: Seats kept at the start
- **WHEN** players in seats 1 and 3 start the game
- **THEN** their pawns stand on the top-left and bottom-right corners

### Requirement: One player per browser tab
Each browser tab SHALL be its own player: two tabs of the same browser are two players. Reloading a tab during a game MUST return that tab to the same game and seat, as long as its seat is still held.

#### Scenario: Two tabs, two players
- **WHEN** a user taps Play in two tabs of the same browser
- **THEN** the two tabs are two different players in the game

#### Scenario: Reload keeps the seat
- **WHEN** a player reloads the page during a game
- **THEN** they are back in the same game, in the same seat, without tapping Play again

### Requirement: Finished games are closed
Quick play, the games list and invite links SHALL only place a player in a game that is still in its waiting room. A started or finished game MUST NOT accept new players. Players already in a finished game MAY stay and look at the final board until they leave.

#### Scenario: Only game is finished
- **WHEN** a player taps Play while the only game with free seats has finished
- **THEN** the player is placed in a new game

#### Scenario: Only game is running
- **WHEN** a player taps Play while the only game with free seats has started
- **THEN** the player is placed in a new game

### Requirement: Leaving the game
A player SHALL be able to leave a running game on purpose with a leave action in the game screen's top bar, after confirming it ("Poistutaanko pelistä? Nappulasi ja aarteesi poistuvat pelistä." with "Poistu" and "Peru"). A player who leaves a running game, whether they leave themselves, are kicked or are removed after a long disconnect, SHALL be removed from the game completely: their pawn disappears from the board, their treasure stack and found treasures are gone, and their seat stays empty for the rest of the game. The other players MUST see who left. The leaving player MUST be back on the start screen at once, even if the server is slow to confirm. In a finished game the leave action MUST NOT ask for confirmation, and a player who leaves a finished game MUST NOT change its result.

#### Scenario: Player leaves mid-game
- **WHEN** the player in seat 2 leaves while seats 1 and 3 keep playing
- **THEN** seat 2's pawn and progress disappear for everyone, and the other players see that seat 2's player left

#### Scenario: Confirm before leaving
- **WHEN** a player taps the leave action during a running game
- **THEN** nothing happens until they confirm with "Poistu", and "Peru" keeps them in the game

#### Scenario: Leaving returns at once
- **WHEN** a player confirms leaving and the server's confirmation is delayed
- **THEN** the player sees the start screen immediately, and a reload does not bring them back into the game

#### Scenario: Leaving a finished game
- **WHEN** a player leaves after the game has finished
- **THEN** the winner and the finished state stay as they were

### Requirement: Dropped connection
A dropped connection SHALL NOT count as leaving. The player MUST keep their seat, pawn and treasures for 5 minutes and MUST be shown to every player as disconnected. The turn still passes to a disconnected player, and the turn time limit and kicking apply to them as to anyone else. If the player comes back within 5 minutes, for example by reloading the page, they MUST continue in the same seat with everything they had. After 5 minutes disconnected, the player MUST be removed from the game automatically, as if they had left.

#### Scenario: Shown as disconnected
- **WHEN** the connection of the player in seat 2 drops
- **THEN** every other player sees seat 2 marked as disconnected, and seat 2 keeps its pawn and treasures

#### Scenario: Back in time
- **WHEN** a disconnected player reconnects after 4 minutes
- **THEN** they are back in their seat with their pawn, treasures and target, and no longer marked disconnected

#### Scenario: Removed after five minutes
- **WHEN** a player has been disconnected for 5 minutes
- **THEN** they are removed from the game as if they had left, and a later reconnect attempt returns them to the start screen

### Requirement: Kicked player informed
A player who is kicked SHALL be returned to the start screen, which MUST say calmly that they were removed from the game because their turn time ran out ("Sinut poistettiin pelistä, koska vuorosi aika loppui"). The message MUST disappear when they start a new game.

#### Scenario: Kicked
- **WHEN** the viewer is kicked from the game
- **THEN** they see the start screen with the removal message and can tap Play to start again

### Requirement: Rematch
In a finished game every seated person SHALL be offered "Pelaa uudelleen". The first tap of any
player MUST create one new game with the same settings as the finished one: public or private, the
same matchmaking pool, and a bot in every seat that held a bot when the finished game started, with
the same bot names. That player MUST be taken to the new game's waiting room as its host; every
other player who taps "Pelaa uudelleen" later MUST join the same new game's waiting room, in the
lowest free seat. A player who does not tap it stays with the finished game until they leave. If
the new game can no longer be joined (it started, filled up or closed), the player MUST be returned
to the start screen with "Peli ei ole enää avoinna". The rematch of a quick game against bots MUST
start at once with the same number of bots, like the original. A rematch MUST be rejected, without
creating a game, when:
- the sender has no seat (a spectator, or a player who already left): `NOT_SEATED`;
- the game has not finished: `WRONG_PHASE`;
- the server's game limit is reached: `SERVER_FULL`, shown as the server-full message.

#### Scenario: First player asks for a rematch
- **WHEN** Maija and Pekka have finished a public game with Robo in seat 3, and Maija taps "Pelaa uudelleen"
- **THEN** Maija is the host of a new public waiting room with Robo in seat 3

#### Scenario: Second player follows
- **WHEN** Pekka then taps "Pelaa uudelleen" in the finished game
- **THEN** Pekka joins Maija's new waiting room, and the finished game creates no second new game

#### Scenario: Private stays private
- **WHEN** the players of a finished private game ask for a rematch
- **THEN** the new game is private and not listed

#### Scenario: Quick bot game again
- **WHEN** Maija taps "Pelaa uudelleen" after her 1v2 game against bots
- **THEN** a new game against two bots starts at once and she sees its board

#### Scenario: Rematch already started
- **WHEN** Pekka taps "Pelaa uudelleen" after Maija has already started the new game
- **THEN** Pekka sees "Peli ei ole enää avoinna" on the start screen

#### Scenario: Rematch of a running game
- **WHEN** a player sends a rematch while the game is still running
- **THEN** it is rejected with `WRONG_PHASE` and no game is created

### Requirement: Resume after closing the app
When the app is opened again after it was closed during a game (in the waiting room or running), the start screen SHALL offer "Jatka peliä" as its most prominent action, as long as the player's seat can still be held (the player was last connected less than 5 minutes ago). Tapping it MUST return the player to the same game and seat with everything they had. If the seat is gone by then (removed after 5 minutes, kicked, or the game closed), the player MUST see a calm notice that the game can no longer be continued, and the offer MUST disappear. The offer MUST NOT be shown for a game the player left on purpose, was kicked from, watched as a spectator, or that had finished. Starting or joining any other game MUST forget the offered game. While the server is still waking up, "Jatka peliä" MUST be shown disabled like the other join actions.

#### Scenario: App reopened mid-game
- **WHEN** a player closes the app during their game and opens it again 2 minutes later
- **THEN** the start screen offers "Jatka peliä", and tapping it puts them back in the same seat

#### Scenario: Too late
- **WHEN** a player opens the app again 10 minutes after closing it mid-game
- **THEN** the start screen does not offer "Jatka peliä"

#### Scenario: Seat already gone
- **WHEN** a player taps "Jatka peliä" but was removed from the game in the meantime
- **THEN** they stay on the start screen with a notice that the game can no longer be continued, and the offer is gone

#### Scenario: Left on purpose
- **WHEN** a player leaves a game with the leave action and opens the app again
- **THEN** the start screen does not offer "Jatka peliä"

#### Scenario: Another game started instead
- **WHEN** a player is offered "Jatka peliä" but starts a new game against bots
- **THEN** the old game is no longer offered afterwards

### Requirement: Server wake-up progress
While the start screen waits for a sleeping server to wake up, it SHALL show how long it has waited so far as minutes and seconds (for example "0:23"), updated every second, together with a loading animation. When the player prefers reduced motion, the animation MUST NOT move. The counter and animation MUST disappear once the server answers or the wait gives up.

#### Scenario: Waiting counts up
- **WHEN** the server has not answered for 23 seconds
- **THEN** the start screen shows "Herätetään palvelinta…" with "0:23" and a loading animation

#### Scenario: Reduced motion
- **WHEN** a player who prefers reduced motion opens the start screen while the server sleeps
- **THEN** the waiting time still counts up, and the loading indicator does not move
