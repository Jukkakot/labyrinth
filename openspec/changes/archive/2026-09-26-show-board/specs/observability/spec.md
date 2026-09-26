# Spec Delta

## ADDED Requirements

### Requirement: Game setup logged with its seed
When a game's board is set up, the server SHALL log one `game.setup` line with the game identifier and the seed. The starting board of any logged game can then be reproduced exactly. The seed MUST appear only in server logs, never in client state.

#### Scenario: Reproduce a reported game's board
- **WHEN** a bug is reported for game `brave-otters-sing`
- **THEN** its `game.setup` line gives the seed, and setting up a board from that seed reproduces the game's starting board
