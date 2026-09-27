## MODIFIED Requirements

### Requirement: Rematch
In a finished game every seated person SHALL be offered "Pelaa uudelleen". The first tap of any
player MUST create one new game with the same settings as the finished one: the same matchmaking
pool, and a bot in every seat that held a bot when the finished game started, with the same bot
names. That player MUST be taken to the new game's waiting room as its host; every other player who
taps "Pelaa uudelleen" later MUST join the same new game's waiting room, in the lowest free seat. A
player who does not tap it stays with the finished game until they leave. If the new game can no
longer be joined (it started, filled up or closed), the player MUST be returned to the start screen
with "Peli ei ole enää avoinna". The rematch of a quick game against bots MUST start at once with
the same number of bots, like the original. A rematch MUST be rejected, without creating a game,
when:
- the sender has no seat (a spectator, or a player who already left): `NOT_SEATED`;
- the game has not finished: `WRONG_PHASE`;
- the server's game limit is reached: `SERVER_FULL`, shown as the server-full message.

#### Scenario: First player asks for a rematch
- **WHEN** Maija and Pekka have finished a game with Robo in seat 3, and Maija taps "Pelaa uudelleen"
- **THEN** Maija is the host of a new listed waiting room with Robo in seat 3

#### Scenario: Second player follows
- **WHEN** Pekka then taps "Pelaa uudelleen" in the finished game
- **THEN** Pekka joins Maija's new waiting room, and the finished game creates no second new game

#### Scenario: Private stays private
- **WHEN** a rematch is created (there are no private games any more)
- **THEN** the new game is listed like any other game with a free seat

#### Scenario: Quick bot game again
- **WHEN** Maija taps "Pelaa uudelleen" after her 1v2 game against bots
- **THEN** a new game against two bots starts at once and she sees its board

#### Scenario: Rematch already started
- **WHEN** Pekka taps "Pelaa uudelleen" after Maija has already started the new game
- **THEN** Pekka sees "Peli ei ole enää avoinna" on the start screen

#### Scenario: Rematch of a running game
- **WHEN** a player sends a rematch while the game is still running
- **THEN** it is rejected with `WRONG_PHASE` and no game is created
