## ADDED Requirements

### Requirement: Spectators and rematches logged
The server SHALL log one `spectator.joined` line when a spectator joins a game and one
`spectator.left` line when a spectator leaves or their dropped connection's hold runs out, each
with the number of spectators after the change. A speed change MUST produce the normal command
audit line with the new speed. A rematch MUST log one `game.rematch` line in the finished game with
the new game's id, so the two games can be followed together; the new game's own lines then follow
as for any game. A game that ends because nobody is seated or watching MUST log `game.finished` with
the reason `noPeople` and no winner, as before.

#### Scenario: Spectator logged
- **WHEN** a spectator joins a running game and later leaves
- **THEN** one `spectator.joined` line with 1 spectator and one `spectator.left` line with 0 spectators are written

#### Scenario: Rematch logged
- **WHEN** a player asks for a rematch of a finished game
- **THEN** one `cmd.accepted` line for `rematch` and one `game.rematch` line with the new game's id are written in the finished game

#### Scenario: Watched bot game ends
- **WHEN** the last spectator of a game of bots leaves
- **THEN** one `game.finished` line with the reason `noPeople` is written
