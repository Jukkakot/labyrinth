# Spec Delta

## ADDED Requirements

### Requirement: Bot activity logged
The server SHALL log one `bot.added` line when the host seats a bot and one `bot.removed` line when
the host removes one, each with the seat and the bot's name. Every command a bot makes MUST produce
the same audit line as a person's command, with the bot as the player and a field marking it as a
bot. When a bot has to fall back to an allowed action because its chosen one was rejected, the
server MUST log a `bot.fallback` line at `error` level with the rejected command and its code. A
game that ends because no person is left MUST log `game.finished` with the reason `noPeople` and
no winner.

#### Scenario: Bot seated
- **WHEN** the host adds a bot to seat 3
- **THEN** one `cmd.accepted` line for the add and one `bot.added` line with seat 3 and name Robo are written

#### Scenario: Bot turn audited
- **WHEN** a bot plays its turn
- **THEN** one `cmd.accepted` line for its shift and one for its move are written, both marked as a bot's

#### Scenario: Last person leaves a bot game
- **WHEN** the only person in a running game with bots leaves
- **THEN** one `game.finished` line with the reason `noPeople` is written
