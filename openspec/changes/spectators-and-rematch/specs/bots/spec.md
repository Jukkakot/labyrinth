## MODIFIED Requirements

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
