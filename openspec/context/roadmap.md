# Roadmap

One OpenSpec change at a time, in this order. Adjust as we learn.

0. ~~`setup-infrastructure`~~ (done): Pages and Render live, server URL, CORS, MCP and VS Code debugging
1. ~~`add-logging`~~ (done): structured JSON logging, audit of commands and HTTP, client log shipping
2. ~~`add-board-model`~~ (done): tiles, board, connections, rotation (rules only)
3. ~~`add-board-setup`~~ (done): original tile distribution, treasures, seeded shuffle
4. ~~`show-board`~~ (done): quick play creates a room; the client renders the board on mobile
5. ~~`tile-shift`~~ (done): shift rule, turn order, `shift` command, arrows with preview and confirm
6. ~~`pawn-movement`~~ (done): pawn squares, shift → move turn, `move` command, reachable highlight, walking pawns
7. ~~`treasures-and-win`~~ (done): seeded deal, secret target, collect, return home, finished game, target highlight and result
8. ~~`turn-rules`~~ (done): 60 s turn clock, kick after the time is up, 5 min disconnect hold, last player standing wins
9. ~~`lobby`~~ (done): nickname, open games list, private games and invite links, waiting room with host start (24/n cards, random start seat), host leaving closes the room, game cap, local-first leave with a leave button in the game. Adding bots in the waiting room comes with `bot-player`
10. `bot-player`
11. `spectators-and-rematch`
12. `settings`: confirmations, theme, sounds, turn notification
