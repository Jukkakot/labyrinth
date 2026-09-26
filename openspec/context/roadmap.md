# Roadmap

One OpenSpec change at a time, in this order. Adjust as we learn.

0. ~~`setup-infrastructure`~~ (done): Pages and Render live, server URL, CORS, MCP and VS Code debugging
1. ~~`add-logging`~~ (done): structured JSON logging, audit of commands and HTTP, client log shipping
2. ~~`add-board-model`~~ (done): tiles, board, connections, rotation (rules only)
3. ~~`add-board-setup`~~ (done): original tile distribution, treasures, seeded shuffle
4. `show-board`: quick play creates a room; the client renders the board on mobile (also verify `room.leave()` through the Render proxy, see add-logging design notes)
5. `tile-shift`
6. `pawn-movement`
7. `treasures-and-win`
8. `turn-rules`: 60 s limit, kick, disconnects
9. `lobby`: nickname, game list, private link, waiting room
10. `bot-player`
11. `spectators-and-rematch`
12. `settings`: confirmations, theme, sounds, turn notification
