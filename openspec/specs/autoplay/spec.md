# autoplay Specification

## Purpose
Lets a seated player hand their seat to the bot for a while and take it back, so a game keeps
moving while someone steps away or loses their connection, without losing their place.

## Requirements

### Requirement: Handing the seat to the bot
While a game runs (after the start, before it is finished), a seated person SHALL be able to turn
autoplay on for their own seat and off again, any number of times. Turning it on or off MUST be
rejected, without changing the game, when:
- the sender has no seat (a spectator too): `NOT_SEATED`;
- the game is in its waiting room or finished: `WRONG_PHASE`.

Turning on an autoplay that is already on, or off one that is already off, MUST be accepted and
change nothing. Nobody can turn autoplay on or off for another player's seat. A daily puzzle has no
autoplay: the request MUST be rejected with `WRONG_PHASE`.

#### Scenario: Hand over
- **WHEN** Maija, seated in a running game, turns autoplay on
- **THEN** her seat is auto-played from then on, and everyone in the game sees it

#### Scenario: Take back
- **WHEN** Maija turns autoplay off again
- **THEN** her seat is hers to play again from her next step on

#### Scenario: Before the start
- **WHEN** a player turns autoplay on in the waiting room
- **THEN** it is rejected with `WRONG_PHASE` and nothing changes

#### Scenario: Spectator
- **WHEN** a spectator sends an autoplay request
- **THEN** it is rejected with `NOT_SEATED`

#### Scenario: Daily puzzle
- **WHEN** a player asks for autoplay in the daily puzzle
- **THEN** it is rejected with `WRONG_PHASE` and the puzzle offers no such control

### Requirement: Bot plays an auto-played seat
When an auto-played seat becomes the current player, its turn SHALL be played exactly like a
bot's: the same way of choosing, the same pauses (about 1.5 seconds before the shift and 1 second
before the move), the same fallback to an allowed shift and staying, through the same checks. The
choice MUST use only what that seat's player may know: public information and the seat's own
current target. When autoplay is turned on during the seat's own turn, the bot MUST play the rest
of that turn from the step it is in, after the usual pause (after a shift the player already made,
it chooses only where to walk). When autoplay is turned off during the seat's own turn, the bot
MUST NOT take any further step of it: the player continues from the step the turn is in. While
autoplay is on, the seat's player's own shift and move MUST be rejected with `AUTOPLAYING`,
without changing the game. The turn clock runs for an auto-played seat as for anyone.

#### Scenario: Bot plays the turn
- **WHEN** the turn passes to Maija's auto-played seat
- **THEN** after a short pause her tile shift is made, after another her pawn walks, and the turn passes on

#### Scenario: Handed over mid-turn
- **WHEN** Maija has shifted and then turns autoplay on
- **THEN** after a short pause her pawn walks where the bot chooses, and the turn passes on

#### Scenario: Taken back before the shift
- **WHEN** it is Maija's auto-played turn and she turns autoplay off before the bot has shifted
- **THEN** no shift is made for her, and she can shift and move herself

#### Scenario: Taken back after the shift
- **WHEN** the bot has shifted for Maija and she turns autoplay off before it moves
- **THEN** her pawn does not move by itself, and she chooses where to walk

#### Scenario: Own command while auto-played
- **WHEN** Maija's seat is auto-played and a shift from Maija herself arrives
- **THEN** it is rejected with `AUTOPLAYING` and the board is unchanged

#### Scenario: Collecting
- **WHEN** the bot can reach Maija's current target during her auto-played turn
- **THEN** it collects the treasure for her, and her next card becomes her target

### Requirement: Autoplay shown to everyone
Every player and spectator SHALL see which seats are auto-played: the seat's chip MUST show the
robot icon next to the player's own nickname, and its accessible text MUST say that the bot is
playing for them. On an auto-played seat's turn the turn line MUST say that the bot is playing for
that player (for the viewer's own seat: that the bot is playing for them). The viewer's own shift
and move controls MUST be disabled while their seat is auto-played, and in their place the screen
MUST offer taking the turn back ("Ota vuoro takaisin") as the primary action. While the viewer
plays their own seat in a running game, the screen MUST offer handing it over ("Anna botin
pelata") as a secondary action that does not compete with the turn's controls.

#### Scenario: Others see it
- **WHEN** Maija turns autoplay on and Pekka looks at the game
- **THEN** Maija's chip shows the robot icon with her nickname, and on her turn Pekka's turn line says the bot is playing for Maija

#### Scenario: Own view
- **WHEN** Maija's seat is auto-played
- **THEN** her shift and move controls are disabled and she sees "Ota vuoro takaisin"

#### Scenario: Offer to hand over
- **WHEN** Maija plays her own seat in a running game
- **THEN** she can hand it to the bot from a secondary control, on her turn and on others' turns

### Requirement: Dropped player auto-played
When a seated player's connection drops in a running game, their seat SHALL be auto-played for as
long as their seat is held. When they come back, autoplay that started because of the drop MUST
end; autoplay they had turned on themselves MUST stay on. When the hold runs out, the player MUST
be removed as before. A player whose turn time runs out while connected MUST NOT be auto-played;
they can be kicked as before.

#### Scenario: Connection drops
- **WHEN** Pekka's connection drops and the turn passes to him
- **THEN** his turn is played by the bot after the usual pauses, and nobody needs to wait for his time to run out

#### Scenario: Back in time
- **WHEN** Pekka reconnects within five minutes
- **THEN** his seat is no longer auto-played and he plays his next step himself

#### Scenario: Chosen autoplay survives a drop
- **WHEN** Pekka had turned autoplay on, his connection drops, and he reconnects
- **THEN** his seat is still auto-played until he takes it back

#### Scenario: Slow but connected
- **WHEN** Pekka is connected and his turn time runs out
- **THEN** his seat is not auto-played and the others may kick him

### Requirement: Auto-played players are people
An auto-played person SHALL still count as a person for the end of a game: a game in which every
seated person is auto-played MUST go on, and the rules for a game with no person left apply only
when people actually leave, are kicked or are removed after a long disconnect.

#### Scenario: Everyone hands over
- **WHEN** the only person in a game with two bots turns autoplay on
- **THEN** the game goes on, all three seats played by the bot, until someone wins or the person takes back or leaves

### Requirement: Autoplay in games on the device
A quick game against bots on the device SHALL support autoplay in the same way (handing over, taking
back, showing it), and an auto-played seat MUST stay auto-played when the game is continued after a
reload or "Jatka peliä".

#### Scenario: Quick game plays itself
- **WHEN** Maija turns autoplay on in her 1v2 game against bots on the device
- **THEN** her turns are played by the bot until she takes her turn back

#### Scenario: Continued later
- **WHEN** Maija reloads the page while her seat in a device game is auto-played
- **THEN** the continued game still auto-plays her seat
