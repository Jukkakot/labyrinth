# Spec Delta

## ADDED Requirements

### Requirement: Turn limit and removals logged
The server SHALL log one `turn.expired` line, with the seat, when a turn's time runs out, and one `player.removed` line whenever a player is taken out of a running game, with their seat and the reason: `left`, `kicked` (with the kicking seat) or `timeout` (disconnected too long). A game finished because only one player is left MUST log `game.finished` with the winner and the reason `lastPlayer`; a game won by returning home logs the reason `home`.

#### Scenario: Kick logged
- **WHEN** the player in seat 2 kicks seat 1
- **THEN** one `cmd.accepted` line for `kick` and one `player.removed` line with seat 1, reason `kicked` and kicking seat 2 are written

#### Scenario: Expired turn logged
- **WHEN** seat 1's turn time runs out
- **THEN** one `turn.expired` line with seat 1 is written

#### Scenario: Disconnect timeout logged
- **WHEN** a disconnected player is removed after 5 minutes
- **THEN** one `player.removed` line with reason `timeout` is written
