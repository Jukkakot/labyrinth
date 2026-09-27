# Spec Delta

## ADDED Requirements

### Requirement: Central log store
When the production server is configured with a central log store, it SHALL send every log line it
writes, its own and the ones clients send it, to that store as well as to its standard output,
with the same fields plus the time the line was written (`time`). Lines MUST be sent in the
background in batches: a slow, failing or unreachable store MUST NOT delay or break any game or
request, and at worst loses log lines. Without that configuration, and always in development and
tests, the server MUST log exactly as before. The store MUST keep lines for at least 30 days and
MUST allow querying them by any field, for example every line of one game in time order.

#### Scenario: Game timeline
- **WHEN** a player reports a problem in game `brave-otters-sing`
- **THEN** one query in the log store returns every server and client line of that game in time order

#### Scenario: Store unreachable
- **WHEN** the log store does not answer
- **THEN** games go on normally and the lines still appear on the server's standard output

#### Scenario: Not configured
- **WHEN** the server runs without log store settings
- **THEN** it writes its lines only to its standard output, as before

### Requirement: Seat on player lines
A server log line about a seated player SHALL include that player's `seat` (1–4) next to `player`,
so a game can be followed by seat.

#### Scenario: Bot shift audited
- **WHEN** the bot in seat 2 shifts
- **THEN** its `cmd.accepted` line has `player` = `bot:2`, `bot` = true and `seat` = 2
