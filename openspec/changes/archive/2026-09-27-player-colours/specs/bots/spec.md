## MODIFIED Requirements

### Requirement: Adding and removing bots
In the waiting room the host SHALL be able to seat a bot in any free seat and to remove a bot from
its seat. A bot takes an ordinary seat: it gets that seat's start corner and a pawn as pawn-looks says (its seat's pawn when free), and
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

