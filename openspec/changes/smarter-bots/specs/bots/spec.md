## MODIFIED Requirements

### Requirement: Bot turn choice
A bot SHALL choose its turn from every allowed shift (every insertion point except the forbidden
reverse, and every rotation of the spare tile) and every square it can then reach, using only
public information (the board, the spare tile, every pawn, how many treasures each player has
found and has left, the last insertion) and its own current target; it MUST NOT know any other
player's target. If some shift lets it reach its current target, the target tile or its start
corner when every treasure is found, it MUST pick such a shift and move onto the target. Otherwise
it MUST look one turn ahead: it prefers the choice after which the most of its possible next shifts
would bring the target within reach, and then the one that leaves it closest to the target on
average, counting rows plus columns.

On most turns (about four in five) a bot MUST also hold back its opponents: among its choices it
prefers shifts that leave the opponents fewer treasures within reach of their next shift, weighing
every opponent evenly and the leader (fewest cards left) slightly more, and when the next player
has found every treasure and could get home after this shift, it MUST block that if it can without
giving up collecting its own target. On the other turns it plays only for itself, so that blocking
never locks a game. Among equally good choices it picks at random, and the choice MUST be
reproducible from the game's recorded seed. A game among bots only MUST always come to an end.

#### Scenario: Target reachable this turn
- **WHEN** a shift exists after which the bot's target tile is connected to its pawn
- **THEN** the bot makes such a shift and moves onto the target tile, collecting the treasure

#### Scenario: Target out of reach
- **WHEN** no shift connects the bot's pawn to its target
- **THEN** the bot ends its move where the most of its next shifts would bring the target within reach, and among those as close to it as possible

#### Scenario: Blocking the opponents
- **WHEN** the bot cannot collect and several shifts serve it about equally well
- **THEN** it prefers the shift that leaves its opponents the fewest treasures within reach

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
